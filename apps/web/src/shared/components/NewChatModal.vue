<script setup lang="ts">
import { ref, watch } from 'vue';
import { api } from '@/shared/api';
import { useChatStore } from '@/stores/chat';
import { useRouter } from 'vue-router';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const chatStore = useChatStore();

const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const selectedUsers = ref<any[]>([]);
const chatName = ref('');
const chatType = ref<'direct' | 'group'>('direct');
const loading = ref(false);
const searching = ref(false);

let searchTimeout: ReturnType<typeof setTimeout>;

watch(searchQuery, (query) => {
  clearTimeout(searchTimeout);
  if (query.length < 2) {
    searchResults.value = [];
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    searching.value = true;
    try {
      const response = await api.get('/api/users/search', {
        params: { q: query, limit: 10 },
      });
      searchResults.value = response.data;
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      searching.value = false;
    }
  }, 300);
});

watch(() => selectedUsers.value.length, (count) => {
  chatType.value = count > 1 ? 'group' : 'direct';
});

function selectUser(user: any) {
  if (!selectedUsers.value.find((u) => u.id === user.id)) {
    selectedUsers.value.push(user);
  }
  searchQuery.value = '';
  searchResults.value = [];
}

function removeUser(userId: string) {
  selectedUsers.value = selectedUsers.value.filter((u) => u.id !== userId);
}

async function createChat() {
  if (selectedUsers.value.length === 0) return;
  
  loading.value = true;
  try {
    const chat = await chatStore.createChat({
      type: chatType.value,
      name: chatType.value === 'group' ? chatName.value : undefined,
      memberIds: selectedUsers.value.map((u) => u.id),
    });
    
    emit('close');
    router.push({ name: 'chat', params: { id: chat.id } });
  } catch (error) {
    console.error('Failed to create chat:', error);
  } finally {
    loading.value = false;
  }
}

function close() {
  searchQuery.value = '';
  searchResults.value = [];
  selectedUsers.value = [];
  chatName.value = '';
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="close"
    >
      <div class="bg-slate-900 rounded-xl w-full max-w-md mx-4 shadow-xl border border-slate-800">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 class="text-lg font-semibold">New Chat</h2>
          <button
            class="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
            @click="close"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-4">
          <!-- Selected users -->
          <div v-if="selectedUsers.length > 0" class="flex flex-wrap gap-2">
            <div
              v-for="user in selectedUsers"
              :key="user.id"
              class="flex items-center gap-1 px-2 py-1 bg-indigo-600 rounded-full text-sm"
            >
              <span>{{ user.displayName }}</span>
              <button
                class="hover:text-red-300"
                @click="removeUser(user.id)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Group name (for group chats) -->
          <div v-if="chatType === 'group'">
            <input
              v-model="chatName"
              type="text"
              placeholder="Group name"
              class="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Search input -->
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search users..."
              class="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Search results -->
          <div v-if="searching" class="text-center py-4 text-slate-400">
            Searching...
          </div>
          <div v-else-if="searchResults.length > 0" class="space-y-1 max-h-48 overflow-y-auto">
            <button
              v-for="user in searchResults"
              :key="user.id"
              class="w-full flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors"
              @click="selectUser(user)"
            >
              <div class="avatar-sm">
                {{ user.displayName?.[0] || '?' }}
              </div>
              <div class="text-left">
                <p class="font-medium">{{ user.displayName }}</p>
                <p class="text-sm text-slate-400">@{{ user.username }}</p>
              </div>
            </button>
          </div>
          <div v-else-if="searchQuery.length >= 2" class="text-center py-4 text-slate-400">
            No users found
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 p-4 border-t border-slate-800">
          <button
            class="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
            @click="close"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="selectedUsers.length === 0 || loading"
            @click="createChat"
          >
            {{ loading ? 'Creating...' : 'Create Chat' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
