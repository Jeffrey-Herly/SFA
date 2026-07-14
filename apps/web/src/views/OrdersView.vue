<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { ordersService, OrderData, OrderItemData } from '../services/orders'
import { accountsService, AccountData } from '../services/accounts'
import { opportunitiesService, OpportunityData } from '../services/opportunities'

const authStore = useAuthStore()

// State
const orders = ref<OrderData[]>([])
const accountsList = ref<AccountData[]>([])
const opportunitiesList = ref<OpportunityData[]>([])
const totalOrders = ref(0)
const page = ref(1)
const limit = ref(8)
const search = ref('')
const selectedStatus = ref('')
const isLoading = ref(false)

// Detail Slide-over
const isDetailOpen = ref(false)
const selectedOrder = ref<OrderData | null>(null)
const loadingDetail = ref(false)

// Modals state
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const modalError = ref('')
const submitting = ref(false)

// Form state
const orderForm = ref({
  id: '',
  account_id: '',
  opportunity_id: '' as string | null,
  order_date: new Date().toISOString().split('T')[0],
  delivery_date: '' as string | null,
  notes: '',
  items: [] as { product_name: string; quantity: number; unit_price: number; discount: number }[]
})

// Permissions helper
const isManagerOrAdmin = computed(() => {
  return authStore.userRole === 'admin' || authStore.userRole === 'sales_manager'
})

