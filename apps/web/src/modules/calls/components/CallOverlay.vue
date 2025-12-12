<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useCallStore } from '@/stores/call';

const callStore = useCallStore();

const localVideoRef = ref<HTMLVideoElement | null>(null);
const remoteVideoRef = ref<HTMLVideoElement | null>(null);

const isVideoCall = computed(() => callStore.activeCall?.type === 'video');
const callDuration = ref(0);
let durationInterval: number | null = null;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

watch(
  () => callStore.localStream,
  (stream) => {
    if (localVideoRef.value && stream) {
      localVideoRef.value.srcObject = stream;
    }
  },
  { immediate: true }
);

watch(
  () => callStore.remoteStreams,
  (streams) => {
    if (remoteVideoRef.value && streams.size > 0) {
      const firstStream = streams.values().next().value;
      remoteVideoRef.value.srcObject = firstStream ?? null;
    }
  },
  { deep: true }
);

onMounted(() => {
  durationInterval = window.setInterval(() => {
    callDuration.value++;
  }, 1000);
});

onUnmounted(() => {
  if (durationInterval) {
    clearInterval(durationInterval);
  }
});
</script>

<template>
  <div class="fixed inset-0 z-50 bg-slate-950/95 flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4">
      <div>
        <h2 class="text-lg font-medium">{{ isVideoCall ? 'Video' : 'Voice' }} Call</h2>
        <p class="text-sm text-slate-400">{{ formatDuration(callDuration) }}</p>
      </div>
    </div>

    <!-- Video area -->
    <div class="flex-1 relative">
      <!-- Remote video (full screen) -->
      <video
        v-if="isVideoCall"
        ref="remoteVideoRef"
        autoplay
        playsinline
        class="w-full h-full object-cover"
      ></video>

      <!-- Audio-only placeholder -->
      <div v-else class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="avatar w-32 h-32 text-4xl mx-auto mb-4">
            ?
          </div>
          <p class="text-xl font-medium">Voice Call</p>
        </div>
      </div>

      <!-- Local video (picture-in-picture) -->
      <div
        v-if="isVideoCall"
        class="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg"
      >
        <video
          ref="localVideoRef"
          autoplay
          playsinline
          muted
          class="w-full h-full object-cover"
          :class="{ 'opacity-50': !callStore.isVideoEnabled }"
        ></video>
        <div
          v-if="!callStore.isVideoEnabled"
          class="absolute inset-0 flex items-center justify-center bg-slate-900/80"
        >
          <svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex items-center justify-center gap-4 p-6 bg-slate-900/50">
      <!-- Mute -->
      <button
        class="p-4 rounded-full transition-colors"
        :class="callStore.isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'"
        @click="callStore.toggleMute()"
      >
        <svg v-if="!callStore.isMuted" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      </button>

      <!-- Video toggle -->
      <button
        v-if="isVideoCall"
        class="p-4 rounded-full transition-colors"
        :class="!callStore.isVideoEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'"
        @click="callStore.toggleVideo()"
      >
        <svg v-if="callStore.isVideoEnabled" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </button>

      <!-- Screen share -->
      <button
        v-if="isVideoCall"
        class="p-4 rounded-full transition-colors"
        :class="callStore.isScreenSharing ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 hover:bg-slate-600'"
        @click="callStore.isScreenSharing ? callStore.stopScreenShare() : callStore.startScreenShare()"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>

      <!-- End call -->
      <button
        class="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
        @click="callStore.endCall()"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
        </svg>
      </button>
    </div>
  </div>
</template>
