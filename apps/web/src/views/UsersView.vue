<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usersService, UserData } from '../services/users'

const authStore = useAuthStore()

// State
const users = ref<UserData[]>([])
const totalUsers = ref(0)
const page = ref(1)
const limit = ref(8)
const search = ref('')
const selectedRole = ref('')
const isLoading = ref(false)

// Modals State
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const formError = ref('')
const formSubmitting = ref(false)

// Form State
const userForm = ref({
  id: '',
  name: '',
  email: '',
  passwordPlain: '',
  role: 'sales_rep' as 'sales_rep' | 'sales_manager' | 'admin' | 'executive',
})

// Permissions
const canManageUsers = computed(() => {
  return authStore.userRole === 'admin' || authStore.userRole === 'sales_manager'
})

const canDeleteUsers = computed(() => {
  return authStore.userRole === 'admin'
})

// Fetch Users
const fetchUsers = async () => {
  isLoading.value = true
  try {
    const roleFilter = selectedRole.value || undefined
    const result = await usersService.getUsers(page.value, limit.value, search.value, roleFilter)
    users.value = result.data
    totalUsers.value = result.total
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchUsers()
}

const handleRoleFilter = () => {
  page.value = 1
  fetchUsers()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  fetchUsers()
}

// Open Modal
const openModal = (mode: 'create' | 'edit', user?: UserData) => {
  modalMode.value = mode
  formError.value = ''
  
  if (mode === 'edit' && user) {
    userForm.value = {
      id: user.id || '',
      name: user.name,
      email: user.email,
      passwordPlain: '', // Blank by default, only set if changing
      role: user.role,
    }
  } else {
    userForm.value = {
      id: '',
      name: '',
      email: '',
      passwordPlain: '',
      role: 'sales_rep',
    }
  }
  isModalOpen.value = true
}

// Submit Form
const submitForm = async () => {
  if (!userForm.value.name || !userForm.value.email) {
    formError.value = 'Name and email are required'
    return
  }

  if (modalMode.value === 'create' && !userForm.value.passwordPlain) {
    formError.value = 'Password is required'
    return
  }

  if (userForm.value.passwordPlain && userForm.value.passwordPlain.length < 6) {
    formError.value = 'Password must be at least 6 characters'
    return
  }

  formError.value = ''
  formSubmitting.value = true

  try {
    const payload: any = {
      name: userForm.value.name,
      email: userForm.value.email,
      role: userForm.value.role,
    }

    if (userForm.value.passwordPlain) {
      payload.passwordPlain = userForm.value.passwordPlain
    }

    if (modalMode.value === 'create') {
      await usersService.createUser(payload)
    } else {
      await usersService.updateUser(userForm.value.id, payload)
    }

    isModalOpen.value = false
    fetchUsers()
  } catch (err: any) {
    formError.value = err.message || 'Operation failed. Please verify inputs.'
  } finally {
    formSubmitting.value = false
  }
}

// Delete User
const deleteUser = async (id: string, name: string) => {
  if (id === authStore.user?.id) {
    alert('You cannot delete your own account.')
    return
  }

  if (!confirm(`Are you sure you want to delete user ${name}? This action is irreversible.`)) {
    return
  }

  try {
    await usersService.deleteUser(id)
    fetchUsers()
  } catch (error) {
    alert('Delete failed. You might not have the correct permissions.')
  }
}

// Format Role Badges
const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
    case 'sales_manager':
      return 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/10'
    case 'sales_rep':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10'
    case 'executive':
      return 'bg-slate-50 text-slate-700 ring-1 ring-slate-600/10'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const formatRoleName = (role: string) => {
  return role.replace('_', ' ').toUpperCase()
}

onMounted(() => {
  if (canManageUsers.value) {
    fetchUsers()
  }
})
</script>

<template>
  <div v-if="!canManageUsers" class="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-slate-300">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
    <h2 class="text-xl font-bold text-slate-800">Access Denied</h2>
    <p class="text-slate-500 max-w-sm text-sm">You do not have the required permissions to view or manage user accounts.</p>
  </div>

  <div v-else class="space-y-6 font-sans">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
        <p class="text-sm text-slate-500 mt-1">Manage staff roles, login credentials, and account activation.</p>
      </div>
      <button 
        @click="openModal('create')"
        class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add User
      </button>
    </div>

    <!-- Filters Toolbar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
      <!-- Search Input -->
      <div class="relative flex-1 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input 
          v-model="search"
          @input="handleSearch"
          type="text" 
          placeholder="Search by name, email..." 
          class="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2 pl-10 pr-4 text-sm transition-all duration-200 outline-none placeholder-slate-400"
        />
      </div>

      <!-- Role Filter Dropdown -->
      <div class="w-full md:w-48">
        <select 
          v-model="selectedRole"
          @change="handleRoleFilter"
          class="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl py-2 px-3.5 text-sm transition-all outline-none text-slate-600"
        >
          <option value="">All Roles</option>
          <option value="admin">Administrator</option>
          <option value="sales_manager">Sales Manager</option>
          <option value="sales_rep">Sales Representative</option>
          <option value="executive">Executive</option>
        </select>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-slate-500 bg-slate-50/50 border-b border-slate-100 uppercase">
            <tr>
              <th class="px-6 py-4 font-semibold">User details</th>
              <th class="px-6 py-4 font-semibold">Email Address</th>
              <th class="px-6 py-4 font-semibold">Role</th>
              <th class="px-6 py-4 font-semibold">Created date</th>
              <th class="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="isLoading">
              <td colspan="5" class="text-center py-8 text-slate-500">
                <span class="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="5" class="text-center py-12 text-slate-500">
                No users found matching current filters.
              </td>
            </tr>
            <tr 
              v-else
              v-for="user in users" 
              :key="user.id" 
              class="hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase text-xs">
                  {{ user.name.slice(0, 2) }}
                </div>
                <span>{{ user.name }}</span>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ user.email }}</td>
              <td class="px-6 py-4">
                <span 
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full"
                  :class="getRoleBadgeClass(user.role)"
                >
                  {{ formatRoleName(user.role) }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500">
                {{ user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—' }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="openModal('edit', user)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit User"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.013a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button 
                    v-if="canDeleteUsers && user.id !== authStore.user?.id"
                    @click="deleteUser(user.id!, user.name)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete User"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
        <span>Showing {{ users.length }} of {{ totalUsers }} users</span>
        <div class="flex items-center gap-2">
          <button 
            :disabled="page === 1"
            @click="handlePageChange(page - 1)"
            class="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Previous
          </button>
          <span class="font-medium text-slate-900">Page {{ page }} of {{ Math.ceil(totalUsers / limit) || 1 }}</span>
          <button 
            :disabled="page >= Math.ceil(totalUsers / limit)"
            @click="handlePageChange(page + 1)"
            class="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- modal: ADD/EDIT USER -->
    <div 
      v-if="isModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
    >
      <div class="bg-white rounded-3xl w-full max-w-lg p-8 border border-slate-100 shadow-2xl space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900">{{ modalMode === 'create' ? 'Add Staff User' : 'Edit User Profile' }}</h2>
          <p class="text-sm text-slate-500 mt-1">Configure account profile details and authentication roles.</p>
        </div>

        <div v-if="formError" class="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {{ formError }}
        </div>

        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
            <input 
              v-model="userForm.name"
              type="text" 
              required
              placeholder="e.g. John Doe"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
            <input 
              v-model="userForm.email"
              type="email" 
              required
              placeholder="e.g. john@sfa.com"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Password <span v-if="modalMode === 'edit'" class="text-slate-400 capitalize normal-case font-normal">(Leave blank to keep current)</span>
            </label>
            <input 
              v-model="userForm.passwordPlain"
              type="password" 
              :required="modalMode === 'create'"
              placeholder="••••••••"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Role</label>
            <select 
              v-model="userForm.role"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl py-2.5 px-4 text-sm transition-all outline-none text-slate-600"
            >
              <option value="sales_rep">Sales Representative</option>
              <option value="sales_manager">Sales Manager</option>
              <option value="admin">System Administrator</option>
              <option value="executive">Executive Management</option>
            </select>
          </div>

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
              :disabled="formSubmitting"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <span v-if="formSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Save User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
