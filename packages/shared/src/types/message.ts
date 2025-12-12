export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  replyToId?: string;
  forwardedFromId?: string;
  attachments: Attachment[];
  reactions: Reaction[];
  mentions: string[];
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
  readBy: ReadReceipt[];
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  VOICE = 'voice',
  STICKER = 'sticker',
  SYSTEM = 'system',
  CALL = 'call',
}

export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
}

export enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  VOICE = 'voice',
}

export interface Reaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface ReadReceipt {
  userId: string;
  readAt: Date;
}

export interface Sticker {
  id: string;
  packId: string;
  emoji: string;
  url: string;
  isAnimated: boolean;
}

export interface StickerPack {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  stickers: Sticker[];
  isOfficial: boolean;
  createdBy?: string;
}

export interface CreateMessageDto {
  chatId: string;
  content: string;
  type?: MessageType;
  replyToId?: string;
  attachmentIds?: string[];
  mentions?: string[];
}

export interface UpdateMessageDto {
  content: string;
}

export interface MessageSearchResult {
  message: Message;
  chatId: string;
  chatName: string;
  highlights: string[];
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  isTyping: boolean;
}
