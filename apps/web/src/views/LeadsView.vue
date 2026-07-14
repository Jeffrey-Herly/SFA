<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { leadsService, LeadData } from '../services/leads'
import { usersService, UserData } from '../services/users'
import { accountsService, AccountData } from '../services/accounts'
import { opportunitiesService } from '../services/opportunities'

const authStore = useAuthStore()

// State
const leads = ref<LeadData[]>([])
const staffList = ref<UserData[]>([])
const accountsList = ref<AccountData[]>([])
const totalLeads = ref(0)
const page = ref(1)
const limit = ref(8)
const search = ref('')
const selectedStatus = ref('')
const selectedSource = ref('')
const isLoading = ref(false)

// Modals state
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalError = ref('')
const submitting = ref(false)

// Lead Form state
const leadForm = ref({
  id: '',
  name: '',
  email: '',
  phone: '',
  interest: '',
  status: 'new' as 'new' | 'contacted' | 'qualified' | 'converted' | 'dead',
  source: 'manual' as 'web_form' | 'manual' | 'referral' | 'import',
  assigned_to: '',
  notes: '',
})

// Conversion Modal state
const isConvertModalOpen = ref(false)
const convertLeadId = ref('')
const convertLeadName = ref('')
const convertForm = ref({
  title: '',
  account_id: '',
  amount: 1000000,
  probability: 10,
  expected_close: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], // 30 days default
})

// Permissions
const canAssignLeads = computed(() => {
  return authStore.userRole === 'admin' || authStore.userRole === 'sales_manager'
})

const canDeleteLeads = computed(() => {
  return authStore.userRole === 'admin' || authStore.userRole === 'sales_manager'
})

