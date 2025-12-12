import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('chats')
export class ChatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['direct', 'group', 'channel', 'community'],
  })
  @Index()
  type: string;

  @Column({ length: 100, nullable: true })
  name: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  avatar: string;

  @Column({ name: 'owner_id' })
  @Index()
  ownerId: string;

  @Column({ type: 'json' })
  settings: {
    isPublic: boolean;
    allowInvites: boolean;
    slowMode?: number;
    maxMembers?: number;
  };

  @Column({ type: 'datetime', nullable: true, name: 'last_message_at' })
  lastMessageAt: Date;

  @Column({ default: false, name: 'is_archived' })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;
}

@Entity('chat_members')
@Index(['chatId', 'userId'], { unique: true })
export class ChatMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chat_id' })
  @Index()
  chatId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: ['owner', 'admin', 'moderator', 'member'],
    default: 'member',
  })
  role: string;

  @Column({ type: 'datetime', nullable: true, name: 'muted_until' })
  mutedUntil: Date;

  @Column({ nullable: true, name: 'last_read_message_id' })
  lastReadMessageId: string;

  @Column({ default: 0, name: 'unread_count' })
  unreadCount: number;

  @Column({ type: 'json', nullable: true, name: 'notification_settings' })
  notificationSettings: {
    muted: boolean;
    mentionsOnly: boolean;
  };

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @ManyToOne(() => ChatEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: ChatEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}

@Entity('chat_invites')
export class ChatInviteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chat_id' })
  @Index()
  chatId: string;

  @Column({ unique: true, length: 20 })
  @Index()
  code: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ type: 'datetime', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @Column({ nullable: true, name: 'max_uses' })
  maxUses: number;

  @Column({ default: 0 })
  uses: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ChatEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: ChatEntity;
}

@Entity('chat_bans')
@Index(['chatId', 'userId'], { unique: true })
export class ChatBanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chat_id' })
  @Index()
  chatId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'banned_by' })
  bannedBy: string;

  @Column({ length: 500, nullable: true })
  reason: string;

  @Column({ type: 'datetime', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
