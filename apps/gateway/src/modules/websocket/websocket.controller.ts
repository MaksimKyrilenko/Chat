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
    console.log('[WebSocketController] Received ws.broadcast:', data.room, data.event);

    // Transform MongoDB _id to id for frontend
    if (data.data?.message?._id) {
      data.data.message.id = data.data.message._id.toString();
      delete data.data.message._id;
    }

    if (data.room.startsWith('chat:')) {
      const chatId = data.room.replace('chat:', '');
      console.log('[WebSocketController] Emitting to chat room:', chatId);
      this.chatGateway.emitToChat(chatId, data.event, data.data);
    } else if (data.room.startsWith('user:')) {
      const userId = data.room.replace('user:', '');
      console.log('[WebSocketController] Emitting to user room:', userId);
      this.chatGateway.emitToUser(userId, data.event, data.data);
    }
  }
}
