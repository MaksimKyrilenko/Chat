import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { CreateChatDto } from './dto/create-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  async create(userId: string, dto: CreateChatDto) {
    return firstValueFrom(
      this.natsClient.send('chat.create', {
        type: dto.type,
        name: dto.name,
        memberIds: dto.memberIds,
        ownerId: userId,
      }).pipe(timeout(5000)),
    );
  }

  async getUserChats(userId: string) {
    return firstValueFrom(
      this.natsClient.send('chat.list', { userId }).pipe(timeout(5000)),
    );
  }

  async getChatById(chatId: string, userId: string) {
    return firstValueFrom(
      this.natsClient.send('chat.get', { chatId, userId }).pipe(timeout(5000)),
    );
  }

  async getChatMembers(chatId: string): Promise<string[]> {
    return firstValueFrom(
      this.natsClient.send('chat.members', { chatId }).pipe(timeout(5000)),
    );
  }
}
