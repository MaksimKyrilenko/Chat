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
  updatedAt: Date;
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
  typingInChat?: string;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  soundEnabled: boolean;
  showPreview: boolean;
  muteUntil?: Date;
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showReadReceipts: boolean;
  allowDirectMessages: 'everyone' | 'contacts' | 'none';
}

export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface UpdateUserDto {
  displayName?: string;
  avatar?: string;
  bio?: string;
  status?: UserStatus;
}
