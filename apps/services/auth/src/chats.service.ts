import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatEntity, ChatMemberEntity } from '@ultrachat/database';
import { UserEntity } from './entities';

interface CreateChatDto {
  type: 'direct' | 'group' | 'channel';
  name?: string;
  memberIds: string[];
  ownerId: string;
}

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepo: Repository<ChatEntity>,
    @InjectRepository(ChatMemberEntity)
    private readonly memberRepo: Repository<ChatMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(dto: CreateChatDto) {
    // For direct chats, check if already exists
    if (dto.type === 'direct' && dto.memberIds.length === 1) {
      const existingChat = await this.findDirectChat(dto.ownerId, dto.memberIds[0]);
      if (existingChat) {
        return this.getChatWithMembers(existingChat.id);
      }
    }

    // Create chat
    const chat = this.chatRepo.create({
      type: dto.type,
      name: dto.name,
      ownerId: dto.ownerId,
      settings: {
        isPublic: false,
        allowInvites: dto.type !== 'direct',
      },
    });

    await this.chatRepo.save(chat);

    // Add owner as member
    const ownerMember = this.memberRepo.create({
      chatId: chat.id,
      userId: dto.ownerId,
      role: 'owner',
    });
    await this.memberRepo.save(ownerMember);

    // Add other members
    for (const userId of dto.memberIds) {
      if (userId !== dto.ownerId) {
        const member = this.memberRepo.create({
          chatId: chat.id,
          userId,
          role: 'member',
        });
        await this.memberRepo.save(member);
      }
    }

    return this.getChatWithMembers(chat.id);
  }

  async getUserChats(userId: string) {
    const memberships = await this.memberRepo.find({
      where: { userId },
      relations: ['chat'],
    });

    const chatIds = memberships.map((m) => m.chatId);
    if (chatIds.length === 0) return [];

    const chats = await this.chatRepo.find({
      where: { id: In(chatIds) },
      order: { lastMessageAt: 'DESC' },
    });

    // Get members for each chat
    const result = await Promise.all(
      chats.map(async (chat) => {
        const members = await this.memberRepo.find({
          where: { chatId: chat.id },
        });

        const userIds = members.map((m) => m.userId);
        const users = await this.userRepo.find({
          where: { id: In(userIds) },
          select: ['id', 'username', 'displayName', 'avatar', 'status'],
        });

        const membership = memberships.find((m) => m.chatId === chat.id);

        return {
          ...chat,
          unreadCount: membership?.unreadCount || 0,
          members: members.map((m) => ({
            ...m,
            user: users.find((u) => u.id === m.userId),
          })),
        };
      }),
    );

    return result;
  }

  async getChatById(chatId: string, userId: string) {
    // Check membership
    const membership = await this.memberRepo.findOne({
      where: { chatId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this chat');
    }

    return this.getChatWithMembers(chatId);
  }

  private async getChatWithMembers(chatId: string) {
    const chat = await this.chatRepo.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');

    const members = await this.memberRepo.find({ where: { chatId } });
    const userIds = members.map((m) => m.userId);
    const users = await this.userRepo.find({
      where: { id: In(userIds) },
      select: ['id', 'username', 'displayName', 'avatar', 'status'],
    });

    return {
      ...chat,
      members: members.map((m) => ({
        ...m,
        user: users.find((u) => u.id === m.userId),
      })),
    };
  }

  private async findDirectChat(userId1: string, userId2: string) {
    const user1Chats = await this.memberRepo.find({
      where: { userId: userId1 },
      relations: ['chat'],
    });

    for (const membership of user1Chats) {
      if (membership.chat?.type !== 'direct') continue;

      const otherMember = await this.memberRepo.findOne({
        where: { chatId: membership.chatId, userId: userId2 },
      });

      if (otherMember) {
        return membership.chat;
      }
    }

    return null;
  }

  async updateLastMessage(chatId: string, timestamp: Date) {
    await this.chatRepo.update(chatId, { lastMessageAt: timestamp });
  }

  async getChatMemberIds(chatId: string): Promise<string[]> {
    const members = await this.memberRepo.find({ where: { chatId } });
    return members.map((m) => m.userId);
  }
}
