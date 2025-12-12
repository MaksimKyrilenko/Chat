import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Message, MessageDocument } from './schemas/message.schema';
import { SearchService } from './search.service';

// WebSocket Events (local copy)
const WS_EVENTS = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_REACTION: 'message:reaction',
} as const;

interface CreateMessageDto {
  chatId: string;
  senderId: string;
  content: string;
  type?: string;
  replyToId?: string;
  attachments?: any[];
  mentions?: string[];
}

interface UpdateMessageDto {
  content: string;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
    private readonly searchService: SearchService,
  ) {}

  async create(dto: CreateMessageDto): Promise<MessageDocument> {
    const message = new this.messageModel({
      chatId: dto.chatId,
      senderId: dto.senderId,
      content: dto.content,
      type: dto.type || 'text',
      replyToId: dto.replyToId,
      attachments: dto.attachments || [],
      mentions: dto.mentions || [],
    });

    await message.save();

    // Index in ElasticSearch
    await this.searchService.indexMessage(message);

    console.log('[MessagesService] Emitting ws.broadcast for message:', message._id);

    // Emit event for WebSocket broadcast
    this.natsClient.emit('ws.broadcast', {
      room: `chat:${dto.chatId}`,
      event: WS_EVENTS.MESSAGE_NEW,
      data: { message, chatId: dto.chatId },
    });

    console.log('[MessagesService] ws.broadcast emitted to room:', `chat:${dto.chatId}`);

    // Update chat's lastMessageAt
    this.natsClient.emit('chat.update.lastMessage', {
      chatId: dto.chatId,
      messageId: message._id.toString(),
      timestamp: message.createdAt,
    });

    return message;
  }

  async findById(id: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(id);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  async findByChatId(
    chatId: string,
    options: { limit?: number; before?: string; after?: string } = {},
  ): Promise<MessageDocument[]> {
    const { limit = 50, before, after } = options;

    const query: any = { chatId, isDeleted: false };

    if (before) {
      query._id = { $lt: new Types.ObjectId(before) };
    } else if (after) {
      query._id = { $gt: new Types.ObjectId(after) };
    }

    const messages = await this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .exec();

    // Return in chronological order (oldest first)
    return messages.reverse();
  }

  async update(id: string, userId: string, dto: UpdateMessageDto): Promise<MessageDocument> {
    const message = await this.messageModel.findById(id);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Not authorized to edit this message');
    }

    message.content = dto.content;
    message.isEdited = true;
    await message.save();

    // Update in ElasticSearch
    await this.searchService.updateMessage(message);

    // Emit event
    this.natsClient.emit('ws.broadcast', {
      room: `chat:${message.chatId}`,
      event: WS_EVENTS.MESSAGE_UPDATE,
      data: {
        messageId: id,
        chatId: message.chatId,
        content: dto.content,
        updatedAt: message.updatedAt,
      },
    });

    return message;
  }

  async delete(id: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(id);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Not authorized to delete this message');
    }

    message.isDeleted = true;
    message.content = '';
    message.attachments = [];
    await message.save();

    // Remove from ElasticSearch
    await this.searchService.deleteMessage(id);

    // Emit event
    this.natsClient.emit('ws.broadcast', {
      room: `chat:${message.chatId}`,
      event: WS_EVENTS.MESSAGE_DELETE,
      data: { messageId: id, chatId: message.chatId },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const existingReaction = message.reactions.find((r) => r.emoji === emoji);

    if (existingReaction) {
      if (!existingReaction.userIds.includes(userId)) {
        existingReaction.userIds.push(userId);
        existingReaction.count++;
      }
    } else {
      message.reactions.push({
        emoji,
        userIds: [userId],
        count: 1,
      });
    }

    await message.save();

    this.natsClient.emit('ws.broadcast', {
      room: `chat:${message.chatId}`,
      event: WS_EVENTS.MESSAGE_REACTION,
      data: {
        messageId,
        chatId: message.chatId,
        emoji,
        userId,
        action: 'add',
      },
    });
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const reaction = message.reactions.find((r) => r.emoji === emoji);
    if (reaction) {
      reaction.userIds = reaction.userIds.filter((id) => id !== userId);
      reaction.count = reaction.userIds.length;

      if (reaction.count === 0) {
        message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
      }

      await message.save();
    }

    this.natsClient.emit('ws.broadcast', {
      room: `chat:${message.chatId}`,
      event: WS_EVENTS.MESSAGE_REACTION,
      data: {
        messageId,
        chatId: message.chatId,
        emoji,
        userId,
        action: 'remove',
      },
    });
  }

  async markAsRead(chatId: string, messageId: string, userId: string): Promise<void> {
    await this.messageModel.updateMany(
      {
        chatId,
        _id: { $lte: new Types.ObjectId(messageId) },
        'readBy.userId': { $ne: userId },
      },
      {
        $push: {
          readBy: { userId, readAt: new Date() },
        },
      },
    );
  }

  async getPinnedMessages(chatId: string): Promise<MessageDocument[]> {
    return this.messageModel
      .find({ chatId, isPinned: true, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async togglePin(messageId: string, userId: string): Promise<MessageDocument> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.isPinned = !message.isPinned;
    await message.save();

    return message;
  }
}
