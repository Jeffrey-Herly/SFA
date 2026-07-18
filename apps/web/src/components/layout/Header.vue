<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { notificationsService, NotificationData } from '../../services/notifications'

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const authStore = useAuthStore()
const notifications = ref<NotificationData[]>([])
const isDropdownOpen = ref(false)
let pollInterval: any = null

const fetchNotifications = async () => {
  if (!authStore.isAuthenticated) return
  try {
    const list = await notificationsService.getNotifications()
    notifications.value = list
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  }
}

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.is_read).length
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
  if (isDropdownOpen.value) {
    fetchNotifications()
  }
}

const markAsRead = async (id: string) => {
  try {
    await notificationsService.markAsRead(id)
    fetchNotifications()
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

const markAllAsRead = async () => {
  try {
    await notificationsService.markAllAsRead()
    fetchNotifications()
  } catch (error) {
    console.error('Failed to mark all as read:', error)
  }
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

onMounted(() => {
  fetchNotifications()
  pollInterval = setInterval(fetchNotifications, 10000) // Poll every 10 seconds
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <header class="h-16 bg-white/70 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
    <!-- Click outside handler shield if dropdown open -->
    <div 
      v-if="isDropdownOpen" 
      @click="isDropdownOpen = false" 
      class="fixed inset-0 z-10"
    ></div>

    <div class="flex items-center gap-4 z-10">
      <button 
        @click="emit('toggle-sidebar')"
        class="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      
      <div class="relative hidden sm:block">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input 
          type="text" 
          placeholder="Search leads, accounts..." 
          class="pl-10 pr-4 py-2 w-64 bg-slate-100/50 border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
        />
      </div>
    </div>
    
    <div class="flex items-center gap-3 z-20">
      <!-- Notification Dropdown Container -->
      <div class="relative">
        <button 
          @click="toggleDropdown"
          class="p-2 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-colors relative"
        >
          <span 
            v-if="unreadCount > 0"
            class="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse"
          >
            {{ unreadCount }}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        <!-- Dropdown Card -->
        <div 
          v-if="isDropdownOpen"
          class="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-2.5 max-h-[380px] flex flex-col"
        >
          <div class="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800">Notifications</span>
            <button 
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="text-[10px] text-blue-600 hover:text-blue-500 font-bold"
            >
              Mark all as read
            </button>
          </div>

          <div class="flex-1 overflow-y-auto divide-y divide-slate-100">
            <div 
              v-if="notifications.length === 0" 
              class="text-center py-8 text-slate-400 text-xs"
            >
              No new notifications.
            </div>
            
            <div 
              v-for="item in notifications" 
              :key="item.id"
              @click="markAsRead(item.id)"
              class="p-3.5 hover:bg-slate-50 cursor-pointer transition-all duration-150 relative"
              :class="!item.is_read ? 'bg-blue-50/10' : 'opacity-70'"
            >
              <!-- Unread indicator dot -->
              <span 
                v-if="!item.is_read"
                class="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600"
              ></span>
              
              <h4 class="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-snug">
                <span 
                  class="w-1.5 h-1.5 rounded-full"
                  :class="[
                    item.type === 'order_approved' ? 'bg-emerald-500' :
                    item.type === 'order_cancelled' ? 'bg-rose-500' : 'bg-blue-500'
                  ]"
                ></span>
                {{ item.title }}
              </h4>
              <p class="text-[10px] text-slate-500 mt-1 pr-6 leading-relaxed">{{ item.message }}</p>
              <span class="text-[8px] text-slate-400 font-semibold block mt-1.5">{{ formatTime(item.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <button class="p-2 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </header>
</template>
