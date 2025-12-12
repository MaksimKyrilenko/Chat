import type { Message, TypingIndicator } from './types/message';
import type { UserPresence } from './types/user';
import type { Call, SignalingMessage } from './types/webrtc';
import type { Notification } from './types/notification';

// WebSocket Event Payloads
export interface WsMessageNewEvent {
  message: Message;
  chatId: string;
}

export interface WsMessageUpdateEvent {
  messageId: string;
  chatId: string;
  content: string;
  updatedAt: Date;
}

export interface WsMessageDeleteEvent {
  messageId: string;
  chatId: string;
}

export interface WsMessageReactionEvent {
  messageId: string;
  chatId: string;
  emoji: string;
  userId: string;
  action: 'add' | 'remove';
}

export interface WsTypingEvent extends TypingIndicator {}

export interface WsPresenceEvent extends UserPresence {}

export interface WsChatMemberEvent {
  chatId: string;
  userId: string;
  action: 'join' | 'leave';
}

export interface WsCallEvent {
  call: Call;
}

export interface WsCallSignalEvent extends SignalingMessage {}

export interface WsNotificationEvent {
  notification: Notification;
}

// NATS Event Payloads
export interface NatsUserCreatedEvent {
  userId: string;
  email: string;
  username: string;
}

export interface NatsMessageCreatedEvent {
  message: Message;
  chatId: string;
  recipientIds: string[];
}

export interface NatsCallStartedEvent {
  call: Call;
  participantIds: string[];
}

export interface NatsNotificationEvent {
  userId: string;
  notification: Notification;
}
