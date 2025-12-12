import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth';
import { useChatStore } from './chat';

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);

  function connect() {
    const authStore = useAuthStore();

    if (socket.value?.connected) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    socket.value = io(`${wsUrl}/chat`, {
      auth: {
        token: authStore.tokens?.accessToken,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.value.on('connect', () => {
      connected.value = true;
      console.log('WebSocket connected');
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
      console.log('WebSocket disconnected');
    });

    // Message events
    socket.value.on('message:new', (data) => {
      const chatStore = useChatStore();
      chatStore.addMessage(data.chatId, data.message);
    });

    socket.value.on('message:update', (data) => {
      const chatStore = useChatStore();
      chatStore.updateMessage(data.chatId, data.messageId, { content: data.content });
    });

    socket.value.on('message:delete', (data) => {
      const chatStore = useChatStore();
      chatStore.removeMessage(data.chatId, data.messageId);
    });

    socket.value.on('message:reaction', (data) => {
      const chatStore = useChatStore();
      chatStore.handleReaction(data);
    });

    // Typing events
    socket.value.on('typing:start', (data) => {
      const chatStore = useChatStore();
      chatStore.setTyping(data.chatId, data.userId, true);
    });

    socket.value.on('typing:stop', (data) => {
      const chatStore = useChatStore();
      chatStore.setTyping(data.chatId, data.userId, false);
    });

    // Presence events
    socket.value.on('presence:update', (data) => {
      const chatStore = useChatStore();
      chatStore.updatePresence(data.userId, data.status);
    });

    // Notification events
    socket.value.on('notification', (data) => {
      showNotification(data);
    });
  }

  function disconnect() {
    socket.value?.disconnect();
    socket.value = null;
    connected.value = false;
  }

  function emit(event: string, data: any) {
    socket.value?.emit(event, data);
  }

  function sendMessage(chatId: string, content: string, options?: { type?: string; replyToId?: string }) {
    emit('message:send', {
      chatId,
      content,
      ...options,
    });
  }

  function startTyping(chatId: string) {
    emit('typing:start', { chatId });
  }

  function stopTyping(chatId: string) {
    emit('typing:stop', { chatId });
  }

  function markAsRead(chatId: string, messageId: string) {
    emit('message:read', { chatId, messageId });
  }

  function joinChat(chatId: string) {
    emit('chat:join', { chatId });
  }

  function leaveChat(chatId: string) {
    emit('chat:leave', { chatId });
  }

  return {
    socket,
    connected,
    connect,
    disconnect,
    emit,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    joinChat,
    leaveChat,
  };
});

function showNotification(data: any) {
  if (Notification.permission === 'granted') {
    new Notification(data.title, {
      body: data.body,
      icon: '/icon.png',
      tag: data.id,
    });
  }
}
