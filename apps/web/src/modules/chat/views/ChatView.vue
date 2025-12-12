<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import { useSocketStore } from '@/stores/socket';
import { useAuthStore } from '@/stores/auth';
import MessageItem from '../components/MessageItem.vue';
import MessageInput from '../components/MessageInput.vue';
import ChatHeader from '../components/ChatHeader.vue';
import TypingIndicator from '../components/TypingIndicator.vue';

const route = useRoute();
const chatStore = useChatStore();
const socketStore = useSocketStore();
const authStore = useAuthStore();

const messagesContainer = ref<HTMLElement | null>(null);
const loading = ref(false);

const chatId = computed(() => route.params.id as string);
const chat = computed(() => chatStore.chats.get(chatId.value));
const messages = computed(() => chatStore.messages.get(chatId.value) || []);
const typingUsers = computed(() => chatStore.currentTypingUsers);

async function loadMessages() {
  if (!chatId.value) return;
  loading.value = true;
  try {
    await chatStore.fetchMessages(chatId.value);
    scrollToBottom();
  } finally {
    loading.value = false;
  }
}

async function loadMoreMessages() {
  if (!chatId.value || messages.value.length === 0) return;
  const firstMessage = messages.value[0];
  await chatStore.fetchMessages(chatId.value, { before: firstMessage.id });
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function handleSendMessage(content: string, options?: { replyToId?: string }) {
  socketStore.sendMessage(chatId.value, content, options);
}

function handleScroll(e: Event) {
  const target = e.target as HTMLElement;
  if (target.scrollTop === 0 && !loading.value) {
    loadMoreMessages();
  }
}

watch(chatId, (newId, oldId) => {
  if (oldId) {
    socketStore.leaveChat(oldId);
  }
  if (newId) {
    chatStore.setActiveChat(newId);
    socketStore.joinChat(newId);
    loadMessages();
  }
});

watch(
  () => messages.value.length,
  (newLen, oldLen) => {
    if (newLen > oldLen) {
      scrollToBottom();
    }
  },
);

onMounted(() => {
  if (chatId.value) {
    chatStore.setActiveChat(chatId.value);
    socketStore.joinChat(chatId.value);
    loadMessages();
  }
});

onUnmounted(() => {
  if (chatId.value) {
    socketStore.leaveChat(chatId.value);
    chatStore.setActiveChat(null);
  }
});
</script>

<template>
  <div class="flex flex-col h-full bg-slate-900">
    <!-- Header -->
    <ChatHeader v-if="chat" :chat="chat" />

    <!-- Messages -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4"
      @scroll="handleScroll"
    >
      <div v-if="loading" class="flex justify-center py-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>

      <TransitionGroup name="message">
        <MessageItem
          v-for="message in messages"
          :key="message.id"
          :message="message"
          :is-own="message.senderId === authStore.user?.id"
        />
      </TransitionGroup>

      <TypingIndicator v-if="typingUsers.length > 0" :user-ids="typingUsers" />
    </div>

    <!-- Input -->
    <MessageInput
      :chat-id="chatId"
      @send="handleSendMessage"
    />
  </div>
</template>

<style scoped>
.message-enter-active,
.message-leave-active {
  transition: all 0.3s ease;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.message-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
