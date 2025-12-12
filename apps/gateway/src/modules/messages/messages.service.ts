import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class MessagesService {
  constructor(
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  async getMessages(
    chatId: string,
    userId: string,
    options: { limit?: number; before?: string },
  ) {
    // First verify user has access to chat
    await this.verifyChatAccess(chatId, userId);

    const messages = await firstValueFrom(
      this.natsClient.send('message.list', {
        chatId,
        limit: options.limit || 50,
        before: options.before,
      }).pipe(timeout(5000)),
    );

    // Transform MongoDB _id to id
    return messages.map(this.transformMessage);
  }

  private transformMessage(message: any) {
    if (!message) return message;
    return {
      ...message,
      id: message._id?.toString() || message.id,
      _id: undefined,
    };
  }

  async getPinnedMessages(chatId: string, userId: string) {
    await this.verifyChatAccess(chatId, userId);

    const messages = await firstValueFrom(
      this.natsClient.send('message.pinned.list', { chatId }).pipe(timeout(5000)),
    );

    return messages.map(this.transformMessage);
  }

  private async verifyChatAccess(chatId: string, userId: string) {
    try {
      await firstValueFrom(
        this.natsClient.send('chat.get', { chatId, userId }).pipe(timeout(5000)),
      );
    } catch {
      throw new ForbiddenException('No access to this chat');
    }
  }
}
