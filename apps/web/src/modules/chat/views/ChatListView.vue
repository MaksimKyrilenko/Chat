<script setup lang="ts">
import { onMounted } from 'vue';
import { useChatStore } from '@/stores/chat';

const chatStore = useChatStore();

onMounted(() => {
  chatStore.fetchChats();
});
</script>

<template>
  <div class="flex items-center justify-center h-full bg-slate-900">
    <div class="text-center">
      <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
        <svg class="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h2 class="text-xl font-medium text-slate-300 mb-2">Welcome to UltraChat</h2>
      <p class="text-slate-500 max-w-sm">
        Select a conversation from the sidebar or start a new chat to begin messaging.
      </p>
    </div>
  </div>
</template>
