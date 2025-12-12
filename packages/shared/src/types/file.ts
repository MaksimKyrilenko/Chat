export interface FileUpload {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  path: string;
  url: string;
  thumbnailUrl?: string;
  metadata: FileMetadata;
  createdAt: Date;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  codec?: string;
  bitrate?: number;
}

export interface UploadUrlRequest {
  filename: string;
  mimeType: string;
  size: number;
}

export interface UploadUrlResponse {
  uploadId: string;
  uploadUrl: string;
  expiresAt: Date;
}

export interface FileUploadComplete {
  uploadId: string;
  chatId?: string;
}

export enum FileBucket {
  AVATARS = 'avatars',
  ATTACHMENTS = 'attachments',
  STICKERS = 'stickers',
  VOICE = 'voice',
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_VOICE_DURATION = 300; // 5 minutes
