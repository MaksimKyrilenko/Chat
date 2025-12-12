import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Constants (local copy)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export interface FileDocument {
  _id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  path: string;
  url: string;
  thumbnailUrl?: string;
  metadata: Record<string, any>;
  chatId?: string;
  messageId?: string;
  isProcessed: boolean;
  createdAt: Date;
}

@Injectable()
export class FilesService implements OnModuleInit {
  private minioClient: Minio.Client;
  private buckets = {
    avatars: 'ultrachat-avatars',
    attachments: 'ultrachat-attachments',
    stickers: 'ultrachat-stickers',
    voice: 'ultrachat-voice',
  };

  constructor(
    private readonly config: ConfigService,
    @InjectModel('File') private readonly fileModel: Model<FileDocument>,
  ) {}

  async onModuleInit() {
    this.minioClient = new Minio.Client({
      endPoint: this.config.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.config.get('MINIO_PORT', '9000')),
      useSSL: this.config.get('MINIO_USE_SSL') === 'true',
      accessKey: this.config.get('MINIO_ACCESS_KEY', 'ultrachat'),
      secretKey: this.config.get('MINIO_SECRET_KEY', 'ultrachat_minio'),
    });

    // Ensure buckets exist
    for (const bucket of Object.values(this.buckets)) {
      const exists = await this.minioClient.bucketExists(bucket);
      if (!exists) {
        await this.minioClient.makeBucket(bucket);
        // Set bucket policy for public read access
        await this.setBucketPolicy(bucket);
      }
    }
  }

  async getUploadUrl(
    userId: string,
    filename: string,
    mimeType: string,
    size: number,
  ): Promise<{ uploadId: string; uploadUrl: string; expiresAt: Date }> {
    if (size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds maximum allowed');
    }

    const uploadId = uuidv4();
    const bucket = this.getBucketForMimeType(mimeType);
    const path = `${userId}/${uploadId}/${this.sanitizeFilename(filename)}`;

    // Generate presigned URL for upload
    const uploadUrl = await this.minioClient.presignedPutObject(
      bucket,
      path,
      60 * 60, // 1 hour expiry
    );

    // Store pending upload
    await this.fileModel.create({
      _id: uploadId,
      userId,
      filename: this.sanitizeFilename(filename),
      originalName: filename,
      mimeType,
      size,
      bucket,
      path,
      url: '', // Will be set after upload completes
      isProcessed: false,
    });

    return {
      uploadId,
      uploadUrl,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }

  async completeUpload(
    uploadId: string,
    chatId?: string,
  ): Promise<FileDocument> {
    const file = await this.fileModel.findById(uploadId);
    if (!file) {
      throw new Error('Upload not found');
    }

    // Verify file exists in MinIO
    try {
      await this.minioClient.statObject(file.bucket, file.path);
    } catch {
      throw new Error('File not found in storage');
    }

    // Generate public URL
    const url = `${this.config.get('MINIO_PUBLIC_URL', 'http://localhost:9000')}/${file.bucket}/${file.path}`;

    // Process image (generate thumbnail, extract metadata)
    let thumbnailUrl: string | undefined;
    let metadata: Record<string, any> = {};

    if (ALLOWED_IMAGE_TYPES.includes(file.mimeType)) {
      const result = await this.processImage(file.bucket, file.path);
      thumbnailUrl = result.thumbnailUrl;
      metadata = result.metadata;
    }

    // Update file record
    file.url = url;
    file.thumbnailUrl = thumbnailUrl;
    file.metadata = metadata;
    file.chatId = chatId;
    file.isProcessed = true;
    await file.save();

    return file;
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.fileModel.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (file.userId !== userId) {
      throw new Error('Not authorized to delete this file');
    }

    // Delete from MinIO
    await this.minioClient.removeObject(file.bucket, file.path);

    // Delete thumbnail if exists
    if (file.thumbnailUrl) {
      const thumbnailPath = file.path.replace(/(\.[^.]+)$/, '_thumb$1');
      await this.minioClient.removeObject(file.bucket, thumbnailPath).catch(() => {});
    }

    // Delete from database
    await this.fileModel.findByIdAndDelete(fileId);
  }

  async getFile(fileId: string): Promise<FileDocument | null> {
    return this.fileModel.findById(fileId);
  }

  async getFilesByChat(chatId: string, limit = 50): Promise<FileDocument[]> {
    return this.fileModel
      .find({ chatId, isProcessed: true })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  private async processImage(
    bucket: string,
    path: string,
  ): Promise<{ thumbnailUrl?: string; metadata: Record<string, any> }> {
    try {
      // Get image from MinIO
      const stream = await this.minioClient.getObject(bucket, path);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Get metadata
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Generate thumbnail
      const thumbnail = await image
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload thumbnail
      const thumbnailPath = path.replace(/(\.[^.]+)$/, '_thumb.jpg');
      await this.minioClient.putObject(bucket, thumbnailPath, thumbnail, thumbnail.length, {
        'Content-Type': 'image/jpeg',
      });

      const thumbnailUrl = `${this.config.get('MINIO_PUBLIC_URL', 'http://localhost:9000')}/${bucket}/${thumbnailPath}`;

      return {
        thumbnailUrl,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
        },
      };
    } catch (error) {
      console.error('Image processing failed:', error);
      return { metadata: {} };
    }
  }

  private getBucketForMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return this.buckets.attachments;
    if (mimeType.startsWith('video/')) return this.buckets.attachments;
    if (mimeType.startsWith('audio/')) return this.buckets.voice;
    return this.buckets.attachments;
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private async setBucketPolicy(bucket: string): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };

    await this.minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
  }
}
