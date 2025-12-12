import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth';
import type { Call } from '@/shared/types';

export const useCallStore = defineStore('call', () => {
  const socket = ref<Socket | null>(null);
  const activeCall = ref<Call | null>(null);
  const incomingCall = ref<Call | null>(null);
  const localStream = ref<MediaStream | null>(null);
  const remoteStreams = ref<Map<string, MediaStream>>(new Map());
  const peerConnections = ref<Map<string, RTCPeerConnection>>(new Map());

  const isMuted = ref(false);
  const isVideoEnabled = ref(true);
  const isScreenSharing = ref(false);

  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  function connect() {
    const authStore = useAuthStore();

    socket.value = io('/calls', {
      auth: { token: authStore.tokens?.accessToken },
      transports: ['websocket'],
    });

    socket.value.on('call:incoming', handleIncomingCall);
    socket.value.on('call:accepted', handleCallAccepted);
    socket.value.on('call:declined', handleCallDeclined);
    socket.value.on('call:ended', handleCallEnded);
    socket.value.on('signal:offer', handleOffer);
    socket.value.on('signal:answer', handleAnswer);
    socket.value.on('signal:ice-candidate', handleIceCandidate);
  }

  async function initiateCall(chatId: string, type: 'voice' | 'video', participantIds: string[]) {
    try {
      localStream.value = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      socket.value?.emit('call:initiate', { chatId, type, participantIds }, (response: any) => {
        if (response.callId) {
          activeCall.value = {
            id: response.callId,
            chatId,
            type,
            status: 'ringing',
            participants: [],
          };
        }
      });
    } catch (error) {
      console.error('Failed to get media devices:', error);
      throw error;
    }
  }

  async function acceptCall() {
    if (!incomingCall.value) return;

    try {
      localStream.value = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.value.type === 'video',
      });

      socket.value?.emit('call:accept', { callId: incomingCall.value.id });
      activeCall.value = incomingCall.value;
      incomingCall.value = null;
    } catch (error) {
      console.error('Failed to accept call:', error);
      throw error;
    }
  }

  function declineCall() {
    if (!incomingCall.value) return;
    socket.value?.emit('call:decline', { callId: incomingCall.value.id });
    incomingCall.value = null;
  }

  function endCall() {
    if (!activeCall.value) return;

    socket.value?.emit('call:end', { callId: activeCall.value.id });
    cleanup();
  }

  function toggleMute() {
    if (!localStream.value) return;

    isMuted.value = !isMuted.value;
    localStream.value.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted.value;
    });

    socket.value?.emit('call:mute', {
      callId: activeCall.value?.id,
      isMuted: isMuted.value,
    });
  }

  function toggleVideo() {
    if (!localStream.value) return;

    isVideoEnabled.value = !isVideoEnabled.value;
    localStream.value.getVideoTracks().forEach((track) => {
      track.enabled = isVideoEnabled.value;
    });

    socket.value?.emit('call:video', {
      callId: activeCall.value?.id,
      isVideoEnabled: isVideoEnabled.value,
    });
  }

  async function startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      isScreenSharing.value = true;

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      peerConnections.value.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        sender?.replaceTrack(videoTrack);
      });

      videoTrack.onended = () => {
        stopScreenShare();
      };

      socket.value?.emit('call:screen-share', {
        callId: activeCall.value?.id,
        isScreenSharing: true,
      });
    } catch (error) {
      console.error('Failed to start screen share:', error);
    }
  }

  function stopScreenShare() {
    if (!localStream.value) return;

    isScreenSharing.value = false;

    // Restore camera video track
    const videoTrack = localStream.value.getVideoTracks()[0];
    peerConnections.value.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      sender?.replaceTrack(videoTrack);
    });

    socket.value?.emit('call:screen-share', {
      callId: activeCall.value?.id,
      isScreenSharing: false,
    });
  }

  // WebRTC handlers
  function handleIncomingCall(data: { call: Call; from: string }) {
    incomingCall.value = data.call;
  }

  async function handleCallAccepted(data: { callId: string; userId: string }) {
    if (activeCall.value?.id !== data.callId) return;

    const pc = createPeerConnection(data.userId);
    peerConnections.value.set(data.userId, pc);

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.value?.emit('signal:offer', {
      callId: data.callId,
      targetId: data.userId,
      offer: { sdp: offer.sdp, type: offer.type },
    });
  }

  function handleCallDeclined(_data: { callId: string; userId: string }) {
    // Handle declined call
  }

  function handleCallEnded(_data: { callId: string; endedBy: string }) {
    cleanup();
  }

  async function handleOffer(data: { callId: string; senderId: string; offer: RTCSessionDescriptionInit }) {
    const pc = createPeerConnection(data.senderId);
    peerConnections.value.set(data.senderId, pc);

    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.value?.emit('signal:answer', {
      callId: data.callId,
      targetId: data.senderId,
      answer: { sdp: answer.sdp, type: answer.type },
    });
  }

  async function handleAnswer(data: { callId: string; senderId: string; answer: RTCSessionDescriptionInit }) {
    const pc = peerConnections.value.get(data.senderId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  }

  function handleIceCandidate(data: { callId: string; senderId: string; candidate: RTCIceCandidateInit }) {
    const pc = peerConnections.value.get(data.senderId);
    if (pc) {
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  function createPeerConnection(userId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers });

    // Add local tracks
    localStream.value?.getTracks().forEach((track) => {
      pc.addTrack(track, localStream.value!);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.value?.emit('signal:ice-candidate', {
          callId: activeCall.value?.id,
          targetId: userId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      remoteStreams.value.set(userId, event.streams[0]);
    };

    return pc;
  }

  function cleanup() {
    // Stop local stream
    localStream.value?.getTracks().forEach((track) => track.stop());
    localStream.value = null;

    // Close peer connections
    peerConnections.value.forEach((pc) => pc.close());
    peerConnections.value.clear();

    // Clear remote streams
    remoteStreams.value.clear();

    // Reset state
    activeCall.value = null;
    isMuted.value = false;
    isVideoEnabled.value = true;
    isScreenSharing.value = false;
  }

  return {
    socket,
    activeCall,
    incomingCall,
    localStream,
    remoteStreams,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    connect,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  };
});
