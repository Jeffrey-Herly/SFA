<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Email and password are required'
    return
  }

  error.value = ''
  isLoading.value = true

  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Login failed. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
    <!-- Decorative Glowing Background Orbs -->
    <div class="absolute w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] -top-40 -left-40 animate-pulse"></div>
    <div class="absolute w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[130px] -bottom-40 -right-40 animate-pulse" style="animation-delay: 2s"></div>

    <div class="w-full max-w-md p-8 relative z-10">
      <!-- SFA Logo & Branding -->
      <div class="text-center mb-8 animate-fade-in">
        <div class="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-xl shadow-blue-500/20 mb-4 transform hover:scale-105 transition-transform duration-300">
          SFA
        </div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight">
          SFA <span class="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">Nexus</span>
        </h1>
        <p class="text-slate-400 text-sm mt-2">Sign in to manage your sales pipeline and tasks.</p>
      </div>

      <!-- Glassmorphic Login Card -->
      <div class="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-black/40">
        <!-- Error Alert -->
        <transition name="slide-down">
          <div 
            v-if="error" 
            class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 flex-shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{{ error }}</span>
          </div>
        </transition>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Email Input -->
          <div class="space-y-2">
            <label class="text-xs font-semibold text-slate-300 tracking-wider uppercase">Email Address</label>
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <input 
                v-model="email"
                type="email" 
                required
                placeholder="you@company.com" 
                class="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-slate-600"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-slate-300 tracking-wider uppercase">Password</label>
              <a href="#" class="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
            </div>
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <input 
                v-model="password"
                type="password" 
                required
                placeholder="••••••••" 
                class="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-slate-600"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-semibold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none mt-6"
          >
            <span v-if="isLoading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <!-- Testing Credentials Helper -->
        <div class="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <p class="text-xs text-slate-500">
            Testing Account: <code class="text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded">sales1@sfa.com</code> / <code class="text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded">SfaPassword123!</code>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom animations */
.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
