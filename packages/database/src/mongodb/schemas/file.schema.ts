import { Schema, model, Document, Types } from 'mongoose';

export interface IFile extends Document {
  _id: Types.ObjectId;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  path: string;
  url: string;
  thumbnailUrl?: string;
  metadata: IFileMetadata;
  chatId?: string;
  messageId?: string;
  isProcessed: boolean;
  createdAt: Date;
}

export interface IFileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  codec?: string;
  bitrate?: number;
  blurhash?: string;
}

const FileMetadataSchema = new Schema<IFileMetadata>(
  {
    width: Number,
    height: Number,
    duration: Number,
    codec: String,
    bitrate: Number,
    blurhash: String,
  },
  { _id: false }
);

const FileSchema = new Schema<IFile>(
  {
    userId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    bucket: { type: String, required: true },
    path: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: String,
    metadata: { type: FileMetadataSchema, default: {} },
    chatId: { type: String, sparse: true },
    messageId: { type: String, sparse: true },
    isProcessed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'files',
  }
);

FileSchema.index({ chatId: 1, createdAt: -1 });
FileSchema.index({ userId: 1, createdAt: -1 });

export const FileModel = model<IFile>('File', FileSchema);

// Sticker schemas
export interface ISticker extends Document {
  _id: Types.ObjectId;
  packId: string;
  emoji: string;
  url: string;
  isAnimated: boolean;
}

export interface IStickerPack extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  thumbnailUrl: string;
  isOfficial: boolean;
  createdBy?: string;
  stickers: Types.ObjectId[];
  createdAt: Date;
}

const StickerSchema = new Schema<ISticker>(
  {
    packId: { type: String, required: true, index: true },
    emoji: { type: String, required: true },
    url: { type: String, required: true },
    isAnimated: { type: Boolean, default: false },
  },
  { collection: 'stickers' }
);

const StickerPackSchema = new Schema<IStickerPack>(
  {
    name: { type: String, required: true },
    description: String,
    thumbnailUrl: { type: String, required: true },
    isOfficial: { type: Boolean, default: false },
    createdBy: String,
    stickers: [{ type: Schema.Types.ObjectId, ref: 'Sticker' }],
  },
  {
    timestamps: true,
    collection: 'sticker_packs',
  }
);

export const StickerModel = model<ISticker>('Sticker', StickerSchema);
export const StickerPackModel = model<IStickerPack>('StickerPack', StickerPackSchema);
