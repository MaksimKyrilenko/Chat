import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { PresenceService } from './presence.service';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { AuthService } from '../auth/auth.service';

// WebSocket Events (local copy)
const WS_EVENTS = {
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  PRESENCE_UPDATE: 'presence:update',
} as const;

// NATS Subjects (local copy)
const NATS_SUBJECTS = {
  MESSAGE_SEND: 'message.send',
} as const;

interface AuthenticatedSocket extends Socket {
  user: { sub: string; username: string };
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8080'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
    private readonly presenceService: PresenceService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract and validate token
      const token = client.handshake.auth?.token || 
                    client.handshake.headers.authorization?.replace('Bearer ', '') ||
                    client.handshake.query?.token as string;

      if (!token) {
        console.log('No token provided, disconnecting');
        client.disconnect();
        return;
      }

      const payload = await this.authService.validateToken(token);
      client.user = payload as any;

      const userId = client.user?.sub;
      if (!userId) {
        client.disconnect();
        return;
      }

      // Register socket and set user online
      await this.presenceService.addSocket(userId, client.id);
      await this.presenceService.setOnline(userId);

      // Join user's personal room
      client.join(`user:${userId}`);

      // Get user's chats and join rooms
      const chats = await this.getUserChats(userId);
      chats.forEach((chatId: string) => {
        client.join(`chat:${chatId}`);
      });

      // Broadcast online status
      this.broadcastPresence(userId, 'online');

      console.log(`User ${userId} connected (socket: ${client.id})`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.user?.sub;
    if (!userId) return;

    await this.presenceService.removeSocket(userId, client.id);

    // Check if user has other active sockets
    const hasOtherSockets = await this.presenceService.hasActiveSockets(userId);
    if (!hasOtherSockets) {
      await this.presenceService.setOffline(userId);
      this.broadcastPresence(userId, 'offline');
    }

    console.log(`User ${userId} disconnected (socket: ${client.id})`);
  }

  @SubscribeMessage('message:send')
  @UseGuards(WsAuthGuard)
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; content: string; type?: string; replyToId?: string },
  ) {
    const userId = client.user.sub;

    console.log('[ChatGateway] Received message:send from user:', userId, 'data:', data);

    // Send to messages service via NATS
    this.natsClient.emit(NATS_SUBJECTS.MESSAGE_SEND, {
      chatId: data.chatId,
      senderId: userId,
      content: data.content,
      type: data.type || 'text',
      replyToId: data.replyToId,
    });

    console.log('[ChatGateway] Emitted message.send to NATS');
  }

  @SubscribeMessage('typing:start')
  @UseGuards(WsAuthGuard)
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.user.sub;
    await this.presenceService.setTyping(userId, data.chatId, true);

    client.to(`chat:${data.chatId}`).emit(WS_EVENTS.TYPING_START, {
      chatId: data.chatId,
      userId,
    });
  }

  @SubscribeMessage('typing:stop')
  @UseGuards(WsAuthGuard)
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = client.user.sub;
    await this.presenceService.setTyping(userId, data.chatId, false);

    client.to(`chat:${data.chatId}`).emit(WS_EVENTS.TYPING_STOP, {
      chatId: data.chatId,
      userId,
    });
  }

  @SubscribeMessage('message:read')
  @UseGuards(WsAuthGuard)
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; messageId: string },
  ) {
    const userId = client.user.sub;

    this.natsClient.emit('message.read', {
      chatId: data.chatId,
      messageId: data.messageId,
      userId,
    });
  }

  @SubscribeMessage('chat:join')
  @UseGuards(WsAuthGuard)
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    console.log(`[ChatGateway] User ${client.user.sub} joining chat room: chat:${data.chatId}`);
    client.join(`chat:${data.chatId}`);
  }

  @SubscribeMessage('chat:leave')
  @UseGuards(WsAuthGuard)
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    client.leave(`chat:${data.chatId}`);
  }

  // Methods called by other services via NATS
  async emitToChat(chatId: string, event: string, data: any) {
    const room = `chat:${chatId}`;
    const sockets = await this.server.in(room).fetchSockets();
    console.log(`[ChatGateway] emitToChat - room: ${room}, sockets in room: ${sockets.length}, event: ${event}`);
    this.server.to(room).emit(event, data);
  }

  async emitToUser(userId: string, event: string, data: any) {
    const room = `user:${userId}`;
    const sockets = await this.server.in(room).fetchSockets();
    console.log(`[ChatGateway] emitToUser - room: ${room}, sockets in room: ${sockets.length}, event: ${event}`);
    this.server.to(room).emit(event, data);
  }

  private async getUserChats(userId: string): Promise<string[]> {
    try {
      const chats = await firstValueFrom(
        this.natsClient.send('chat.list', { userId }).pipe(timeout(5000)),
      );
      return chats.map((chat: any) => chat.id);
    } catch {
      return [];
    }
  }

  private broadcastPresence(userId: string, status: string) {
    this.server.emit(WS_EVENTS.PRESENCE_UPDATE, {
      userId,
      status,
      lastSeen: new Date(),
    });
  }
}
