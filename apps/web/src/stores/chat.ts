import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/shared/api';
import type { Chat, Message, UserPresence } from '@/shared/types';

export const useChatStore = defineStore('chat', () => {
  const chats = ref<Map<string, Chat>>(new Map());
  const messages = ref<Map<string, Message[]>>(new Map());
  const typingUsers = ref<Map<string, Set<string>>>(new Map());
  const presence = ref<Map<string, UserPresence>>(new Map());
  const activeChat = ref<string | null>(null);
  const loading = ref(false);

  const chatList = computed(() => {
    return Array.from(chats.value.values()).sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  });

  const currentChat = computed(() => {
    return activeChat.value ? chats.value.get(activeChat.value) : null;
  });

  const currentMessages = computed(() => {
    return activeChat.value ? messages.value.get(activeChat.value) || [] : [];
  });

  const currentTypingUsers = computed(() => {
    return activeChat.value ? Array.from(typingUsers.value.get(activeChat.value) || []) : [];
  });

  async function fetchChats() {
    loading.value = true;
    try {
      const response = await api.get<Chat[]>('/api/chats');
      response.data.forEach((chat) => {
        chats.value.set(chat.id, chat);
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchMessages(chatId: string, options?: { before?: string }) {
    loading.value = true;
    try {
      const response = await api.get<Message[]>(`/api/chats/${chatId}/messages`, {
        params: options,
      });

      const existing = messages.value.get(chatId) || [];
      if (options?.before) {
        messages.value.set(chatId, [...response.data, ...existing]);
      } else {
        messages.value.set(chatId, response.data);
      }
    } finally {
      loading.value = false;
    }
  }

  function setActiveChat(chatId: string | null) {
    activeChat.value = chatId;
  }

  function addMessage(chatId: string, message: Message) {
    const chatMessages = messages.value.get(chatId) || [];
    messages.value.set(chatId, [...chatMessages, message]);

    // Update chat's last message
    const chat = chats.value.get(chatId);
    if (chat) {
      chat.lastMessageAt = message.createdAt;
      chats.value.set(chatId, { ...chat });
    }
  }

  function updateMessage(chatId: string, messageId: string, updates: Partial<Message>) {
    const chatMessages = messages.value.get(chatId);
    if (!chatMessages) return;

    const index = chatMessages.findIndex((m) => m.id === messageId);
    if (index !== -1) {
      chatMessages[index] = { ...chatMessages[index], ...updates };
      messages.value.set(chatId, [...chatMessages]);
    }
  }

  function removeMessage(chatId: string, messageId: string) {
    const chatMessages = messages.value.get(chatId);
    if (!chatMessages) return;

    messages.value.set(
      chatId,
      chatMessages.filter((m) => m.id !== messageId),
    );
  }

  function handleReaction(data: { chatId: string; messageId: string; emoji: string; userId: string; action: 'add' | 'remove' }) {
    const chatMessages = messages.value.get(data.chatId);
    if (!chatMessages) return;

    const message = chatMessages.find((m) => m.id === data.messageId);
    if (!message) return;

    const reaction = message.reactions.find((r) => r.emoji === data.emoji);

    if (data.action === 'add') {
      if (reaction) {
        if (!reaction.userIds.includes(data.userId)) {
          reaction.userIds.push(data.userId);
          reaction.count++;
        }
      } else {
        message.reactions.push({
          emoji: data.emoji,
          userIds: [data.userId],
          count: 1,
        });
      }
    } else {
      if (reaction) {
        reaction.userIds = reaction.userIds.filter((id) => id !== data.userId);
        reaction.count--;
        if (reaction.count === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== data.emoji);
        }
      }
    }

    messages.value.set(data.chatId, [...chatMessages]);
  }

  function setTyping(chatId: string, userId: string, isTyping: boolean) {
    const users = typingUsers.value.get(chatId) || new Set();

    if (isTyping) {
      users.add(userId);
    } else {
      users.delete(userId);
    }

    typingUsers.value.set(chatId, users);
  }

  function updatePresence(userId: string, status: string) {
    presence.value.set(userId, {
      userId,
      status: status as any,
      lastSeen: new Date(),
    });
  }

  function getUserPresence(userId: string): UserPresence | undefined {
    return presence.value.get(userId);
  }

  async function createChat(data: { type: string; name?: string; memberIds: string[] }) {
    const response = await api.post<Chat>('/api/chats', data);
    chats.value.set(response.data.id, response.data);
    return response.data;
  }

  return {
    chats,
    messages,
    typingUsers,
    presence,
    activeChat,
    loading,
    chatList,
    currentChat,
    currentMessages,
    currentTypingUsers,
    fetchChats,
    fetchMessages,
    setActiveChat,
    addMessage,
    updateMessage,
    removeMessage,
    handleReaction,
    setTyping,
    updatePresence,
    getUserPresence,
    createChat,
  };
});
