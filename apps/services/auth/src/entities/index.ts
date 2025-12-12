import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ unique: true, length: 30 })
  username: string;

  @Column({ length: 100, name: 'display_name' })
  displayName: string;

  @Column({ length: 255, select: false })
  password: string;

  @Column({ length: 500, nullable: true })
  avatar: string;

  @Column({ length: 500, nullable: true })
  bio: string;

  @Column({
    type: 'enum',
    enum: ['online', 'offline', 'away', 'dnd'],
    default: 'offline',
  })
  status: string;

  @Column({ type: 'datetime', nullable: true, name: 'last_seen' })
  lastSeen: Date;

  @Column({ default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ default: false, name: 'is_banned' })
  isBanned: boolean;

  @Column({ nullable: true, name: 'two_factor_secret', select: false })
  twoFactorSecret: string;

  @Column({ default: false, name: 'two_factor_enabled' })
  twoFactorEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'device_id' })
  deviceId: string;

  @Column({ name: 'device_name', nullable: true })
  deviceName: string;

  @Column({ name: 'ip_address', length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', length: 500, nullable: true })
  userAgent: string;

  @Column({ name: 'refresh_token_hash', length: 255 })
  refreshTokenHash: string;

  @Column({ type: 'datetime', name: 'last_active_at' })
  lastActiveAt: Date;

  @Column({ type: 'datetime', name: 'expires_at' })
  expiresAt: Date;

  @Column({ default: false, name: 'is_revoked' })
  isRevoked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}

@Entity('user_settings')
export class UserSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ default: 'system' })
  theme: string;

  @Column({ default: 'en' })
  language: string;

  @Column({ type: 'json', name: 'notification_settings' })
  notificationSettings: {
    pushEnabled: boolean;
    soundEnabled: boolean;
    showPreview: boolean;
  };

  @Column({ type: 'json', name: 'privacy_settings' })
  privacySettings: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    showReadReceipts: boolean;
    allowDirectMessages: string;
  };

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
