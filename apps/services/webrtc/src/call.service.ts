import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from './redis.service';

// Types (local copy)
export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
}

export enum CallStatus {
  RINGING = 'ringing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ENDED = 'ended',
  DECLINED = 'declined',
  MISSED = 'missed',
}

export enum ParticipantStatus {
  INVITED = 'invited',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

export interface CallParticipant {
  id: string;
  callId: string;
  userId: string;
  status: ParticipantStatus;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface Call {
  id: string;
  chatId: string;
  initiatorId: string;
  type: CallType;
  status: CallStatus;
  participants: CallParticipant[];
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
}

const REDIS_KEYS = {
  CALL_STATE: (callId: string) => `call:${callId}`,
} as const;

interface InitiateCallDto {
  chatId: string;
  initiatorId: string;
  type: CallType;
  participantIds: string[];
}

@Injectable()
export class CallService {
  constructor(
    private readonly redis: RedisService,
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  async initiateCall(dto: InitiateCallDto): Promise<Call> {
    const callId = uuidv4();

    const participants: CallParticipant[] = dto.participantIds.map((userId) => ({
      id: uuidv4(),
      callId,
      userId,
      status: userId === dto.initiatorId ? ParticipantStatus.CONNECTING : ParticipantStatus.INVITED,
      isMuted: false,
      isVideoEnabled: dto.type === CallType.VIDEO,
      isScreenSharing: false,
    }));

    const call: Call = {
      id: callId,
      chatId: dto.chatId,
      initiatorId: dto.initiatorId,
      type: dto.type,
      status: CallStatus.RINGING,
      participants,
      createdAt: new Date(),
    };

    // Store call state in Redis
    await this.redis.set(
      REDIS_KEYS.CALL_STATE(callId),
      JSON.stringify(call),
      3600, // 1 hour TTL
    );

    // Emit notification event
    this.natsClient.emit('notification.send', {
      userIds: dto.participantIds.filter((id) => id !== dto.initiatorId),
      type: 'call_incoming',
      title: 'Incoming Call',
      body: `${dto.type === CallType.VIDEO ? 'Video' : 'Voice'} call`,
      data: { callId, chatId: dto.chatId },
    });

    return call;
  }

  async getCall(callId: string): Promise<Call | null> {
    const data = await this.redis.get(REDIS_KEYS.CALL_STATE(callId));
    return data ? JSON.parse(data) : null;
  }

  async acceptCall(callId: string, userId: string): Promise<void> {
    const call = await this.getCall(callId);
    if (!call) return;

    const participant = call.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.status = ParticipantStatus.CONNECTING;
      participant.joinedAt = new Date();
    }

    // If this is the first participant to accept, start the call
    const connectedCount = call.participants.filter(
      (p) => p.status === ParticipantStatus.CONNECTING || p.status === ParticipantStatus.CONNECTED,
    ).length;

    if (connectedCount >= 2 && call.status === CallStatus.RINGING) {
      call.status = CallStatus.CONNECTING;
      call.startedAt = new Date();
    }

    await this.redis.set(
      REDIS_KEYS.CALL_STATE(callId),
      JSON.stringify(call),
      3600,
    );
  }

  async declineCall(callId: string, userId: string): Promise<void> {
    const call = await this.getCall(callId);
    if (!call) return;

    const participant = call.participants.find((p) => p.userId === userId);
    if (participant) {
      participant.status = ParticipantStatus.DISCONNECTED;
    }

    // Check if all participants declined
    const allDeclined = call.participants.every(
      (p) => p.userId === call.initiatorId || p.status === ParticipantStatus.DISCONNECTED,
    );

    if (allDeclined) {
      call.status = CallStatus.DECLINED;
      call.endedAt = new Date();
    }

    await this.redis.set(
      REDIS_KEYS.CALL_STATE(callId),
      JSON.stringify(call),
      3600,
    );
  }

  async endCall(callId: string, userId: string): Promise<void> {
    const call = await this.getCall(callId);
    if (!call) return;

    call.status = CallStatus.ENDED;
    call.endedAt = new Date();

    if (call.startedAt) {
      call.duration = Math.floor(
        (call.endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000,
      );
    }

    // Mark all participants as disconnected
    call.participants.forEach((p) => {
      if (p.status !== ParticipantStatus.DISCONNECTED) {
        p.status = ParticipantStatus.DISCONNECTED;
        p.leftAt = new Date();
      }
    });

    await this.redis.set(
      REDIS_KEYS.CALL_STATE(callId),
      JSON.stringify(call),
      300, // Keep for 5 minutes after end
    );

    // Store call history in database via NATS
    this.natsClient.emit('call.history.save', call);
  }

  async updateParticipantState(
    callId: string,
    userId: string,
    state: Partial<Pick<CallParticipant, 'isMuted' | 'isVideoEnabled' | 'isScreenSharing'>>,
  ): Promise<void> {
    const call = await this.getCall(callId);
    if (!call) return;

    const participant = call.participants.find((p) => p.userId === userId);
    if (participant) {
      Object.assign(participant, state);
    }

    await this.redis.set(
      REDIS_KEYS.CALL_STATE(callId),
      JSON.stringify(call),
      3600,
    );
  }

  async handleUserDisconnect(userId: string): Promise<void> {
    // In production, you'd track active calls per user
    // For now, this is a placeholder for cleanup logic
  }

  // ICE Server configuration
  getIceServers() {
    return {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers for production
        // {
        //   urls: 'turn:your-turn-server.com:3478',
        //   username: 'user',
        //   credential: 'pass',
        // },
      ],
    };
  }
}
