<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const activeTab = ref('profile');

const tabs = [
  { id: 'profile', name: 'Profile', icon: 'user' },
  { id: 'notifications', name: 'Notifications', icon: 'bell' },
  { id: 'privacy', name: 'Privacy', icon: 'shield' },
  { id: 'appearance', name: 'Appearance', icon: 'palette' },
];
</script>

<template>
  <div class="flex h-full bg-slate-900">
    <!-- Sidebar -->
    <aside class="w-64 border-r border-slate-800 p-4">
      <h1 class="text-xl font-bold mb-6">Settings</h1>

      <nav class="space-y-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
          :class="activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </nav>
    </aside>

    <!-- Content -->
    <main class="flex-1 p-8 overflow-y-auto">
      <!-- Profile -->
      <div v-if="activeTab === 'profile'" class="max-w-2xl">
        <h2 class="text-2xl font-bold mb-6">Profile</h2>

        <div class="space-y-6">
          <!-- Avatar -->
          <div class="flex items-center gap-4">
            <div class="avatar w-20 h-20 text-2xl">
              {{ user?.displayName?.[0] || '?' }}
            </div>
            <div>
              <button class="btn-secondary">Change avatar</button>
              <p class="text-sm text-slate-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>

          <!-- Display name -->
          <div>
            <label class="label">Display name</label>
            <input
              type="text"
              :value="user?.displayName"
              class="input max-w-md"
            />
          </div>

          <!-- Username -->
          <div>
            <label class="label">Username</label>
            <input
              type="text"
              :value="user?.username"
              class="input max-w-md"
              disabled
            />
            <p class="text-sm text-slate-500 mt-1">Username cannot be changed</p>
          </div>

          <!-- Bio -->
          <div>
            <label class="label">Bio</label>
            <textarea
              :value="user?.bio"
              rows="3"
              class="input max-w-md"
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>

          <button class="btn-primary">Save changes</button>
        </div>
      </div>

      <!-- Notifications -->
      <div v-if="activeTab === 'notifications'" class="max-w-2xl">
        <h2 class="text-2xl font-bold mb-6">Notifications</h2>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
            <div>
              <p class="font-medium">Push notifications</p>
              <p class="text-sm text-slate-400">Receive push notifications for new messages</p>
            </div>
            <button class="w-12 h-6 bg-indigo-600 rounded-full relative">
              <span class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
            </button>
          </div>

          <div class="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
            <div>
              <p class="font-medium">Sound</p>
              <p class="text-sm text-slate-400">Play sound for new messages</p>
            </div>
            <button class="w-12 h-6 bg-indigo-600 rounded-full relative">
              <span class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
            </button>
          </div>

          <div class="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
            <div>
              <p class="font-medium">Message preview</p>
              <p class="text-sm text-slate-400">Show message content in notifications</p>
            </div>
            <button class="w-12 h-6 bg-slate-600 rounded-full relative">
              <span class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Privacy -->
      <div v-if="activeTab === 'privacy'" class="max-w-2xl">
        <h2 class="text-2xl font-bold mb-6">Privacy</h2>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
            <div>
              <p class="font-medium">Show online status</p>
              <p class="text-sm text-slate-400">Let others see when you're online</p>
            </div>
            <button class="w-12 h-6 bg-indigo-600 rounded-full relative">
              <span class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
            </button>
          </div>

          <div class="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
            <div>
              <p class="font-medium">Read receipts</p>
              <p class="text-sm text-slate-400">Let others know when you've read their messages</p>
            </div>
            <button class="w-12 h-6 bg-indigo-600 rounded-full relative">
              <span class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Appearance -->
      <div v-if="activeTab === 'appearance'" class="max-w-2xl">
        <h2 class="text-2xl font-bold mb-6">Appearance</h2>

        <div class="space-y-6">
          <div>
            <label class="label">Theme</label>
            <div class="flex gap-4">
              <button class="p-4 bg-slate-800 rounded-lg border-2 border-indigo-500">
                <div class="w-16 h-12 bg-slate-900 rounded mb-2"></div>
                <p class="text-sm">Dark</p>
              </button>
              <button class="p-4 bg-slate-800 rounded-lg border-2 border-transparent hover:border-slate-600">
                <div class="w-16 h-12 bg-white rounded mb-2"></div>
                <p class="text-sm">Light</p>
              </button>
              <button class="p-4 bg-slate-800 rounded-lg border-2 border-transparent hover:border-slate-600">
                <div class="w-16 h-12 bg-gradient-to-b from-white to-slate-900 rounded mb-2"></div>
                <p class="text-sm">System</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
