<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSocketStore } from '@/stores/socket';
import { useDebounceFn } from '@vueuse/core';

const props = defineProps<{
  chatId: string;
  replyTo?: { id: string; content: string; senderName: string };
}>();

const emit = defineEmits<{
  send: [content: string, options?: { replyToId?: string }];
  cancelReply: [];
}>();

const socketStore = useSocketStore();
const content = ref('');
const isTyping = ref(false);

const stopTypingDebounced = useDebounceFn(() => {
  if (isTyping.value) {
    socketStore.stopTyping(props.chatId);
    isTyping.value = false;
  }
}, 2000);

function handleInput() {
  if (!isTyping.value && content.value.length > 0) {
    socketStore.startTyping(props.chatId);
    isTyping.value = true;
  }
  stopTypingDebounced();
}

function handleSend() {
  const trimmed = content.value.trim();
  if (!trimmed) return;

  emit('send', trimmed, props.replyTo ? { replyToId: props.replyTo.id } : undefined);
  content.value = '';

  if (isTyping.value) {
    socketStore.stopTyping(props.chatId);
    isTyping.value = false;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

watch(() => props.chatId, () => {
  content.value = '';
  if (isTyping.value) {
    isTyping.value = false;
  }
});
</script>

<template>
  <div class="border-t border-slate-800 bg-slate-900 p-4">
    <!-- Reply preview -->
    <div
      v-if="replyTo"
      class="flex items-center justify-between mb-2 px-3 py-2 bg-slate-800 rounded-lg"
    >
      <div class="flex items-center gap-2">
        <div class="w-1 h-8 bg-indigo-500 rounded"></div>
        <div>
          <p class="text-sm font-medium text-indigo-400">{{ replyTo.senderName }}</p>
          <p class="text-sm text-slate-400 truncate max-w-xs">{{ replyTo.content }}</p>
        </div>
      </div>
      <button
        class="p-1 hover:bg-slate-700 rounded"
        @click="emit('cancelReply')"
      >
        <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Input area -->
    <div class="flex items-end gap-3">
      <!-- Attachment button -->
      <button class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-300">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      <!-- Text input -->
      <div class="flex-1 relative">
        <textarea
          v-model="content"
          placeholder="Type a message..."
          rows="1"
          class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          @input="handleInput"
          @keydown="handleKeydown"
        ></textarea>
      </div>

      <!-- Emoji button -->
      <button class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-300">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <!-- Send button -->
      <button
        class="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :disabled="!content.trim()"
        @click="handleSend"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  </div>
</template>
