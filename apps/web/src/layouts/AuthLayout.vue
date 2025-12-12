<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gradient">UltraChat</h1>
        <p class="text-slate-400 mt-2">Modern messaging for everyone</p>
      </div>

      <!-- Auth form -->
      <div class="card">
        <RouterView />
      </div>

      <!-- Footer -->
      <p class="text-center text-slate-500 text-sm mt-6">
        © 2024 UltraChat. All rights reserved.
      </p>
    </div>
  </div>
</template>
