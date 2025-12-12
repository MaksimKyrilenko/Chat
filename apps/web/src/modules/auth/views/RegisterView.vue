<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';

const router = useRouter();
const authStore = useAuthStore();
const socketStore = useSocketStore();

const email = ref('');
const username = ref('');
const displayName = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const passwordsMatch = computed(() => password.value === confirmPassword.value);
const isValidPassword = computed(() => {
  const p = password.value;
  return p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);
});

async function handleSubmit() {
  if (!passwordsMatch.value) {
    error.value = 'Passwords do not match';
    return;
  }

  if (!isValidPassword.value) {
    error.value = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    return;
  }

  error.value = '';
  loading.value = true;

  try {
    await authStore.register({
      email: email.value,
      username: username.value,
      password: password.value,
      displayName: displayName.value || undefined,
    });
    socketStore.connect();
    router.push({ name: 'home' });
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <h2 class="text-2xl font-bold text-center mb-6">Create account</h2>

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

    <!-- Username -->
    <div>
      <label for="username" class="label">Username</label>
      <input
        id="username"
        v-model="username"
        type="text"
        required
        autocomplete="username"
        class="input"
        placeholder="johndoe"
        pattern="^[a-zA-Z0-9_]{3,30}$"
      />
      <p class="text-xs text-slate-500 mt-1">3-30 characters, letters, numbers, underscores only</p>
    </div>

    <!-- Display name -->
    <div>
      <label for="displayName" class="label">Display name (optional)</label>
      <input
        id="displayName"
        v-model="displayName"
        type="text"
        autocomplete="name"
        class="input"
        placeholder="John Doe"
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
        autocomplete="new-password"
        class="input"
        :class="{ 'input-error': password && !isValidPassword }"
        placeholder="••••••••"
      />
      <p class="text-xs text-slate-500 mt-1">Min 8 chars with uppercase, lowercase, and number</p>
    </div>

    <!-- Confirm password -->
    <div>
      <label for="confirmPassword" class="label">Confirm password</label>
      <input
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        required
        autocomplete="new-password"
        class="input"
        :class="{ 'input-error': confirmPassword && !passwordsMatch }"
        placeholder="••••••••"
      />
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="loading || !passwordsMatch || !isValidPassword"
      class="btn-primary w-full"
    >
      <span v-if="loading" class="flex items-center gap-2">
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Creating account...
      </span>
      <span v-else>Create account</span>
    </button>

    <!-- Login link -->
    <p class="text-center text-slate-400">
      Already have an account?
      <router-link to="/auth/login" class="text-indigo-400 hover:text-indigo-300">
        Sign in
      </router-link>
    </p>
  </form>
</template>
