<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { opportunitiesService, OpportunityData } from '../services/opportunities'
import { accountsService, AccountData } from '../services/accounts'
import { leadsService, LeadData } from '../services/leads'

const authStore = useAuthStore()

// State
const opportunities = ref<OpportunityData[]>([])
const accountsList = ref<AccountData[]>([])
const leadsList = ref<LeadData[]>([])
const isLoading = ref(false)

// Stage definitions
const stages = [
  { id: 'prospecting', name: 'Prospecting', color: 'border-t-orange-500 bg-orange-50/30' },
  { id: 'qualification', name: 'Qualification', color: 'border-t-purple-500 bg-purple-50/30' },
  { id: 'proposal', name: 'Proposal', color: 'border-t-blue-500 bg-blue-50/30' },
  { id: 'negotiation', name: 'Negotiation', color: 'border-t-indigo-500 bg-indigo-50/30' },
  { id: 'closed_won', name: 'Closed Won', color: 'border-t-emerald-500 bg-emerald-50/30' },
  { id: 'closed_lost', name: 'Closed Lost', color: 'border-t-rose-500 bg-rose-50/30' },
]

// Modal & Forms
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalError = ref('')
const submitting = ref(false)

// Drag and drop tracking
const draggingOpportunityId = ref<string | null>(null)

// Loss Reason Modal
const isLossModalOpen = ref(false)
const lossOpportunityId = ref('')
const lossReasonText = ref('')

const opportunityForm = ref({
  id: '',
  title: '',
  lead_id: '',
  account_id: '',
  stage: 'prospecting' as 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost',
  amount: 0,
  probability: 10,
  expected_close: '',
  loss_reason: '',
})

// Fetch all opportunities matching access
const fetchOpportunities = async () => {
  isLoading.value = true
  try {
    const result = await opportunitiesService.getOpportunities()
    opportunities.value = result
  } catch (error) {
    console.error('Failed to load opportunities:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchDependencies = async () => {
  try {
    const [accRes, leadRes] = await Promise.all([
      accountsService.getAccounts(1, 100),
      leadsService.getLeads(1, 100),
    ])
    accountsList.value = accRes.data
    leadsList.value = leadRes.data
  } catch (error) {
    console.error('Failed to load dependencies:', error)
  }
}

// Group opportunities by stage
const getOpportunitiesByStage = (stageId: string) => {
  return opportunities.value.filter(opp => opp.stage === stageId)
}

// Calculate sum of amount per column
const getColumnTotal = (stageId: string) => {
  const sum = opportunities.value
    .filter(opp => opp.stage === stageId)
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
  
  return formatIDR(sum)
}

const formatIDR = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val)
}

// HTML5 Drag and Drop events
const handleDragStart = (opportunityId: string) => {
  draggingOpportunityId.value = opportunityId
}

const handleDragOver = (event: DragEvent) => {
  // Required to allow drop event to trigger
  event.preventDefault()
}

const handleDrop = async (stageId: string) => {
  if (!draggingOpportunityId.value) return
  const id = draggingOpportunityId.value
  draggingOpportunityId.value = null

  // Find the local opportunity
  const opp = opportunities.value.find(o => o.id === id)
  if (!opp || opp.stage === stageId) return

  // Intercept closed_lost to capture loss reason
  if (stageId === 'closed_lost') {
    lossOpportunityId.value = id
    lossReasonText.value = ''
    isLossModalOpen.value = true
    return
  }

  try {
    // Optimistic update
    const prevStage = opp.stage
    opp.stage = stageId as any

    await opportunitiesService.updateOpportunity(id, { stage: stageId as any })
    fetchOpportunities()
  } catch (error) {
    alert('Failed to update stage. Access restricted.')
    fetchOpportunities()
  }
}

const submitLossReason = async () => {
  if (!lossReasonText.value.trim()) {
    alert('Please enter a loss reason.')
    return
  }

  try {
    await opportunitiesService.updateOpportunity(lossOpportunityId.value, {
      stage: 'closed_lost',
      loss_reason: lossReasonText.value,
    })
    isLossModalOpen.value = false
    fetchOpportunities()
  } catch (error) {
    alert('Failed to update stage.')
  }
}

