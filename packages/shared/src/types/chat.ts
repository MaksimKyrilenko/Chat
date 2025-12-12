export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  settings: ChatSettings;
}

export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel',
  COMMUNITY = 'community',
}

export interface ChatSettings {
  isPublic: boolean;
  allowInvites: boolean;
  slowMode?: number; // seconds between messages
  maxMembers?: number;
}

export interface ChatMember {
  id: string;
  chatId: string;
  userId: string;
  role: ChatMemberRole;
  joinedAt: Date;
  mutedUntil?: Date;
  lastReadMessageId?: string;
  unreadCount: number;
}

export enum ChatMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
}

export interface ChatInvite {
  id: string;
  chatId: string;
  code: string;
  createdBy: string;
  expiresAt?: Date;
  maxUses?: number;
  uses: number;
  createdAt: Date;
}

export interface CreateChatDto {
  type: ChatType;
  name?: string;
  description?: string;
  memberIds?: string[];
  settings?: Partial<ChatSettings>;
}

export interface UpdateChatDto {
  name?: string;
  description?: string;
  avatar?: string;
  settings?: Partial<ChatSettings>;
}

export interface ChatWithMembers extends Chat {
  members: ChatMember[];
  memberCount: number;
}

export interface ChatPreview {
  id: string;
  type: ChatType;
  name: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: Date;
  };
  unreadCount: number;
}