// Fetch leads
const fetchLeads = async () => {
  isLoading.value = true
  try {
    const filters = {
      status: selectedStatus.value || undefined,
      source: selectedSource.value || undefined,
      search: search.value || undefined,
    }
    const result = await leadsService.getLeads(page.value, limit.value, filters)
    leads.value = result.data
    totalLeads.value = result.total
  } catch (error) {
    console.error('Failed to load leads:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch staff (assignees) list
const fetchStaff = async () => {
  if (!canAssignLeads.value) return
  try {
    const result = await usersService.getUsers(1, 100)
    staffList.value = result.data
  } catch (error) {
    console.error('Failed to load staff list:', error)
  }
}

// Fetch customers list
const fetchAccounts = async () => {
  try {
    const result = await accountsService.getAccounts(1, 100)
    accountsList.value = result.data
  } catch (error) {
    console.error('Failed to load accounts list:', error)
  }
}

const handleSearch = () => {
  page.value = 1
  fetchLeads()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  fetchLeads()
}

// Open modals
const openModal = (mode: 'create' | 'edit', lead?: LeadData) => {
  modalMode.value = mode
  modalError.value = ''
  
  if (mode === 'edit' && lead) {
    leadForm.value = {
      id: lead.id || '',
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      interest: lead.interest || '',
      status: lead.status,
      source: lead.source,
      assigned_to: lead.assigned_to,
      notes: lead.notes || '',
    }
  } else {
    leadForm.value = {
      id: '',
      name: '',
      email: '',
      phone: '',
      interest: '',
      status: 'new',
      source: 'manual',
      assigned_to: authStore.user?.id || '',
      notes: '',
    }
  }
  isModalOpen.value = true
}

const submitForm = async () => {
  if (!leadForm.value.name) {
    modalError.value = 'Lead name is required.'
    return
  }

  modalError.value = ''
  submitting.value = true

  try {
    const payload: any = {
      name: leadForm.value.name,
      email: leadForm.value.email || null,
      phone: leadForm.value.phone || null,
      interest: leadForm.value.interest || null,
      status: leadForm.value.status,
      source: leadForm.value.source,
      assigned_to: leadForm.value.assigned_to,
      notes: leadForm.value.notes || null,
    }

    if (modalMode.value === 'create') {
      await leadsService.createLead(payload)
    } else {
      await leadsService.updateLead(leadForm.value.id, payload)
    }

    isModalOpen.value = false
    fetchLeads()
  } catch (err: any) {
    modalError.value = err.message || 'Operation failed. Verify lead info.'
  } finally {
    submitting.value = false
  }
}

// Open conversion popup
const openConvertModal = (lead: LeadData) => {
  convertLeadId.value = lead.id || ''
  convertLeadName.value = lead.name
  convertForm.value = {
    title: `Deal with ${lead.name}`,
    account_id: '',
    amount: 5000000,
    probability: 20,
    expected_close: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
  }
  modalError.value = ''
  isConvertModalOpen.value = true
}

const submitConversion = async () => {
  if (!convertForm.value.account_id) {
    modalError.value = 'Please select a Customer Account.'
    return
  }

  modalError.value = ''
  submitting.value = true

  try {
    // 1. Create opportunity linked to Lead & Account
    await opportunitiesService.createOpportunity({
      title: convertForm.value.title,
      lead_id: convertLeadId.value,
      account_id: convertForm.value.account_id,
      stage: 'prospecting',
      amount: convertForm.value.amount,
      probability: convertForm.value.probability,
      expected_close: convertForm.value.expected_close,
    })

    // 2. Mark lead status as Converted
    await leadsService.updateLead(convertLeadId.value, { status: 'converted' })

    isConvertModalOpen.value = false
    fetchLeads()
    alert('Lead successfully converted to Opportunity deal! Check the Opportunities board.')
  } catch (err: any) {
    modalError.value = err.message || 'Conversion failed.'
  } finally {
    submitting.value = false
  }
}

const deleteLead = async (id: string, name: string) => {
  if (!confirm(`Are you sure you want to delete lead: ${name}?`)) return
  try {
    await leadsService.deleteLead(id)
    fetchLeads()
  } catch (error) {
    alert('Failed to delete lead.')
  }
}

// Helpers
const getStatusClass = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10'
    case 'contacted':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10'
    case 'qualified':
      return 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/10'
    case 'converted':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
    case 'dead':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const getSourceClass = (source: string) => {
  switch (source) {
    case 'web_form':
      return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10'
    case 'manual':
      return 'bg-slate-50 text-slate-700 ring-1 ring-slate-600/10'
    case 'referral':
      return 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/10'
    case 'import':
      return 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/10'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const formatValue = (str: string) => {
  return str.replace('_', ' ').toUpperCase()
}

onMounted(() => {
  fetchLeads()
  fetchStaff()
  fetchAccounts()
})
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Leads Directory</h1>
        <p class="text-sm text-slate-500 mt-1">Manage incoming prospects, conversion pipelines, and sales assignments.</p>
      </div>
      <button 
        @click="openModal('create')"
        class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Prospect Lead
      </button>
    </div>

    <!-- Toolbar Filters -->
    <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
      <!-- Search -->
      <div class="relative flex-1 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input 
          v-model="search"
          @input="handleSearch"
          type="text" 
          placeholder="Search leads by name, email, phone..." 
          class="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 pl-10 pr-4 text-sm transition-all duration-200 outline-none placeholder-slate-400"
        />
      </div>

      <!-- Status Filter -->
      <div class="w-full md:w-44 animate-none">
        <select 
          v-model="selectedStatus"
          @change="handleSearch"
          class="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-sm transition-all outline-none text-slate-600"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="dead">Dead</option>
        </select>
      </div>

      <!-- Source Filter -->
      <div class="w-full md:w-44">
        <select 
          v-model="selectedSource"
          @change="handleSearch"
          class="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-sm transition-all outline-none text-slate-600"
        >
          <option value="">All Sources</option>
          <option value="web_form">Web Form</option>
          <option value="manual">Manual Entry</option>
          <option value="referral">Referral</option>
          <option value="import">Data Import</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-slate-500 bg-slate-50/50 border-b border-slate-100 uppercase">
            <tr>
              <th class="px-6 py-4 font-semibold">Lead Details</th>
              <th class="px-6 py-4 font-semibold">Contacts</th>
              <th class="px-6 py-4 font-semibold">Interests</th>
              <th class="px-6 py-4 font-semibold">Source</th>
              <th class="px-6 py-4 font-semibold">Status</th>
              <th class="px-6 py-4 font-semibold">Assignee</th>
              <th class="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="isLoading">
              <td colspan="7" class="text-center py-8 text-slate-500">
                <span class="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
              </td>
            </tr>
            <tr v-else-if="leads.length === 0">
              <td colspan="7" class="text-center py-12 text-slate-500">
                No prospects found matching current filters.
              </td>
            </tr>
            <tr 
              v-else
              v-for="lead in leads" 
              :key="lead.id" 
              class="hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="font-bold text-slate-900">{{ lead.name }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Created {{ lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—' }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-slate-700 font-medium">{{ lead.email || '—' }}</div>
                <div class="text-slate-500 text-xs mt-0.5">{{ lead.phone || '—' }}</div>
              </td>
              <td class="px-6 py-4 text-slate-600 truncate max-w-[150px]">{{ lead.interest || '—' }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full" :class="getSourceClass(lead.source)">
                  {{ formatValue(lead.source) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full" :class="getStatusClass(lead.status)">
                  {{ formatValue(lead.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-600 font-medium">{{ lead.assignee?.name || 'Unassigned' }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <!-- Quick convert to opportunity -->
                  <button 
                    v-if="lead.status !== 'converted'"
                    @click="openConvertModal(lead)"
                    class="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-0.5"
                    title="Convert to Deal"
                  >
                    <span>Convert</span>
                  </button>
                  <button 
                    @click="openModal('edit', lead)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit Lead"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.83 20.013a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button 
                    v-if="canDeleteLeads"
                    @click="deleteLead(lead.id!, lead.name)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Lead"
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

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
        <span>Showing {{ leads.length }} of {{ totalLeads }} leads</span>
        <div class="flex items-center gap-2">
          <button 
            :disabled="page === 1"
            @click="handlePageChange(page - 1)"
            class="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Previous
          </button>
          <span class="font-medium text-slate-900">Page {{ page }} of {{ Math.ceil(totalLeads / limit) || 1 }}</span>
          <button 
            :disabled="page >= Math.ceil(totalLeads / limit)"
            @click="handlePageChange(page + 1)"
            class="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Lead Add/Edit Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl w-full max-w-lg p-8 border border-slate-100 shadow-2xl space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900">{{ modalMode === 'create' ? 'Create Lead Prospect' : 'Edit Lead Details' }}</h2>
          <p class="text-sm text-slate-500 mt-1">Configure interest tags and assign salesperson reps.</p>
        </div>

        <div v-if="modalError" class="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {{ modalError }}
        </div>

        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prospect Full Name</label>
            <input 
              v-model="leadForm.name"
              type="text" 
              required
              placeholder="e.g. Tony Stark"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input 
                v-model="leadForm.email"
                type="email" 
                placeholder="tony@stark.com"
                class="w-full bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-100 rounded-xl py-2 px-3 text-sm transition-all outline-none"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
              <input 
                v-model="leadForm.phone"
                type="text" 
                placeholder="081234567"
                class="w-full bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-100 rounded-xl py-2 px-3 text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interests / Interest Tags</label>
            <input 
              v-model="leadForm.interest"
              type="text" 
              placeholder="e.g. Iron Suit, Clean Energy Project"
              class="w-full bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 px-4 text-sm transition-all outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Source</label>
              <select v-model="leadForm.source" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none text-slate-600">
                <option value="manual">Manual Entry</option>
                <option value="web_form">Web Form</option>
                <option value="referral">Referral</option>
                <option value="import">Data Import</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prospect Status</label>
              <select v-model="leadForm.status" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none text-slate-600">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="dead">Dead</option>
              </select>
            </div>
          </div>

          <!-- Assignment Dropdown (Visible only for admin/manager) -->
          <div class="space-y-1" v-if="canAssignLeads">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee Salesperson</label>
            <select v-model="leadForm.assigned_to" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none text-slate-600">
              <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                {{ staff.name }} ({{ formatValue(staff.role) }})
              </option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interaction Notes</label>
            <textarea 
              v-model="leadForm.notes"
              placeholder="Record any client interactions..."
              rows="3"
              class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl py-2 px-4 text-sm transition-all outline-none resize-none"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" @click="isModalOpen = false" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" :disabled="submitting" class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50">
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Conversion Modal -->
    <div v-if="isConvertModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl w-full max-w-lg p-8 border border-slate-100 shadow-2xl space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Convert Lead to Opportunity</h2>
          <p class="text-sm text-slate-500 mt-1">Convert <strong>{{ convertLeadName }}</strong> into a potential opportunity deal.</p>
        </div>

        <div v-if="modalError" class="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {{ modalError }}
        </div>

        <form @submit.prevent="submitConversion" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deal Opportunity Title</label>
            <input 
              v-model="convertForm.title"
              type="text" 
              required
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <!-- Select Account (Prisma requires account_id) -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Corporate Customer Account</label>
            <select v-model="convertForm.account_id" required class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none text-slate-600">
              <option value="" disabled>-- Select Customer Company --</option>
              <option v-for="acc in accountsList" :key="acc.id" :value="acc.id">
                {{ acc.company_name }}
              </option>
            </select>
            <p class="text-[10px] text-slate-400 mt-1">Opportunities must link to an registered customer company account database.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Amount (IDR)</label>
              <input 
                v-model="convertForm.amount"
                type="number" 
                required
                min="0"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none text-slate-600"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Probability Success (%)</label>
              <input 
                v-model="convertForm.probability"
                type="number" 
                required
                min="0"
                max="100"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none text-slate-600"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Close Date</label>
            <input 
              v-model="convertForm.expected_close"
              type="date" 
              required
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none text-slate-600"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" @click="isConvertModalOpen = false" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" :disabled="submitting" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50">
              Create Deal Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
