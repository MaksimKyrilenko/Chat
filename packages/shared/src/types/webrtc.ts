export interface Call {
  id: string;
  chatId: string;
  initiatorId: string;
  type: CallType;
  status: CallStatus;
  participants: CallParticipant[];
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  createdAt: Date;
}

export enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
}

export enum CallStatus {
  RINGING = 'ringing',
  CONNECTING = 'connecting',
  ACTIVE = 'active',
  ENDED = 'ended',
  MISSED = 'missed',
  DECLINED = 'declined',
  FAILED = 'failed',
}

export interface CallParticipant {
  id: string;
  callId: string;
  userId: string;
  status: ParticipantStatus;
  joinedAt?: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

export enum ParticipantStatus {
  INVITED = 'invited',
  RINGING = 'ringing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
}

// WebRTC Signaling Messages
export interface SignalingMessage {
  type: SignalingType;
  callId: string;
  senderId: string;
  targetId?: string;
  payload: unknown;
}

export enum SignalingType {
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice_candidate',
  CALL_INITIATE = 'call_initiate',
  CALL_ACCEPT = 'call_accept',
  CALL_DECLINE = 'call_decline',
  CALL_END = 'call_end',
  MUTE_TOGGLE = 'mute_toggle',
  VIDEO_TOGGLE = 'video_toggle',
  SCREEN_SHARE_START = 'screen_share_start',
  SCREEN_SHARE_STOP = 'screen_share_stop',
}

export interface RTCOffer {
  sdp: string;
  type: 'offer';
}

export interface RTCAnswer {
  sdp: string;
  type: 'answer';
}

export interface RTCIceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export interface InitiateCallDto {
  chatId: string;
  type: CallType;
  participantIds: string[];
}

export interface CallEventDto {
  callId: string;
  action: 'accept' | 'decline' | 'end' | 'mute' | 'unmute' | 'video_on' | 'video_off';
}

// ICE Server configuration
export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface RTCConfiguration {
  iceServers: IceServer[];
  iceTransportPolicy?: 'all' | 'relay';
}
