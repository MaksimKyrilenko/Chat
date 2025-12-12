import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern } from '@nestjs/microservices';
import { ChatsService } from './chats.service';

@Controller()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @MessagePattern('chat.create')
  async createChat(
    @Payload()
    data: {
      type: 'direct' | 'group' | 'channel';
      name?: string;
      memberIds: string[];
      ownerId: string;
    },
  ) {
    return this.chatsService.create(data);
  }

  @MessagePattern('chat.list')
  async getUserChats(@Payload() data: { userId: string }) {
    return this.chatsService.getUserChats(data.userId);
  }

  @MessagePattern('chat.get')
  async getChat(@Payload() data: { chatId: string; userId: string }) {
    return this.chatsService.getChatById(data.chatId, data.userId);
  }

  @MessagePattern('chat.members')
  async getChatMembers(@Payload() data: { chatId: string }) {
    return this.chatsService.getChatMemberIds(data.chatId);
  }

  @EventPattern('chat.update.lastMessage')
  async updateLastMessage(
    @Payload() data: { chatId: string; messageId: string; timestamp: Date },
  ) {
    return this.chatsService.updateLastMessage(data.chatId, new Date(data.timestamp));
  }
}