// Fetch orders
const fetchOrders = async () => {
  isLoading.value = true
  try {
    const filters = {
      status: selectedStatus.value || undefined,
      search: search.value || undefined,
    }
    const result = await ordersService.getOrders(page.value, limit.value, filters)
    orders.value = result.data
    totalOrders.value = result.total
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch helper data
const fetchDependencies = async () => {
  try {
    const [accRes, oppRes] = await Promise.all([
      accountsService.getAccounts(1, 100),
      opportunitiesService.getOpportunities(),
    ])
    accountsList.value = accRes.data
    opportunitiesList.value = oppRes
  } catch (error) {
    console.error('Failed to load dependencies:', error)
  }
}

const handleSearch = () => {
  page.value = 1
  fetchOrders()
}

const handlePageChange = (newPage: number) => {
  page.value = newPage
  fetchOrders()
}

// Items management in form
const addOrderItemRow = () => {
  orderForm.value.items.push({
    product_name: '',
    quantity: 1,
    unit_price: 0,
    discount: 0,
  })
}

const removeOrderItemRow = (index: number) => {
  orderForm.value.items.splice(index, 1)
}

// Computed total amount in form
const formTotalAmount = computed(() => {
  return orderForm.value.items.reduce((acc, item) => {
    const sub = item.quantity * item.unit_price - item.discount
    return acc + (sub > 0 ? sub : 0)
  }, 0)
})

// Open create/edit modal
const openModal = (mode: 'create' | 'edit', order?: OrderData) => {
  modalMode.value = mode
  modalError.value = ''
  
  if (mode === 'edit' && order) {
    orderForm.value = {
      id: order.id || '',
      account_id: order.account_id,
      opportunity_id: order.opportunity_id || '',
      order_date: order.order_date ? order.order_date.split('T')[0] : '',
      delivery_date: order.delivery_date ? order.delivery_date.split('T')[0] : '',
      notes: order.notes || '',
      items: order.items ? order.items.map(it => ({
        product_name: it.product_name,
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
        discount: Number(it.discount),
      })) : []
    }
  } else {
    orderForm.value = {
      id: '',
      account_id: '',
      opportunity_id: '',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      notes: '',
      items: [{ product_name: '', quantity: 1, unit_price: 150000, discount: 0 }]
    }
  }
  isModalOpen.value = true
}

const submitForm = async () => {
  if (!orderForm.value.account_id) {
    modalError.value = 'Please select a Customer Account.'
    return
  }
  if (orderForm.value.items.length === 0) {
    modalError.value = 'An order must contain at least one product item.'
    return
  }
  
  // Validate items
  for (const it of orderForm.value.items) {
    if (!it.product_name.trim()) {
      modalError.value = 'Product name is required for all item rows.'
      return
    }
    if (it.quantity <= 0) {
      modalError.value = 'Quantity must be a positive integer.'
      return
    }
    if (it.unit_price < 0) {
      modalError.value = 'Unit price cannot be negative.'
      return
    }
    if (it.discount < 0 || it.discount > it.unit_price * it.quantity) {
      modalError.value = 'Discount is invalid (cannot exceed items subtotal).'
      return
    }
  }

  modalError.value = ''
  submitting.value = true

  try {
    const payload = {
      account_id: orderForm.value.account_id,
      opportunity_id: orderForm.value.opportunity_id || null,
      order_date: orderForm.value.order_date,
      delivery_date: orderForm.value.delivery_date || null,
      notes: orderForm.value.notes || null,
      items: orderForm.value.items,
    }

    if (modalMode.value === 'create') {
      await ordersService.createOrder(payload)
    } else {
      await ordersService.updateOrder(orderForm.value.id, payload)
    }

    isModalOpen.value = false
    isDetailOpen.value = false
    fetchOrders()
  } catch (err: any) {
    modalError.value = err.response?.data?.message || err.message || 'Operation failed.'
  } finally {
    submitting.value = false
  }
}

// Show order detail
const showOrderDetail = async (order: OrderData) => {
  isDetailOpen.value = true
  loadingDetail.value = true
  selectedOrder.value = order
  try {
    const fullOrder = await ordersService.getOrderById(order.id!)
    selectedOrder.value = fullOrder
  } catch (error) {
    console.error('Failed to load order details:', error)
  } finally {
    loadingDetail.value = false
  }
}

// Actions from Detail
const submitOrder = async (id: string) => {
  try {
    await ordersService.updateOrder(id, { status: 'submitted' })
    if (selectedOrder.value) {
      showOrderDetail(selectedOrder.value)
    }
    fetchOrders()
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to submit order.')
  }
}

const approveOrder = async (id: string) => {
  try {
    await ordersService.approveOrder(id)
    if (selectedOrder.value) {
      showOrderDetail(selectedOrder.value)
    }
    fetchOrders()
  } catch (err: any) {
    alert('Failed to approve order.')
  }
}

const cancelOrder = async (id: string) => {
  try {
    await ordersService.cancelOrder(id)
    if (selectedOrder.value) {
      showOrderDetail(selectedOrder.value)
    }
    fetchOrders()
  } catch (err: any) {
    alert('Failed to cancel order.')
  }
}

const deleteOrder = async (id: string) => {
  try {
    await ordersService.deleteOrder(id)
    isDetailOpen.value = false
    fetchOrders()
  } catch (error) {
    alert('Failed to delete order.')
  }
}

// Status style mapper
const getStatusClass = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-600/10'
    case 'submitted':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10'
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
    case 'processing':
      return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10'
    case 'delivered':
      return 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/10'
    case 'cancelled':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const formatIDR = (val?: number) => {
  if (val === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val)
}

onMounted(() => {
  fetchOrders()
  fetchDependencies()
})
</script>

<template>
  <div class="space-y-6 font-sans">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Sales Orders</h1>
        <p class="text-sm text-slate-500 mt-1">Book customer product purchases, track processing logs, and submit for approvals.</p>
      </div>
      <button 
        @click="openModal('create')"
        class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 text-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        New Sales Order
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
          placeholder="Search by Order Number (e.g. ORD-2026...)" 
          class="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl py-2.5 pl-10 pr-4 text-sm transition-all duration-200 outline-none placeholder-slate-400"
        />
      </div>

      <!-- Status Filter -->
      <div class="w-full md:w-48 animate-none">
        <select 
          v-model="selectedStatus"
          @change="handleSearch"
          class="w-full bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl py-2.5 px-3.5 text-sm transition-all outline-none text-slate-600"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="processing">Processing</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-slate-500 bg-slate-50/50 border-b border-slate-100 uppercase">
            <tr>
              <th class="px-6 py-4 font-semibold">Order Number</th>
              <th class="px-6 py-4 font-semibold">Customer Company</th>
              <th class="px-6 py-4 font-semibold">Order Date</th>
              <th class="px-6 py-4 font-semibold">Salesperson</th>
              <th class="px-6 py-4 font-semibold">Total Amount</th>
              <th class="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="isLoading">
              <td colspan="6" class="text-center py-8 text-slate-500">
                <span class="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
              </td>
            </tr>
            <tr v-else-if="orders.length === 0">
              <td colspan="6" class="text-center py-12 text-slate-500">
                No orders recorded.
              </td>
            </tr>
            <tr 
              v-else
              v-for="order in orders" 
              :key="order.id" 
              @click="showOrderDetail(order)"
              class="hover:bg-slate-50/50 transition-colors cursor-pointer"
            >
              <td class="px-6 py-4">
                <div class="font-bold text-slate-900">{{ order.order_number }}</div>
              </td>
              <td class="px-6 py-4 text-slate-700 font-medium">{{ order.account?.company_name }}</td>
              <td class="px-6 py-4 text-slate-600">{{ new Date(order.order_date).toLocaleDateString() }}</td>
              <td class="px-6 py-4 text-slate-600">{{ order.salesperson?.name }}</td>
              <td class="px-6 py-4 font-bold text-slate-900">{{ formatIDR(Number(order.total_amount)) }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full" :class="getStatusClass(order.status)">
                  {{ order.status.toUpperCase() }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
        <span>Showing {{ orders.length }} of {{ totalOrders }} orders</span>
        <div class="flex items-center gap-2">
          <button 
            :disabled="page === 1"
            @click="handlePageChange(page - 1)"
            class="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Previous
          </button>
          <span class="font-medium text-slate-900">Page {{ page }} of {{ Math.ceil(totalOrders / limit) || 1 }}</span>
          <button 
            :disabled="page >= Math.ceil(totalOrders / limit)"
            @click="handlePageChange(page + 1)"
            class="px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Details Slide-over -->
    <div v-if="isDetailOpen" class="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <div class="bg-white w-full max-w-lg h-full shadow-2xl p-8 flex flex-col justify-between overflow-y-auto">
        <div class="space-y-6">
          <!-- Slide-over header -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Details</span>
              <h2 class="text-xl font-extrabold text-slate-900 mt-1">{{ selectedOrder?.order_number }}</h2>
            </div>
            <button @click="isDetailOpen = false" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div v-if="loadingDetail" class="text-center py-12">
            <span class="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
          </div>

          <div v-else-if="selectedOrder" class="space-y-5">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-slate-400 text-xs block">Customer Account</span>
                <span class="font-bold text-slate-800">{{ selectedOrder.account?.company_name }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-xs block">Salesperson Owner</span>
                <span class="font-bold text-slate-800">{{ selectedOrder.salesperson?.name }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-slate-400 text-xs block">Order Date</span>
                <span class="font-bold text-slate-800">{{ new Date(selectedOrder.order_date).toLocaleDateString() }}</span>
              </div>
              <div>
                <span class="text-slate-400 text-xs block">Delivery target</span>
                <span class="font-bold text-slate-800">{{ selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString() : 'Immediate' }}</span>
              </div>
            </div>

            <div class="border-t border-slate-100 pt-4">
              <span class="text-slate-400 text-xs block mb-2">Order Status Checklist</span>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-3 py-1 text-xs font-extrabold rounded-full" :class="getStatusClass(selectedOrder.status)">
                  {{ selectedOrder.status.toUpperCase() }}
                </span>
                <p class="text-xs text-slate-400">
                  <span v-if="selectedOrder.status === 'draft'">Awaiting submission by rep.</span>
                  <span v-else-if="selectedOrder.status === 'submitted'">Submitted! Awaiting manager validation approval.</span>
                  <span v-else-if="selectedOrder.status === 'approved'">Approved! Booking to processing systems.</span>
                  <span v-else-if="selectedOrder.status === 'cancelled'">Cancelled/rejected by management.</span>
                </p>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="selectedOrder.notes" class="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
              <strong>Notes:</strong> {{ selectedOrder.notes }}
            </div>

            <!-- Items list -->
            <div class="border-t border-slate-100 pt-4 space-y-3">
              <span class="text-slate-400 text-xs block font-semibold uppercase tracking-wider">Itemized products list</span>
              <div class="space-y-2">
                <div v-for="item in selectedOrder.items" :key="item.id" class="flex justify-between items-center text-xs p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div>
                    <span class="font-bold text-slate-800 block">{{ item.product_name }}</span>
                    <span class="text-slate-500 text-[10px]">{{ item.quantity }} units x {{ formatIDR(Number(item.unit_price)) }} <span v-if="Number(item.discount) > 0">(disc: -{{ formatIDR(Number(item.discount)) }})</span></span>
                  </div>
                  <span class="font-bold text-slate-900">{{ formatIDR(Number(item.subtotal)) }}</span>
                </div>
              </div>

              <!-- Sum -->
              <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                <span class="font-bold text-slate-800 text-sm">Grand Total</span>
                <span class="font-black text-blue-600 text-lg">{{ formatIDR(Number(selectedOrder.total_amount)) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="selectedOrder" class="pt-6 border-t border-slate-100 flex flex-wrap gap-3">
          <!-- Sales Rep Actions -->
          <template v-if="selectedOrder.status === 'draft'">
            <button 
              @click="openModal('edit', selectedOrder)"
              class="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Modify Order
            </button>
            <button 
              @click="submitOrder(selectedOrder.id!)"
              class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
            >
              Submit Order
            </button>
            <button 
              @click="deleteOrder(selectedOrder.id!)"
              class="w-full px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-rose-600 rounded-xl text-xs font-semibold"
            >
              Delete Draft
            </button>
          </template>

          <!-- Manager Approval Actions -->
          <template v-if="isManagerOrAdmin && selectedOrder.status === 'submitted'">
            <button 
              @click="approveOrder(selectedOrder.id!)"
              class="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
            >
              Approve Sales
            </button>
            <button 
              @click="cancelOrder(selectedOrder.id!)"
              class="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
            >
              Reject / Cancel
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Order Add/Edit Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm overflow-y-auto">
      <div class="bg-white rounded-3xl w-full max-w-2xl p-8 border border-slate-100 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-8">
        <div>
          <h2 class="text-xl font-bold text-slate-900">{{ modalMode === 'create' ? 'Create Sales Order' : 'Edit Draft Order' }}</h2>
          <p class="text-sm text-slate-500 mt-1">Add product lines, discount codes, and client details below.</p>
        </div>

        <div v-if="modalError" class="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {{ modalError }}
        </div>

        <form @submit.prevent="submitForm" class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <!-- Account -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Corporate Customer</label>
              <select v-model="orderForm.account_id" required class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none text-slate-600">
                <option value="" disabled>-- Select Customer Company --</option>
                <option v-for="acc in accountsList" :key="acc.id" :value="acc.id">
                  {{ acc.company_name }}
                </option>
              </select>
            </div>
            <!-- Linked Opportunity -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Associated Deal Deal Opportunity (Optional)</label>
              <select v-model="orderForm.opportunity_id" class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none text-slate-600">
                <option value="">No associated deal link</option>
                <option v-for="opp in opportunitiesList" :key="opp.id" :value="opp.id">
                  {{ opp.title }} ({{ formatIDR(Number(opp.amount)) }})
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Date</label>
              <input 
                v-model="orderForm.order_date"
                type="date" 
                required
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none text-slate-600"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery target Date (Optional)</label>
              <input 
                v-model="orderForm.delivery_date"
                type="date" 
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none text-slate-600"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interaction Notes</label>
            <input 
              v-model="orderForm.notes"
              type="text" 
              placeholder="e.g. Terms Net 30, free shipping coupon code..."
              class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <!-- Product line item list manager -->
          <div class="border-t border-slate-100 pt-4 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Product Line Items</span>
              <button 
                type="button" 
                @click="addOrderItemRow"
                class="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
              >
                + Add Item
              </button>
            </div>

            <!-- Item row listings -->
            <div class="space-y-3">
              <div 
                v-for="(item, index) in orderForm.items" 
                :key="index" 
                class="grid grid-cols-12 gap-3 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100"
              >
                <!-- Name -->
                <div class="col-span-4 space-y-1">
                  <input 
                    v-model="item.product_name"
                    type="text" 
                    placeholder="Product name"
                    required
                    class="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs outline-none"
                  />
                </div>
                <!-- Qty -->
                <div class="col-span-2 space-y-1">
                  <input 
                    v-model.number="item.quantity"
                    type="number" 
                    min="1"
                    placeholder="Qty"
                    required
                    class="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs outline-none"
                  />
                </div>
                <!-- Price -->
                <div class="col-span-3 space-y-1">
                  <input 
                    v-model.number="item.unit_price"
                    type="number" 
                    min="0"
                    placeholder="Price"
                    required
                    class="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs outline-none"
                  />
                </div>
                <!-- Disc -->
                <div class="col-span-2 space-y-1">
                  <input 
                    v-model.number="item.discount"
                    type="number" 
                    min="0"
                    placeholder="Discount"
                    class="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs outline-none"
                  />
                </div>
                <!-- Remove -->
                <div class="col-span-1 text-center">
                  <button 
                    type="button" 
                    @click="removeOrderItemRow(index)"
                    class="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 mx-auto">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Total display -->
            <div class="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 mt-4">
              <span class="font-bold text-slate-800 text-sm">Calculated Total:</span>
              <span class="font-black text-blue-600 text-lg">{{ formatIDR(formTotalAmount) }}</span>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" @click="isModalOpen = false" class="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" :disabled="submitting" class="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all disabled:opacity-50">
              Save Order
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
