<script setup lang="ts">
defineProps<{
  userIds: string[];
}>();
</script>

<template>
  <div class="flex items-center gap-2 px-4 py-2">
    <div class="flex gap-1">
      <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
      <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
      <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
    </div>
    <span class="text-sm text-slate-400">
      {{ userIds.length === 1 ? 'Someone is' : `${userIds.length} people are` }} typing...
    </span>
  </div>
</template>
