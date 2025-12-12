<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import { useCallStore } from '@/stores/call';
import { useAuthStore } from '@/stores/auth';
import type { Chat } from '@/shared/types';

const props = defineProps<{
  chat: Chat;
}>();

const router = useRouter();
const chatStore = useChatStore();
const callStore = useCallStore();
const authStore = useAuthStore();

const chatName = computed(() => {
  if (props.chat.type === 'direct') {
    const otherMember = props.chat.members?.find(
      (m) => m.userId !== authStore.user?.id
    );
    return otherMember?.user?.displayName || 'Direct Message';
  }
  return props.chat.name || 'Unnamed Chat';
});

const memberCount = computed(() => props.chat.members?.length || 0);

const typingUsers = computed(() => chatStore.currentTypingUsers);

const typingText = computed(() => {
  if (typingUsers.value.length === 0) return '';
  if (typingUsers.value.length === 1) return 'typing...';
  if (typingUsers.value.length === 2) return '2 people typing...';
  return `${typingUsers.value.length} people typing...`;
});

function startVoiceCall() {
  const participantIds = props.chat.members?.map((m) => m.userId) || [];
  callStore.initiateCall(props.chat.id, 'voice', participantIds);
}

function startVideoCall() {
  const participantIds = props.chat.members?.map((m) => m.userId) || [];
  callStore.initiateCall(props.chat.id, 'video', participantIds);
}
</script>

<template>
  <header class="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
    <!-- Chat info -->
    <div class="flex items-center gap-3">
      <!-- Back button (mobile) -->
      <button
        class="lg:hidden p-2 hover:bg-slate-800 rounded-lg text-slate-400"
        @click="router.push({ name: 'home' })"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Avatar -->
      <div class="relative">
        <div class="avatar-md">
          {{ chatName[0]?.toUpperCase() || '?' }}
        </div>
        <span
          v-if="chat.type === 'direct'"
          class="absolute -bottom-0.5 -right-0.5 online-indicator"
        ></span>
      </div>

      <!-- Name & status -->
      <div>
        <h2 class="font-medium">{{ chatName }}</h2>
        <p v-if="typingText" class="text-sm text-indigo-400">
          {{ typingText }}
        </p>
        <p v-else-if="chat.type !== 'direct'" class="text-sm text-slate-400">
          {{ memberCount }} members
        </p>
        <p v-else class="text-sm text-slate-400">
          Online
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1">
      <!-- Voice call -->
      <button
        class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-300"
        title="Voice call"
        @click="startVoiceCall"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </button>

      <!-- Video call -->
      <button
        class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-300"
        title="Video call"
        @click="startVideoCall"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      <!-- Search -->
      <button
        class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-300"
        title="Search in chat"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      <!-- More options -->
      <button
        class="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-300"
        title="More options"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>
  </header>
</template>
