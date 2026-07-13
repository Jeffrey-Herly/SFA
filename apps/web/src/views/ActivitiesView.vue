<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { activitiesService, ActivityData } from '../services/activities'
import { accountsService, AccountData } from '../services/accounts'

const authStore = useAuthStore()

// State
const activities = ref<ActivityData[]>([])
const accounts = ref<AccountData[]>([])
const totalActivities = ref(0)
const page = ref(1)
const limit = ref(10)
const selectedFilterType = ref('')
const selectedFilterTaskStatus = ref('')
const isLoading = ref(false)

// Modals
const activeLogType = ref<'visit' | 'call' | 'task' | null>(null)
const isModalOpen = ref(false)
const modalError = ref('')
const submitting = ref(false)

// Location GPS state
const gettingLocation = ref(false)
const gpsCoords = ref<{ latitude: number; longitude: number; accuracy: number } | null>(null)

// Form states
const formAccountId = ref('')
const formNotes = ref('')
const formCallDuration = ref(30)
const formCallOutcome = ref('answered')
const formTaskDueDate = ref('')

// Open log modal
const openLogModal = (type: 'visit' | 'call' | 'task') => {
  activeLogType.value = type
  modalError.value = ''
  formAccountId.value = ''
  formNotes.value = ''
  formCallDuration.value = 60
  formCallOutcome.value = 'answered'
  formTaskDueDate.value = new Date(Date.now() + 86400000).toISOString().split('T')[0] // default tomorrow
  gpsCoords.value = null
  
  if (type === 'visit') {
    retrieveGPSLocation()
  }
  
  isModalOpen.value = true
}

