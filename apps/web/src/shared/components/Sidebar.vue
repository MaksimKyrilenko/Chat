<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import NewChatModal from './NewChatModal.vue';

defineProps<{
  collapsed: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const chatStore = useChatStore();

const showNewChatModal = ref(false);

onMounted(() => {
  chatStore.fetchChats();
});

const user = computed(() => authStore.user);
const chats = computed(() => chatStore.chatList);

function getChatName(chat: any) {
  if (chat.type === 'direct') {
    return chat.members?.find((m: any) => m.userId !== user.value?.id)?.user?.displayName || 'Direct Message';
  }
  return chat.name || 'Unnamed Chat';
}

function getChatAvatar(chat: any) {
  if (chat.avatar) return chat.avatar;
  return getChatName(chat)[0]?.toUpperCase() || '?';
}

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <aside
    class="flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300"
    :class="collapsed ? 'w-16' : 'w-72'"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-slate-800">
      <h1 v-if="!collapsed" class="text-xl font-bold text-gradient">UltraChat</h1>
      <button
        class="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
        @click="emit('toggle')"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <!-- Search and New Chat -->
    <div v-if="!collapsed" class="p-3 space-y-2">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          class="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
        @click="showNewChatModal = true"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Chat
      </button>
    </div>
    <div v-else class="p-2">
      <button
        class="w-full p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
        @click="showNewChatModal = true"
        title="New Chat"
      >
        <svg class="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <!-- Chat list -->
    <nav class="flex-1 overflow-y-auto p-2 space-y-1">
      <router-link
        v-for="chat in chats"
        :key="chat.id"
        :to="{ name: 'chat', params: { id: chat.id } }"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors"
        :class="{ 'bg-slate-800': route.params.id === chat.id }"
      >
        <!-- Avatar -->
        <div class="relative flex-shrink-0">
          <div class="avatar-md">
            {{ getChatAvatar(chat) }}
          </div>
          <span
            v-if="chat.type === 'direct'"
            class="absolute -bottom-0.5 -right-0.5 online-indicator"
          ></span>
        </div>

        <!-- Info -->
        <div v-if="!collapsed" class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <p class="font-medium truncate">{{ getChatName(chat) }}</p>
            <span v-if="chat.unreadCount" class="badge-primary">
              {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
            </span>
          </div>
          <p v-if="chat.lastMessage" class="text-sm text-slate-400 truncate">
            {{ chat.lastMessage.content }}
          </p>
        </div>
      </router-link>

      <!-- Empty state -->
      <div v-if="chats.length === 0 && !collapsed" class="text-center py-8 text-slate-500">
        <p>No chats yet</p>
        <p class="text-sm">Start a conversation!</p>
        <button
          class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          @click="showNewChatModal = true"
        >
          Create your first chat
        </button>
      </div>
    </nav>

    <!-- New Chat Modal -->
    <NewChatModal :open="showNewChatModal" @close="showNewChatModal = false" />

    <!-- User section -->
    <div class="p-3 border-t border-slate-800">
      <div class="flex items-center gap-3">
        <div class="avatar-md flex-shrink-0">
          {{ user?.displayName?.[0] || '?' }}
        </div>
        <div v-if="!collapsed" class="flex-1 min-w-0">
          <p class="font-medium truncate">{{ user?.displayName }}</p>
          <p class="text-sm text-slate-400 truncate">@{{ user?.username }}</p>
        </div>
        <button
          v-if="!collapsed"
          class="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
          @click="handleLogout"
          title="Logout"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>
