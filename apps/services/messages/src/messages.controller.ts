import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern } from '@nestjs/microservices';
import { MessagesService } from './messages.service';

// NATS Subjects (local copy)
const NATS_SUBJECTS = {
  MESSAGE_SEND: 'message.send',
  MESSAGE_GET: 'message.get',
  MESSAGE_LIST: 'message.list',
  MESSAGE_UPDATE: 'message.update',
  MESSAGE_DELETE: 'message.delete',
  MESSAGE_REACT: 'message.react',
  MESSAGE_PIN: 'message.pin',
} as const;

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @MessagePattern(NATS_SUBJECTS.MESSAGE_SEND)
  async sendMessage(
    @Payload()
    data: {
      chatId: string;
      senderId: string;
      content: string;
      type?: string;
      replyToId?: string;
      attachments?: any[];
      mentions?: string[];
    },
  ) {
    return this.messagesService.create(data);
  }

  @MessagePattern(NATS_SUBJECTS.MESSAGE_GET)
  async getMessage(@Payload() data: { messageId: string }) {
    return this.messagesService.findById(data.messageId);
  }

  @MessagePattern(NATS_SUBJECTS.MESSAGE_LIST)
  async getMessages(
    @Payload()
    data: {
      chatId: string;
      limit?: number;
      before?: string;
      after?: string;
    },
  ) {
    return this.messagesService.findByChatId(data.chatId, {
      limit: data.limit,
      before: data.before,
      after: data.after,
    });
  }

  @MessagePattern(NATS_SUBJECTS.MESSAGE_UPDATE)
  async updateMessage(
    @Payload()
    data: {
      messageId: string;
      userId: string;
      content: string;
    },
  ) {
    return this.messagesService.update(data.messageId, data.userId, {
      content: data.content,
    });
  }

  @MessagePattern(NATS_SUBJECTS.MESSAGE_DELETE)
  async deleteMessage(
    @Payload()
    data: {
      messageId: string;
      userId: string;
    },
  ) {
    return this.messagesService.delete(data.messageId, data.userId);
  }

  @MessagePattern(NATS_SUBJECTS.MESSAGE_REACT)
  async reactToMessage(
    @Payload()
    data: {
      messageId: string;
      userId: string;
      emoji: string;
      action: 'add' | 'remove';
    },
  ) {
    if (data.action === 'add') {
      return this.messagesService.addReaction(data.messageId, data.userId, data.emoji);
    }
    return this.messagesService.removeReaction(data.messageId, data.userId, data.emoji);
  }

  @EventPattern('message.read')
  async markAsRead(
    @Payload()
    data: {
      chatId: string;
      messageId: string;
      userId: string;
    },
  ) {
    return this.messagesService.markAsRead(data.chatId, data.messageId, data.userId);
  }

  @MessagePattern(NATS_SUBJECTS.MESSAGE_PIN)
  async togglePin(
    @Payload()
    data: {
      messageId: string;
      userId: string;
    },
  ) {
    return this.messagesService.togglePin(data.messageId, data.userId);
  }

  @MessagePattern('message.pinned.list')
  async getPinnedMessages(@Payload() data: { chatId: string }) {
    return this.messagesService.getPinnedMessages(data.chatId);
  }
}
