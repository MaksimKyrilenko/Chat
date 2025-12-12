<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import Sidebar from '@/shared/components/Sidebar.vue';
import CallOverlay from '@/modules/calls/components/CallOverlay.vue';
import { useCallStore } from '@/stores/call';

const callStore = useCallStore();
const sidebarCollapsed = ref(false);
</script>

<template>
  <div class="flex h-screen bg-slate-950">
    <!-- Sidebar -->
    <Sidebar
      :collapsed="sidebarCollapsed"
      @toggle="sidebarCollapsed = !sidebarCollapsed"
    />

    <!-- Main content -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <RouterView />
    </main>

    <!-- Call overlay -->
    <CallOverlay v-if="callStore.activeCall" />
  </div>
</template>
