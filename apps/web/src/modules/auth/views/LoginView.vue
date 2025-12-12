<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';

const router = useRouter();
const authStore = useAuthStore();
const socketStore = useSocketStore();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleSubmit() {
  error.value = '';
  loading.value = true;

  try {
    await authStore.login(email.value, password.value);
    socketStore.connect();
    router.push({ name: 'home' });
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <h2 class="text-2xl font-bold text-center mb-6">Welcome back</h2>

    <!-- Error message -->
    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
      {{ error }}
    </div>

    <!-- Email -->
    <div>
      <label for="email" class="label">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        autocomplete="email"
        class="input"
        placeholder="you@example.com"
      />
    </div>

    <!-- Password -->
    <div>
      <label for="password" class="label">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        autocomplete="current-password"
        class="input"
        placeholder="••••••••"
      />
    </div>

    <!-- Forgot password -->
    <div class="text-right">
      <a href="#" class="text-sm text-indigo-400 hover:text-indigo-300">
        Forgot password?
      </a>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="loading"
      class="btn-primary w-full"
    >
      <span v-if="loading" class="flex items-center gap-2">
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Signing in...
      </span>
      <span v-else>Sign in</span>
    </button>

    <!-- Register link -->
    <p class="text-center text-slate-400">
      Don't have an account?
      <router-link to="/auth/register" class="text-indigo-400 hover:text-indigo-300">
        Sign up
      </router-link>
    </p>
  </form>
</template>
