import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  chatId: string;
  senderId: string;
  content: string;
  type: string;
  replyToId?: string;
  forwardedFromId?: string;
  attachments: IAttachment[];
  reactions: IReaction[];
  mentions: string[];
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  deliveredTo: IDeliveryReceipt[];
  readBy: IReadReceipt[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachment {
  id: string;
  type: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
}

export interface IReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface IDeliveryReceipt {
  userId: string;
  deliveredAt: Date;
}

export interface IReadReceipt {
  userId: string;
  readAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'audio', 'file', 'voice'], required: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    width: Number,
    height: Number,
    duration: Number,
    thumbnailUrl: String,
  },
  { _id: false }
);

const ReactionSchema = new Schema<IReaction>(
  {
    emoji: { type: String, required: true },
    userIds: [{ type: String }],
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const DeliveryReceiptSchema = new Schema<IDeliveryReceipt>(
  {
    userId: { type: String, required: true },
    deliveredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReadReceiptSchema = new Schema<IReadReceipt>(
  {
    userId: { type: String, required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    content: { type: String, default: '' },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'voice', 'sticker', 'system', 'call'],
      default: 'text',
    },
    replyToId: { type: String, sparse: true },
    forwardedFromId: String,
    attachments: [AttachmentSchema],
    reactions: [ReactionSchema],
    mentions: [{ type: String }],
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    deliveredTo: [DeliveryReceiptSchema],
    readBy: [ReadReceiptSchema],
  },
  {
    timestamps: true,
    collection: 'messages',
  }
);

// Compound indexes for efficient queries
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ chatId: 1, isPinned: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ 'mentions': 1 });

// Text index for search
MessageSchema.index({ content: 'text' });

export const MessageModel = model<IMessage>('Message', MessageSchema);
