<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  select: [emoji: string];
  close: [];
}>();

const categories = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '🙏'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'] },
  { name: 'Objects', emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '❌', '❓', '❗', '💬', '💭', '🗯️', '💤'] },
];

const activeCategory = ref(0);
</script>

<template>
  <div class="bg-slate-800 rounded-lg shadow-xl border border-slate-700 w-72 overflow-hidden">
    <!-- Category tabs -->
    <div class="flex border-b border-slate-700">
      <button
        v-for="(category, index) in categories"
        :key="category.name"
        class="flex-1 py-2 text-xs font-medium transition-colors"
        :class="activeCategory === index ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'"
        @click="activeCategory = index"
      >
        {{ category.emojis[0] }}
      </button>
    </div>

    <!-- Emoji grid -->
    <div class="p-2 h-48 overflow-y-auto">
      <div class="grid grid-cols-8 gap-1">
        <button
          v-for="emoji in categories[activeCategory].emojis"
          :key="emoji"
          class="p-1.5 text-xl hover:bg-slate-700 rounded transition-colors"
          @click="emit('select', emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>
