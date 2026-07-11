<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const navigation = [
  { name: 'Dashboard', href: '/', icon: 'dashboard' },
  { name: 'Leads', href: '/leads', icon: 'users' },
  { name: 'Opportunities', href: '/opportunities', icon: 'chart-bar' },
  { name: 'Orders', href: '/orders', icon: 'shopping-cart' },
  { name: 'Reports', href: '/reports', icon: 'document-text' },
]

const route = useRoute()
</script>

<template>
  <aside 
    class="flex-shrink-0 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out hidden md:flex flex-col"
    :class="[isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0']"
  >
    <div class="h-16 flex items-center px-6 border-b border-slate-100">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
          SFA
        </div>
        <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
          Nexus
        </span>
      </div>
    </div>
    
    <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      <router-link 
        v-for="item in navigation" 
        :key="item.name" 
        :to="item.href"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
        :class="[
          route.path === item.href 
            ? 'bg-blue-50/80 text-blue-700 font-medium' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        ]"
      >
        <!-- Icon Placeholder -->
        <div 
          class="w-5 h-5 rounded flex items-center justify-center transition-colors"
          :class="[
            route.path === item.href ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
          ]"
        >
          <svg v-if="item.icon === 'dashboard'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
          <svg v-else-if="item.icon === 'users'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          <svg v-else-if="item.icon === 'chart-bar'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
          <svg v-else-if="item.icon === 'shopping-cart'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        </div>
        {{ item.name }}
      </router-link>
    </nav>
    
    <!-- User Profile Snippet at bottom -->
    <div class="p-4 border-t border-slate-100">
      <div class="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
        <div class="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=Sales+Rep&background=f1f5f9&color=334155" alt="User" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900 truncate">Alex Jensen</p>
          <p class="text-xs text-slate-500 truncate">Senior Rep</p>
        </div>
      </div>
    </div>
  </aside>
</template>
