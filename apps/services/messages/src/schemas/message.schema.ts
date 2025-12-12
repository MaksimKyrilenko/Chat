import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ _id: false })
export class Attachment {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, enum: ['image', 'video', 'audio', 'file', 'voice'] })
  type: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  duration?: number;

  @Prop()
  thumbnailUrl?: string;
}

@Schema({ _id: false })
export class Reaction {
  @Prop({ required: true })
  emoji: string;

  @Prop({ type: [String], default: [] })
  userIds: string[];

  @Prop({ default: 0 })
  count: number;
}

@Schema({ _id: false })
export class ReadReceipt {
  @Prop({ required: true })
  userId: string;

  @Prop({ default: Date.now })
  readAt: Date;
}

@Schema({
  timestamps: true,
  collection: 'messages',
})
export class Message {
  createdAt?: Date;
  updatedAt?: Date;
  @Prop({ required: true, index: true })
  chatId: string;

  @Prop({ required: true, index: true })
  senderId: string;

  @Prop({ default: '' })
  content: string;

  @Prop({
    required: true,
    enum: ['text', 'image', 'video', 'audio', 'file', 'voice', 'sticker', 'system', 'call'],
    default: 'text',
  })
  type: string;

  @Prop()
  replyToId?: string;

  @Prop()
  forwardedFromId?: string;

  @Prop({ type: [Attachment], default: [] })
  attachments: Attachment[];

  @Prop({ type: [Reaction], default: [] })
  reactions: Reaction[];

  @Prop({ type: [String], default: [] })
  mentions: string[];

  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ type: [ReadReceipt], default: [] })
  readBy: ReadReceipt[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ chatId: 1, isPinned: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ mentions: 1 });
MessageSchema.index({ content: 'text' });
