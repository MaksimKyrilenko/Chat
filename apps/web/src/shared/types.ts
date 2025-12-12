export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: UserStatus;
  lastSeen?: Date;
  createdAt: Date;
}

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
  DND = 'dnd',
}

export interface UserPresence {
  userId: string;
  status: UserStatus;
  lastSeen: Date;
  isTyping?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  lastMessageAt?: Date;
  lastMessage?: Message;
  unreadCount?: number;
  members?: ChatMember[];
}

export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
}

export interface ChatMember {
  id: string;
  userId: string;
  role: string;
  user?: User;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: MessageType;
  replyToId?: string;
  attachments: Attachment[];
  reactions: Reaction[];
  mentions: string[];
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender?: User;
  replyTo?: Message;
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
}

export interface Attachment {
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

export interface Reaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface Call {
  id: string;
  chatId: string;
  type: 'voice' | 'video';
  status: string;
  participants: CallParticipant[];
}

export interface CallParticipant {
  userId: string;
  status: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
}
