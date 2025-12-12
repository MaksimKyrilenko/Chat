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
import { CallService } from './call.service';

// Types (local copy)
export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
}

export interface RTCOffer {
  type: 'offer';
  sdp: string;
}

export interface RTCAnswer {
  type: 'answer';
  sdp: string;
}

export interface RTCIceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

interface AuthenticatedSocket extends Socket {
  user: { sub: string; username: string };
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8080'],
    credentials: true,
  },
  namespace: '/calls',
})
export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly callService: CallService) {}

  async handleConnection(client: AuthenticatedSocket) {
    const userId = client.user?.sub;
    if (!userId) {
      client.disconnect();
      return;
    }

    // Join user's personal room for incoming calls
    client.join(`user:${userId}`);
    console.log(`User ${userId} connected to signaling server`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.user?.sub;
    if (!userId) return;

    // Handle call cleanup if user was in a call
    await this.callService.handleUserDisconnect(userId);
    console.log(`User ${userId} disconnected from signaling server`);
  }

  @SubscribeMessage('call:initiate')
  async handleInitiateCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; type: CallType; participantIds: string[] },
  ) {
    const userId = client.user.sub;

    const call = await this.callService.initiateCall({
      chatId: data.chatId,
      initiatorId: userId,
      type: data.type,
      participantIds: data.participantIds,
    });

    // Join call room
    client.join(`call:${call.id}`);

    // Notify participants
    data.participantIds.forEach((participantId) => {
      if (participantId !== userId) {
        this.server.to(`user:${participantId}`).emit('call:incoming', {
          call,
          from: userId,
        });
      }
    });

    return { callId: call.id };
  }

  @SubscribeMessage('call:accept')
  async handleAcceptCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    const userId = client.user.sub;

    await this.callService.acceptCall(data.callId, userId);

    // Join call room
    client.join(`call:${data.callId}`);

    // Notify other participants
    client.to(`call:${data.callId}`).emit('call:accepted', {
      callId: data.callId,
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('call:decline')
  async handleDeclineCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    const userId = client.user.sub;

    await this.callService.declineCall(data.callId, userId);

    // Notify initiator
    this.server.to(`call:${data.callId}`).emit('call:declined', {
      callId: data.callId,
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('call:end')
  async handleEndCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    const userId = client.user.sub;

    await this.callService.endCall(data.callId, userId);

    // Notify all participants
    this.server.to(`call:${data.callId}`).emit('call:ended', {
      callId: data.callId,
      endedBy: userId,
    });

    return { success: true };
  }

  @SubscribeMessage('signal:offer')
  async handleOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; targetId: string; offer: RTCOffer },
  ) {
    const userId = client.user.sub;

    this.server.to(`user:${data.targetId}`).emit('signal:offer', {
      callId: data.callId,
      senderId: userId,
      offer: data.offer,
    });
  }

  @SubscribeMessage('signal:answer')
  async handleAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; targetId: string; answer: RTCAnswer },
  ) {
    const userId = client.user.sub;

    this.server.to(`user:${data.targetId}`).emit('signal:answer', {
      callId: data.callId,
      senderId: userId,
      answer: data.answer,
    });
  }

  @SubscribeMessage('signal:ice-candidate')
  async handleIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; targetId: string; candidate: RTCIceCandidate },
  ) {
    const userId = client.user.sub;

    this.server.to(`user:${data.targetId}`).emit('signal:ice-candidate', {
      callId: data.callId,
      senderId: userId,
      candidate: data.candidate,
    });
  }

  @SubscribeMessage('call:mute')
  async handleMute(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; isMuted: boolean },
  ) {
    const userId = client.user.sub;

    await this.callService.updateParticipantState(data.callId, userId, {
      isMuted: data.isMuted,
    });

    client.to(`call:${data.callId}`).emit('call:participant-muted', {
      callId: data.callId,
      userId,
      isMuted: data.isMuted,
    });
  }

  @SubscribeMessage('call:video')
  async handleVideo(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; isVideoEnabled: boolean },
  ) {
    const userId = client.user.sub;

    await this.callService.updateParticipantState(data.callId, userId, {
      isVideoEnabled: data.isVideoEnabled,
    });

    client.to(`call:${data.callId}`).emit('call:participant-video', {
      callId: data.callId,
      userId,
      isVideoEnabled: data.isVideoEnabled,
    });
  }

  @SubscribeMessage('call:screen-share')
  async handleScreenShare(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; isScreenSharing: boolean },
  ) {
    const userId = client.user.sub;

    await this.callService.updateParticipantState(data.callId, userId, {
      isScreenSharing: data.isScreenSharing,
    });

    client.to(`call:${data.callId}`).emit('call:screen-share', {
      callId: data.callId,
      userId,
      isScreenSharing: data.isScreenSharing,
    });
  }
}