// Retrieve Geolocation
const retrieveGPSLocation = () => {
  if (!navigator.geolocation) {
    modalError.value = 'Geolocation is not supported by your browser.'
    return
  }

  gettingLocation.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      gpsCoords.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }
      gettingLocation.value = false
    },
    (error) => {
      console.warn('Geolocation error:', error)
      // Fallback dummy coords for developer convenience if geolocation is blocked/unsupported
      gpsCoords.value = {
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 15,
      }
      gettingLocation.value = false
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

// Submit Log
const submitActivity = async () => {
  if (!formAccountId.value) {
    modalError.value = 'Please select a customer account.'
    return
  }

  modalError.value = ''
  submitting.value = true

  try {
    let payload: any = {
      account_id: formAccountId.value,
      notes: formNotes.value,
    }

    if (activeLogType.value === 'visit') {
      if (!gpsCoords.value) {
        modalError.value = 'Awaiting valid GPS coordinates...'
        submitting.value = false
        return
      }
      payload.type = 'meeting'
      payload.meta = {
        type: 'visit',
        status: 'checked_in',
        checkin_time: new Date().toISOString(),
        latitude: gpsCoords.value.latitude,
        longitude: gpsCoords.value.longitude,
        accuracy: gpsCoords.value.accuracy,
      }
    } else if (activeLogType.value === 'call') {
      payload.type = 'call'
      payload.meta = {
        duration_seconds: formCallDuration.value,
        outcome: formCallOutcome.value,
      }
    } else if (activeLogType.value === 'task') {
      payload.type = 'note'
      payload.meta = {
        is_task: true,
        due_date: formTaskDueDate.value,
        is_completed: false,
      }
    }

    await activitiesService.createActivity(payload)
    isModalOpen.value = false
    fetchActivities()
  } catch (error: any) {
    modalError.value = error.message || 'Failed to log activity.'
  } finally {
    submitting.value = false
  }
}

// Toggle Task status
const toggleTaskCompletion = async (activity: ActivityData) => {
  if (activity.type !== 'note' || !activity.meta?.is_task) return

  const isCompleted = !activity.meta.is_completed
  try {
    await activitiesService.updateActivity(activity.id!, {
      meta: {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      },
    })
    fetchActivities()
  } catch (error) {
    alert('Failed to update task status.')
  }
}

// Checkout Visit
const handleCheckout = async (activity: ActivityData) => {
  if (activity.type !== 'meeting' || activity.meta?.status !== 'checked_in') return

  try {
    await activitiesService.updateActivity(activity.id!, {
      meta: {
        status: 'completed',
        checkout_time: new Date().toISOString(),
      },
    })
    fetchActivities()
  } catch (error) {
    alert('Failed to complete checkout.')
  }
}

// Fetch activities and accounts list
const fetchActivities = async () => {
  isLoading.value = true
  try {
    const filters: any = {}
    if (selectedFilterType.value === 'visits') {
      filters.type = 'meeting'
    } else if (selectedFilterType.value === 'calls') {
      filters.type = 'call'
    } else if (selectedFilterType.value === 'tasks') {
      filters.is_task = true
    } else if (selectedFilterType.value === 'notes') {
      filters.type = 'note'
      filters.is_task = false
    }

    if (selectedFilterTaskStatus.value === 'pending') {
      filters.is_completed = false
    } else if (selectedFilterTaskStatus.value === 'completed') {
      filters.is_completed = true
    }

    const result = await activitiesService.getActivities(page.value, limit.value, filters)
    activities.value = result.data
    totalActivities.value = result.total
  } catch (error) {
    console.error('Failed to load activities:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchAccounts = async () => {
  try {
    const result = await accountsService.getAccounts(1, 100)
    accounts.value = result.data
  } catch (error) {
    console.error('Failed to load customers catalog:', error)
  }
}

// Helpers
const getOutcomeBadgeClass = (outcome?: string) => {
  if (!outcome) return 'bg-slate-100 text-slate-600'
  switch (outcome) {
    case 'answered':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
    case 'no_answer':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10'
    case 'busy':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const formatCallOutcome = (outcome?: string) => {
  if (!outcome) return 'UNKNOWN'
  return outcome.replace('_', ' ').toUpperCase()
}

onMounted(() => {
  fetchActivities()
  fetchAccounts()
})
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Activity Logs & Tasks</h1>
        <p class="text-sm text-slate-500 mt-1">Track visit coordinates, call logs, and upcoming follow-ups.</p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-3">
        <button 
          @click="openLogModal('visit')"
          class="bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-medium px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
          </svg>
          Check-in Visit
        </button>

        <button 
          @click="openLogModal('call')"
          class="bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-medium px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.445-5.127-3.75-6.57-6.57l1.293-.97c.362-.271.528-.733.417-1.173L6.763 3.51a1.25 1.25 0 00-1.091-.852H4.37c-1.243 0-2.25 1.007-2.25 2.25v2.25z" />
          </svg>
          Log Call
        </button>

        <button 
          @click="openLogModal('task')"
          class="bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-medium px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Create Task
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
      <!-- Type tabs -->
      <div class="flex bg-slate-100 p-1 rounded-xl">
        <button 
          @click="selectedFilterType = ''; fetchActivities()"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
          :class="selectedFilterType === '' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800'"
        >
          All Activity
        </button>
        <button 
          @click="selectedFilterType = 'visits'; fetchActivities()"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
          :class="selectedFilterType === 'visits' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800'"
        >
          Visits (GPS)
        </button>
        <button 
          @click="selectedFilterType = 'calls'; fetchActivities()"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
          :class="selectedFilterType === 'calls' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800'"
        >
          Calls
        </button>
        <button 
          @click="selectedFilterType = 'tasks'; fetchActivities()"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
          :class="selectedFilterType === 'tasks' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800'"
        >
          Tasks
        </button>
      </div>

      <!-- Task specific status filter (visible only when tasks tab is active) -->
      <div v-if="selectedFilterType === 'tasks'" class="w-40">
        <select 
          v-model="selectedFilterTaskStatus"
          @change="fetchActivities"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs outline-none text-slate-600 focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>

    <!-- Timeline & Tasks layout -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div v-if="isLoading" class="text-center py-16">
        <span class="inline-block w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
      </div>

      <div v-else-if="activities.length === 0" class="text-center py-16 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="w-12 h-12 mx-auto text-slate-300 mb-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-sm">No activity logs recorded. Click quick actions to log visits, calls or tasks.</p>
      </div>

      <!-- Timeline feed -->
      <div v-else class="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-100 before:z-0">
        <div 
          v-for="item in activities" 
          :key="item.id"
          class="relative z-10 flex items-start gap-4"
        >
          <!-- Timeline icon -->
          <div 
            class="w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm flex-shrink-0"
            :class="[
              item.type === 'meeting' ? 'bg-blue-50 text-blue-600' :
              item.type === 'call' ? 'bg-emerald-50 text-emerald-600' :
              item.meta?.is_task ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-600'
            ]"
          >
            <!-- Icon type -->
            <svg v-if="item.type === 'meeting'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" /></svg>
            <svg v-else-if="item.type === 'call'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.445-5.127-3.75-6.57-6.57l1.293-.97c.362-.271.528-.733.417-1.173L6.763 3.51a1.25 1.25 0 00-1.091-.852H4.37c-1.243 0-2.25 1.007-2.25 2.25v2.25z" /></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>

          <!-- Activity Details Card -->
          <div class="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl p-5 flex-1 min-w-0 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div class="space-y-2 min-w-0">
              <!-- Header info -->
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="font-bold text-slate-800">{{ item.user?.name }}</span>
                <span class="text-slate-400">•</span>
                <span class="text-slate-500 font-medium">Logged activity for</span>
                <span class="font-semibold text-blue-600 truncate">{{ item.account?.company_name || 'Prospect Client' }}</span>
                <span class="text-slate-400">•</span>
                <span class="text-slate-500">{{ item.created_at ? new Date(item.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '' }}</span>
              </div>

              <!-- Notes -->
              <p class="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{{ item.notes || 'No description notes.' }}</p>

              <!-- Specific Sub-metadata based on log type -->
              <!-- Call Outcome duration -->
              <div v-if="item.type === 'call'" class="flex items-center gap-3 pt-1">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Call Outcome:</span>
                <span class="px-2.5 py-0.5 text-xs font-bold rounded-full" :class="getOutcomeBadgeClass(item.meta?.outcome)">
                  {{ formatCallOutcome(item.meta?.outcome) }}
                </span>
                <span class="text-xs text-slate-500">Duration: <strong class="text-slate-700 font-semibold">{{ item.meta?.duration_seconds }}s</strong></span>
              </div>

              <!-- GPS Visit Logs -->
              <div v-if="item.type === 'meeting'" class="space-y-1.5 pt-1">
                <div class="flex flex-wrap items-center gap-3 text-xs">
                  <span class="font-semibold text-slate-500 uppercase tracking-wide">GPS Checkin:</span>
                  <a 
                    :href="item.meta?.latitude && item.meta?.longitude ? `https://www.google.com/maps/search/?api=1&query=${item.meta.latitude},${item.meta.longitude}` : '#'" 
                    target="_blank"
                    class="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span v-if="item.meta?.latitude && item.meta?.longitude">📍 {{ item.meta.latitude.toFixed(6) }}, {{ item.meta.longitude.toFixed(6) }}</span>
                    <span v-else>📍 No coordinates</span>
                  </a>
                  <span v-if="item.meta?.accuracy" class="text-slate-400">Accuracy: {{ item.meta.accuracy.toFixed(1) }}m</span>
                </div>
                <div class="text-xs flex items-center gap-3">
                  <span class="font-semibold text-slate-500 uppercase tracking-wide">Visit Status:</span>
                  <span 
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    :class="item.meta?.status === 'checked_in' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'"
                  >
                    {{ item.meta?.status === 'checked_in' ? 'Checked In' : 'Completed' }}
                  </span>
                  <span v-if="item.meta?.checkout_time" class="text-slate-500">
                    Checked out: <strong class="text-slate-700 font-semibold">{{ new Date(item.meta.checkout_time).toLocaleTimeString('en-US', { timeStyle: 'short' }) }}</strong>
                  </span>
                </div>
              </div>

              <!-- Tasks list -->
              <div v-if="item.meta?.is_task" class="flex flex-wrap items-center gap-4 pt-1">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Task Due:</span>
                  <span 
                    class="text-xs font-bold px-2 py-0.5 rounded-lg"
                    :class="[
                      item.meta.is_completed ? 'bg-emerald-50 text-emerald-700' :
                      new Date(item.meta.due_date) < new Date() ? 'bg-rose-50 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-700'
                    ]"
                  >
                    {{ new Date(item.meta.due_date).toLocaleDateString('en-US', { dateStyle: 'medium' }) }}
                  </span>
                </div>
                <div v-if="item.meta.is_completed && item.meta.completed_at" class="text-xs text-slate-400">
                  Completed on: {{ new Date(item.meta.completed_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) }}
                </div>
              </div>
            </div>

            <!-- Action column (e.g. check-out / complete task checkboxes) -->
            <div class="flex-shrink-0 flex items-center justify-end sm:pt-0 pt-2 border-t border-slate-100 sm:border-0">
              <!-- Checkout Visit Button -->
              <button 
                v-if="item.type === 'meeting' && item.meta?.status === 'checked_in'"
                @click="handleCheckout(item)"
                class="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 transition-colors flex items-center gap-1"
              >
                <span>Check Out</span>
              </button>

              <!-- Task Checkbox Toggle -->
              <label 
                v-if="item.meta?.is_task"
                class="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                <input 
                  type="checkbox" 
                  :checked="item.meta.is_completed"
                  @change="toggleTaskCompletion(item)"
                  class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500/20"
                />
                <span>{{ item.meta.is_completed ? 'Completed' : 'Mark Complete' }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="activities.length > 0" class="px-2 py-4 mt-6 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
        <span>Showing {{ activities.length }} of {{ totalActivities }} logs</span>
        <div class="flex items-center gap-2">
          <button 
            :disabled="page === 1"
            @click="handlePageChange(page - 1)"
            class="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Previous
          </button>
          <span class="font-medium text-slate-900">Page {{ page }} of {{ Math.ceil(totalActivities / limit) || 1 }}</span>
          <button 
            :disabled="page >= Math.ceil(totalActivities / limit)"
            @click="handlePageChange(page + 1)"
            class="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Layout -->
    <div 
      v-if="isModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
    >
      <div class="bg-white rounded-3xl w-full max-w-lg p-8 border border-slate-100 shadow-2xl space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900">
            {{ activeLogType === 'visit' ? 'Customer Visit Check-in' : activeLogType === 'call' ? 'Log Call Report' : 'Create Follow-up Task' }}
          </h2>
          <p class="text-sm text-slate-500 mt-1">
            {{ activeLogType === 'visit' ? 'Secure checkin using simulated GPS coordinates.' : activeLogType === 'call' ? 'Log call duration and outcome outcomes.' : 'Schedule task with specific follow-up limits.' }}
          </p>
        </div>

        <!-- Location retrieval spinner for visits -->
        <div 
          v-if="activeLogType === 'visit' && gettingLocation" 
          class="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-3 text-sm text-slate-500 font-medium"
        >
          <span class="inline-block w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
          <span>Acquiring GPS location coordinate fixes...</span>
        </div>

        <!-- Coordinates confirmation card -->
        <div 
          v-else-if="activeLogType === 'visit' && gpsCoords" 
          class="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs space-y-1"
        >
          <p class="font-bold text-blue-700">📍 Location fix acquired</p>
          <p class="text-slate-600">Latitude: {{ gpsCoords.latitude.toFixed(6) }} | Longitude: {{ gpsCoords.longitude.toFixed(6) }}</p>
          <p class="text-slate-500">Accuracy radius: {{ gpsCoords.accuracy.toFixed(1) }} meters</p>
        </div>

        <div v-if="modalError" class="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {{ modalError }}
        </div>

        <form @submit.prevent="submitActivity" class="space-y-4">
          <!-- Select Customer Account -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Customer</label>
            <select 
              v-model="formAccountId"
              required
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl py-2.5 px-4 text-sm transition-all outline-none text-slate-600"
            >
              <option value="" disabled>-- Select Company --</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                {{ acc.company_name }}
              </option>
            </select>
          </div>

          <!-- Call Specific fields -->
          <div v-if="activeLogType === 'call'" class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outcome</label>
              <select 
                v-model="formCallOutcome"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none text-slate-600"
              >
                <option value="answered">Answered</option>
                <option value="no_answer">No Answer</option>
                <option value="busy">Line Busy</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration (seconds)</label>
              <input 
                v-model="formCallDuration"
                type="number" 
                required
                min="0"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none text-slate-600"
              />
            </div>
          </div>

          <!-- Task specific due date -->
          <div v-if="activeLogType === 'task'" class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</label>
            <input 
              v-model="formTaskDueDate"
              type="date" 
              required
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none text-slate-600"
            />
          </div>

          <!-- Activity Description/Notes -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes / Summary</label>
            <textarea 
              v-model="formNotes"
              placeholder="e.g. Discussed proposal details, scheduled followup call..."
              rows="3"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none resize-none"
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              @click="isModalOpen = false"
              class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="submitting || (activeLogType === 'visit' && gettingLocation)"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <span v-if="submitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Log Activity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
