<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '@/shared/types';
import EmojiPicker from './EmojiPicker.vue';

const props = defineProps<{
  message: Message;
  isOwn: boolean;
}>();

const emit = defineEmits<{
  reply: [message: Message];
  react: [messageId: string, emoji: string];
}>();

const showEmojiPicker = ref(false);
const showActions = ref(false);

const formattedTime = computed(() => {
  return formatDistanceToNow(new Date(props.message.createdAt), { addSuffix: true });
});

const hasReactions = computed(() => props.message.reactions.length > 0);

function handleReact(emoji: string) {
  emit('react', props.message.id, emoji);
  showEmojiPicker.value = false;
}
</script>

<template>
  <div
    class="group flex gap-3"
    :class="{ 'flex-row-reverse': isOwn }"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <!-- Avatar -->
    <div class="flex-shrink-0">
      <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
        {{ message.sender?.displayName?.[0] || '?' }}
      </div>
    </div>

    <!-- Content -->
    <div class="flex flex-col max-w-[70%]" :class="{ 'items-end': isOwn }">
      <!-- Sender name & time -->
      <div class="flex items-center gap-2 mb-1 text-xs text-slate-400">
        <span v-if="!isOwn" class="font-medium">{{ message.sender?.displayName }}</span>
        <span>{{ formattedTime }}</span>
        <span v-if="message.isEdited" class="text-slate-500">(edited)</span>
      </div>

      <!-- Reply preview -->
      <div
        v-if="message.replyTo"
        class="mb-1 px-3 py-1 rounded bg-slate-800/50 border-l-2 border-indigo-500 text-sm text-slate-400"
      >
        <span class="font-medium">{{ message.replyTo.sender?.displayName }}</span>
        <p class="truncate">{{ message.replyTo.content }}</p>
      </div>

      <!-- Message bubble -->
      <div
        class="relative px-4 py-2 rounded-2xl"
        :class="[
          isOwn
            ? 'bg-indigo-600 text-white rounded-br-md'
            : 'bg-slate-800 text-slate-100 rounded-bl-md'
        ]"
      >
        <!-- Text content -->
        <p v-if="message.type === 'text'" class="whitespace-pre-wrap break-words">
          {{ message.content }}
        </p>

        <!-- Image -->
        <img
          v-else-if="message.type === 'image' && message.attachments[0]"
          :src="message.attachments[0].url"
          :alt="message.attachments[0].filename"
          class="max-w-full rounded-lg"
        />

        <!-- File -->
        <div
          v-else-if="message.type === 'file' && message.attachments[0]"
          class="flex items-center gap-2"
        >
          <svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p class="font-medium">{{ message.attachments[0].filename }}</p>
            <p class="text-xs text-slate-400">{{ formatFileSize(message.attachments[0].size) }}</p>
          </div>
        </div>

        <!-- Actions -->
        <Transition name="fade">
          <div
            v-if="showActions"
            class="absolute -top-8 right-0 flex items-center gap-1 bg-slate-800 rounded-lg p-1 shadow-lg"
          >
            <button
              class="p-1.5 hover:bg-slate-700 rounded"
              @click="showEmojiPicker = !showEmojiPicker"
            >
              😀
            </button>
            <button
              class="p-1.5 hover:bg-slate-700 rounded"
              @click="emit('reply', message)"
            >
              ↩️
            </button>
          </div>
        </Transition>

        <!-- Emoji picker -->
        <EmojiPicker
          v-if="showEmojiPicker"
          class="absolute -top-48 right-0 z-10"
          @select="handleReact"
          @close="showEmojiPicker = false"
        />
      </div>

      <!-- Reactions -->
      <div v-if="hasReactions" class="flex flex-wrap gap-1 mt-1">
        <button
          v-for="reaction in message.reactions"
          :key="reaction.emoji"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sm"
          @click="handleReact(reaction.emoji)"
        >
          <span>{{ reaction.emoji }}</span>
          <span class="text-slate-400">{{ reaction.count }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
