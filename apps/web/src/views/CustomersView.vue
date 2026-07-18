<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { accountsService, AccountData, ContactData } from '../services/accounts'

const authStore = useAuthStore()

// State
const accounts = ref<AccountData[]>([])
const totalAccounts = ref(0)
const page = ref(1)
const limit = ref(8)
const search = ref('')
const isLoading = ref(false)

// Active Detail Pane / Modal State
const selectedAccount = ref<(AccountData & { contacts: ContactData[] }) | null>(null)
const isAccountModalOpen = ref(false)
const isContactModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')

// Form States
const accountForm = ref({
  id: '',
  company_name: '',
  industry: '',
  website: '',
  address: '',
})

const contactForm = ref({
  id: '',
  account_id: '',
  name: '',
  email: '',
  phone: '',
  position: '',
})

const formError = ref('')
const formSubmitting = ref(false)

// Roles helpers
const canDelete = computed(() => {
  return authStore.userRole === 'admin' || authStore.userRole === 'sales_manager'
})

// Fetch Data
const fetchAccounts = async () => {
  isLoading.value = true
  try {
    const result = await accountsService.getAccounts(page.value, limit.value, search.value)
    accounts.value = result.data
    totalAccounts.value = result.total
  } catch (error: any) {
    console.error('Failed to fetch accounts:', error)
  } finally {
    isLoading.value = false
  }
}

// Search debounce / instant search
const handleSearch = () => {
  page.value = 1
  fetchAccounts()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  fetchAccounts()
}

// Open Account Modal
const openAccountModal = (mode: 'create' | 'edit', account?: AccountData) => {
  modalMode.value = mode
  formError.value = ''
  
  if (mode === 'edit' && account) {
    accountForm.value = {
      id: account.id || '',
      company_name: account.company_name,
      industry: account.industry || '',
      website: account.website || '',
      address: account.address || '',
    }
  } else {
    accountForm.value = {
      id: '',
      company_name: '',
      industry: '',
      website: '',
      address: '',
    }
  }
  isAccountModalOpen.value = true
}

// Submit Account Form
const submitAccount = async () => {
  if (!accountForm.value.company_name) {
    formError.value = 'Company name is required'
    return
  }

  formError.value = ''
  formSubmitting.value = true

  try {
    const payload = {
      company_name: accountForm.value.company_name,
      industry: accountForm.value.industry || null,
      website: accountForm.value.website || null,
      address: accountForm.value.address || null,
    }

    if (modalMode.value === 'create') {
      await accountsService.createAccount(payload)
    } else {
      await accountsService.updateAccount(accountForm.value.id, payload)
    }

    isAccountModalOpen.value = false
    fetchAccounts()
    if (selectedAccount.value && selectedAccount.value.id === accountForm.value.id) {
      viewDetails(accountForm.value.id)
    }
  } catch (err: any) {
    formError.value = err.message || 'Operation failed. Please verify inputs.'
  } finally {
    formSubmitting.value = false
  }
}

// Delete Account
const deleteAccount = async (id: string) => {
  if (!confirm('Are you sure you want to delete this customer? This will also remove associated opportunities.')) {
    return
  }

  try {
    await accountsService.deleteAccount(id)
    if (selectedAccount.value?.id === id) {
      selectedAccount.value = null
    }
    fetchAccounts()
  } catch (error) {
    alert('Delete failed. You might not have the correct permissions.')
  }
}

// View Details Pane
const viewDetails = async (id: string) => {
  try {
    const details = await accountsService.getAccountById(id)
    selectedAccount.value = details
  } catch (error) {
    console.error('Failed to load account details:', error)
  }
}

// Contact Management
const openContactModal = (mode: 'create' | 'edit', contact?: ContactData) => {
  if (!selectedAccount.value) return
  modalMode.value = mode
  formError.value = ''

  if (mode === 'edit' && contact) {
    contactForm.value = {
      id: contact.id || '',
      account_id: contact.account_id,
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
    }
  } else {
    contactForm.value = {
      id: '',
      account_id: selectedAccount.value.id!,
      name: '',
      email: '',
      phone: '',
      position: '',
    }
  }
  isContactModalOpen.value = true
}