// Open modals
const openModal = (mode: 'create' | 'edit', opp?: OpportunityData) => {
  modalMode.value = mode
  modalError.value = ''
  
  if (mode === 'edit' && opp) {
    opportunityForm.value = {
      id: opp.id || '',
      title: opp.title,
      lead_id: opp.lead_id,
      account_id: opp.account_id,
      stage: opp.stage,
      amount: Number(opp.amount),
      probability: opp.probability,
      expected_close: opp.expected_close ? opp.expected_close.split('T')[0] : '',
      loss_reason: opp.loss_reason || '',
    }
  } else {
    opportunityForm.value = {
      id: '',
      title: '',
      lead_id: '',
      account_id: '',
      stage: 'prospecting',
      amount: 5000000,
      probability: 10,
      expected_close: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      loss_reason: '',
    }
  }
  isModalOpen.value = true
}

const submitForm = async () => {
  if (!opportunityForm.value.title || !opportunityForm.value.lead_id || !opportunityForm.value.account_id) {
    modalError.value = 'Title, lead and customer account are required.'
    return
  }

  modalError.value = ''
  submitting.value = true

  try {
    const payload: any = {
      title: opportunityForm.value.title,
      lead_id: opportunityForm.value.lead_id,
      account_id: opportunityForm.value.account_id,
      stage: opportunityForm.value.stage,
      amount: Number(opportunityForm.value.amount),
      probability: opportunityForm.value.probability,
      expected_close: opportunityForm.value.expected_close,
      loss_reason: opportunityForm.value.stage === 'closed_lost' ? opportunityForm.value.loss_reason : null,
    }

    if (modalMode.value === 'create') {
      await opportunitiesService.createOpportunity(payload)
    } else {
      await opportunitiesService.updateOpportunity(opportunityForm.value.id, payload)
    }

    isModalOpen.value = false
    fetchOpportunities()
  } catch (err: any) {
    modalError.value = err.message || 'Operation failed.'
  } finally {
    submitting.value = false
  }
}

const deleteOpportunity = async (id: string, title: string) => {
  if (!confirm(`Are you sure you want to delete opportunity deal: ${title}?`)) return
  try {
    await opportunitiesService.deleteOpportunity(id)
    isModalOpen.value = false
    fetchOpportunities()
  } catch (error) {
    alert('Failed to delete opportunity.')
  }
}

onMounted(() => {
  fetchOpportunities()
  fetchDependencies()
})
</script>

