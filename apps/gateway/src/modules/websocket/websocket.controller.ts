import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ChatGateway } from './chat.gateway';

@Controller()
export class WebSocketController {
  constructor(private readonly chatGateway: ChatGateway) {}

  @EventPattern('ws.broadcast')
  async handleBroadcast(
    @Payload() data: { room: string; event: string; data: any },
  ) {
    // Transform MongoDB _id to id for frontend
    if (data.data?.message?._id) {
      data.data.message.id = data.data.message._id.toString();
      delete data.data.message._id;
    }

    if (data.room.startsWith('chat:')) {
      const chatId = data.room.replace('chat:', '');
      this.chatGateway.emitToChat(chatId, data.event, data.data);
    } else if (data.room.startsWith('user:')) {
      const userId = data.room.replace('user:', '');
      this.chatGateway.emitToUser(userId, data.event, data.data);
    }
  }
}
