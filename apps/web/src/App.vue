<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';

const authStore = useAuthStore();
const socketStore = useSocketStore();

onMounted(async () => {
  // Try to restore session
  await authStore.checkAuth();

  // Connect WebSocket if authenticated
  if (authStore.isAuthenticated) {
    socketStore.connect();
  }
});
</script>

<template>
  <RouterView />
</template>