<template>
  <div class="space-y-6 font-sans select-none">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Deals Pipeline</h1>
        <p class="text-sm text-slate-500 mt-1">Manage active corporate sales contracts using visual drag-and-drop stages.</p>
      </div>
      <button 
        @click="openModal('create')"
        class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Deal Opportunity
      </button>
    </div>

    <!-- Kanban Wrapper -->
    <div v-if="isLoading" class="text-center py-24">
      <span class="inline-block w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
    </div>

    <div v-else class="flex gap-4 overflow-x-auto pb-4 items-start min-h-[70vh]">
      <!-- Kanban Columns -->
      <div 
        v-for="col in stages" 
        :key="col.id"
        @dragover="handleDragOver"
        @drop="handleDrop(col.id)"
        class="w-80 flex-shrink-0 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-col p-4 border-t-4"
        :class="col.color"
      >
        <!-- Column Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 class="font-bold text-slate-800 text-sm">{{ col.name }}</h3>
            <p class="text-[10px] text-slate-400 mt-0.5">Total: {{ getColumnTotal(col.id) }}</p>
          </div>
          <span class="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {{ getOpportunitiesByStage(col.id).length }}
          </span>
        </div>

        <!-- Cards Container -->
        <div class="space-y-3 flex-1 min-h-[50vh] overflow-y-auto">
          <div 
            v-for="opp in getOpportunitiesByStage(col.id)" 
            :key="opp.id"
            draggable="true"
            @dragstart="handleDragStart(opp.id!)"
            @click="openModal('edit', opp)"
            class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-200 cursor-grab active:cursor-grabbing transition-all duration-200 space-y-3"
          >
            <div>
              <h4 class="font-bold text-slate-800 text-xs line-clamp-1 leading-snug">{{ opp.title }}</h4>
              <p class="text-[10px] text-blue-600 font-semibold mt-0.5 truncate">{{ opp.account?.company_name }}</p>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-900">{{ formatIDR(Number(opp.amount)) }}</span>
              <span class="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                {{ opp.probability }}%
              </span>
            </div>

            <!-- Expected Close date -->
            <div class="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-slate-50">
              <span>Expected Close:</span>
              <span class="font-semibold text-slate-600">{{ new Date(opp.expected_close).toLocaleDateString('en-US', { dateStyle: 'medium' }) }}</span>
            </div>

            <!-- Loss reason display if closed lost -->
            <div v-if="opp.stage === 'closed_lost' && opp.loss_reason" class="p-2 rounded bg-rose-50 border border-rose-100 text-[10px] text-rose-700">
              <strong>Loss Reason:</strong> {{ opp.loss_reason }}
            </div>
          </div>

          <!-- Empty Column placeholder -->
          <div v-if="getOpportunitiesByStage(col.id).length === 0" class="text-center py-12 text-slate-300 text-xs border border-dashed border-slate-200 rounded-xl">
            Drag deals here
          </div>
        </div>
      </div>
    </div>

    <!-- Opportunity Add/Edit Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl w-full max-w-lg p-8 border border-slate-100 shadow-2xl space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900">{{ modalMode === 'create' ? 'Register Deal Opportunity' : 'Opportunity Detail Settings' }}</h2>
          <p class="text-sm text-slate-500 mt-1">Configure deal amount and forecast stage parameters.</p>
        </div>

        <div v-if="modalError" class="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {{ modalError }}
        </div>

        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Opportunity Title</label>
            <input 
              v-model="opportunityForm.title"
              type="text" 
              required
              placeholder="e.g. Software Licenses Purchase"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Link Lead -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Associated Lead Prospect</label>
              <select v-model="opportunityForm.lead_id" required class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none text-slate-600">
                <option value="" disabled>-- Select Lead --</option>
                <option v-for="ld in leadsList" :key="ld.id" :value="ld.id">
                  {{ ld.name }}
                </option>
              </select>
            </div>
            <!-- Link Account -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Account</label>
              <select v-model="opportunityForm.account_id" required class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none text-slate-600">
                <option value="" disabled>-- Select Company --</option>
                <option v-for="acc in accountsList" :key="acc.id" :value="acc.id">
                  {{ acc.company_name }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deal Stage</label>
              <select v-model="opportunityForm.stage" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none text-slate-600">
                <option value="prospecting">Prospecting</option>
                <option value="qualification">Qualification</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Close Date</label>
              <input 
                v-model="opportunityForm.expected_close"
                type="date" 
                required
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none text-slate-600"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Amount (IDR)</label>
              <input 
                v-model="opportunityForm.amount"
                type="number" 
                required
                min="0"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none text-slate-600"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Probability Success (%)</label>
              <input 
                v-model="opportunityForm.probability"
                type="number" 
                required
                min="0"
                max="100"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none text-slate-600"
              />
            </div>
          </div>

          <!-- Loss reason if closed lost manually selected -->
          <div class="space-y-1" v-if="opportunityForm.stage === 'closed_lost'">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider text-rose-600">Loss Reason Description</label>
            <input 
              v-model="opportunityForm.loss_reason"
              type="text" 
              required
              placeholder="e.g. Higher pricing than competitor"
              class="w-full bg-slate-50 border border-rose-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-rose-500"
            />
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              <button 
                v-if="modalMode === 'edit'"
                type="button" 
                @click="deleteOpportunity(opportunityForm.id, opportunityForm.title)" 
                class="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 rounded-xl text-rose-600 text-sm transition-colors"
              >
                Delete Deal
              </button>
            </div>
            <div class="flex items-center gap-3">
              <button type="button" @click="isModalOpen = false" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">Cancel</button>
              <button type="submit" :disabled="submitting" class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50">
                Save Opportunity
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Loss Reason Prompt Modal -->
    <div v-if="isLossModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
      <div class="bg-white rounded-3xl w-full max-w-md p-8 border border-slate-100 shadow-2xl space-y-6">
        <div>
          <h2 class="text-xl font-bold text-slate-900">Why was this deal lost?</h2>
          <p class="text-sm text-slate-500 mt-1">Please provide a brief reason for losing this opportunity to help improve forecasting data.</p>
        </div>

        <form @submit.prevent="submitLossReason" class="space-y-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider text-rose-600">Loss Reason</label>
            <input 
              v-model="lossReasonText"
              type="text" 
              required
              placeholder="e.g. Budget constraints, pricing too high"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-rose-500"
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" @click="isLossModalOpen = false; fetchOpportunities()" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl text-sm">
              Log as Closed Lost
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