const submitContact = async () => {
  if (!contactForm.value.name) {
    formError.value = 'Contact name is required'
    return
  }

  formError.value = ''
  formSubmitting.value = true

  try {
    const payload = {
      account_id: contactForm.value.account_id,
      name: contactForm.value.name,
      email: contactForm.value.email || null,
      phone: contactForm.value.phone || null,
      position: contactForm.value.position || null,
    }

    if (modalMode.value === 'create') {
      await accountsService.createContact(payload)
    } else {
      await accountsService.updateContact(contactForm.value.id, payload)
    }

    isContactModalOpen.value = false
    if (selectedAccount.value) {
      viewDetails(selectedAccount.value.id!)
    }
  } catch (err: any) {
    formError.value = err.message || 'Operation failed.'
  } finally {
    formSubmitting.value = false
  }
}

const deleteContact = async (contactId: string) => {
  if (!confirm('Are you sure you want to delete this contact?')) return
  try {
    await accountsService.deleteContact(contactId)
    if (selectedAccount.value) {
      viewDetails(selectedAccount.value.id!)
    }
  } catch (error) {
    alert('Failed to delete contact.')
  }
}

onMounted(() => {
  fetchAccounts()
})
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Customers (Accounts)</h1>
        <p class="text-sm text-slate-500 mt-1">Manage accounts, client directories, and PIC contacts.</p>
      </div>
      <button 
        @click="openAccountModal('create')"
        class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Customer
      </button>
    </div>

    <!-- Layout Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Main Accounts List (Left/Center) -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Search and Page Size Control -->
        <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
          <div class="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input 
              v-model="search"
              @input="handleSearch"
              type="text" 
              placeholder="Search by company name, industry, address..." 
              class="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2 pl-10 pr-4 text-sm transition-all duration-200 outline-none placeholder-slate-400"
            />
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-slate-500 bg-slate-50/50 border-b border-slate-100 uppercase">
                <tr>
                  <th class="px-6 py-4 font-semibold">Company Name</th>
                  <th class="px-6 py-4 font-semibold">Industry</th>
                  <th class="px-6 py-4 font-semibold">Website</th>
                  <th class="px-6 py-4 font-semibold text-center">Summary</th>
                  <th class="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="isLoading">
                  <td colspan="5" class="text-center py-8 text-slate-500">
                    <span class="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
                  </td>
                </tr>
                <tr v-else-if="accounts.length === 0">
                  <td colspan="5" class="text-center py-12 text-slate-500">
                    No customers found. Create a new account to get started.
                  </td>
                </tr>
                <tr 
                  v-else
                  v-for="account in accounts" 
                  :key="account.id" 
                  @click="viewDetails(account.id!)"
                  class="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  :class="{ 'bg-blue-50/30 font-medium': selectedAccount?.id === account.id }"
                >
                  <td class="px-6 py-4 font-medium text-slate-900">{{ account.company_name }}</td>
                  <td class="px-6 py-4 text-slate-600">{{ account.industry || '—' }}</td>
                  <td class="px-6 py-4">
                    <a 
                      v-if="account.website"
                      :href="account.website.startsWith('http') ? account.website : 'https://' + account.website" 
                      target="_blank" 
                      @click.stop
                      class="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>{{ account.website }}</span>
                    </a>
                    <span v-else class="text-slate-400">—</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="inline-flex gap-2 text-xs font-semibold">
                      <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{{ account._count?.contacts || 0 }} Contacts</span>
                      <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{{ account._count?.opportunities || 0 }} Opps</span>
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right" @click.stop>
                    <div class="flex items-center justify-end gap-2">
                      <button 
                        @click="openAccountModal('edit', account)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Account"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.013a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button 
                        v-if="canDelete"
                        @click="deleteAccount(account.id!)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Account"
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
            <span>Showing {{ accounts.length }} of {{ totalAccounts }} customers</span>
            <div class="flex items-center gap-2">
              <button 
                :disabled="page === 1"
                @click="handlePageChange(page - 1)"
                class="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Previous
              </button>
              <span class="font-medium text-slate-900">Page {{ page }} of {{ Math.ceil(totalAccounts / limit) || 1 }}</span>
              <button 
                :disabled="page >= Math.ceil(totalAccounts / limit)"
                @click="handlePageChange(page + 1)"
                class="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail Card / Contact Panel (Right Sidebar) -->
      <div class="space-y-6">
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 sticky top-24">
          <div v-if="!selectedAccount" class="text-center py-12 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="w-12 h-12 mx-auto text-slate-300 mb-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <p class="text-sm">Select a company from the list to view its PIC contacts and detailed information.</p>
          </div>

          <div v-else class="space-y-6">
            <!-- Account Heading -->
            <div>
              <span class="text-xs font-semibold text-blue-600 uppercase tracking-wider">{{ selectedAccount.industry || 'General Business' }}</span>
              <h2 class="text-xl font-bold text-slate-900 mt-1">{{ selectedAccount.company_name }}</h2>
              <p v-if="selectedAccount.address" class="text-sm text-slate-500 mt-2 flex items-start gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{{ selectedAccount.address }}</span>
              </p>
            </div>

            <!-- Contacts list -->
            <div class="border-t border-slate-100 pt-6 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-800 tracking-wide uppercase">Contacts (PICs)</h3>
                <button 
                  @click="openContactModal('create')"
                  class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add PIC
                </button>
              </div>

              <!-- Contact Cards List -->
              <div v-if="selectedAccount.contacts.length === 0" class="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
                No contacts listed for this company.
              </div>
              <div v-else class="space-y-3">
                <div 
                  v-for="contact in selectedAccount.contacts" 
                  :key="contact.id"
                  class="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex items-start justify-between gap-3 group/item hover:border-slate-200 transition-colors"
                >
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-900 text-sm truncate">{{ contact.name }}</p>
                    <p v-if="contact.position" class="text-xs text-slate-500 font-medium truncate">{{ contact.position }}</p>
                    
                    <div class="mt-2 space-y-1 text-xs text-slate-600">
                      <p v-if="contact.email" class="flex items-center gap-1.5 truncate">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-slate-400">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0l-7.5-4.615a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <span>{{ contact.email }}</span>
                      </p>
                      <p v-if="contact.phone" class="flex items-center gap-1.5 truncate">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-slate-400">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.445-5.127-3.75-6.57-6.57l1.293-.97c.362-.271.528-.733.417-1.173L6.763 3.51a1.25 1.25 0 00-1.091-.852H4.37c-1.243 0-2.25 1.007-2.25 2.25v2.25z" />
                        </svg>
                        <span>{{ contact.phone }}</span>
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-1">
                    <button 
                      @click="openContactModal('edit', contact)"
                      class="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="Edit Contact"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.013a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button 
                      v-if="canDelete"
                      @click="deleteContact(contact.id!)"
                      class="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Contact"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- modal: ADD/EDIT ACCOUNT -->
    <div 
      v-if="isAccountModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
    >
      <div class="bg-white rounded-3xl w-full max-w-lg p-8 border border-slate-100 shadow-2xl space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900">{{ modalMode === 'create' ? 'Add New Customer' : 'Edit Customer' }}</h2>
          <p class="text-sm text-slate-500 mt-1">Register a new client company profile.</p>
        </div>

        <div v-if="formError" class="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {{ formError }}
        </div>

        <form @submit.prevent="submitAccount" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Name</label>
            <input 
              v-model="accountForm.company_name"
              type="text" 
              required
              placeholder="e.g. Wayne Enterprises"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Industry</label>
            <input 
              v-model="accountForm.industry"
              type="text" 
              placeholder="e.g. Technology & Logistics"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Website URL</label>
            <input 
              v-model="accountForm.website"
              type="text" 
              placeholder="e.g. https://www.wayne.com"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</label>
            <textarea 
              v-model="accountForm.address"
              placeholder="e.g. 1007 Mountain Drive, Gotham City"
              rows="3"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none resize-none"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              @click="isAccountModalOpen = false"
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
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- modal: ADD/EDIT CONTACT -->
    <div 
      v-if="isContactModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
    >
      <div class="bg-white rounded-3xl w-full max-w-lg p-8 border border-slate-100 shadow-2xl space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900">{{ modalMode === 'create' ? 'Add PIC Contact' : 'Edit PIC Contact' }}</h2>
          <p class="text-sm text-slate-500 mt-1">Associate a new point of contact for {{ selectedAccount?.company_name }}.</p>
        </div>

        <div v-if="formError" class="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {{ formError }}
        </div>

        <form @submit.prevent="submitContact" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
            <input 
              v-model="contactForm.name"
              type="text" 
              required
              placeholder="e.g. Bruce Wayne"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
            <input 
              v-model="contactForm.email"
              type="email" 
              placeholder="e.g. pic@company.com"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</label>
            <input 
              v-model="contactForm.phone"
              type="text" 
              placeholder="e.g. +62812345678"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Position / Title</label>
            <input 
              v-model="contactForm.position"
              type="text" 
              placeholder="e.g. Purchasing Manager"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              @click="isContactModalOpen = false"
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
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
