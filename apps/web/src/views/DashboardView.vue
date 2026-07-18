<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { reportsService, DashboardMetrics } from '../services/reports'

const authStore = useAuthStore()

// State
const metrics = ref<DashboardMetrics | null>(null)
const isLoading = ref(true)

// Fetch dashboard data
const fetchDashboardData = async () => {
  isLoading.value = true
  try {
    const data = await reportsService.getDashboardMetrics()
    metrics.value = data
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error)
  } finally {
    isLoading.value = false
  }
}

// Format currency helper
const formatIDR = (val?: number) => {
  if (val === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val)
}

const isManagerOrAdmin = computed(() => {
  return authStore.userRole === 'admin' || authStore.userRole === 'sales_manager'
})

// Dynamic SVG Chart Coordinates calculations
// We draw a polyline inside an SVG viewbox of 500x200
const svgChartPoints = computed(() => {
  if (!metrics.value || metrics.value.salesTrend.length === 0) return ''
  const trend = metrics.value.salesTrend
  const maxVal = Math.max(...trend.map(t => t.amount), 1000000) // avoid divide by zero

  const width = 500
  const height = 150 // graph area height
  const paddingBottom = 20

  return trend.map((t, index) => {
    const x = (index / (trend.length - 1)) * (width - 60) + 30
    const ratio = t.amount / maxVal
    const y = height - ratio * (height - 30) + paddingBottom
    return `${x},${y}`
  }).join(' ')
})

const svgChartCircles = computed(() => {
  if (!metrics.value || metrics.value.salesTrend.length === 0) return []
  const trend = metrics.value.salesTrend
  const maxVal = Math.max(...trend.map(t => t.amount), 1000000)

  const width = 500
  const height = 150
  const paddingBottom = 20

  return trend.map((t, index) => {
    const x = (index / (trend.length - 1)) * (width - 60) + 30
    const ratio = t.amount / maxVal
    const y = height - ratio * (height - 30) + paddingBottom
    return {
      x,
      y,
      amountFormatted: formatIDR(t.amount),
      label: t.month,
    }
  })
})

// Target achievement ring parameters
const getCircumference = (radius: number) => 2 * Math.PI * radius
const getStrokeDashoffset = (radius: number, pct: number) => {
  const capPct = Math.min(Math.max(pct, 0), 100)
  return getCircumference(radius) - (capPct / 100) * getCircumference(radius)
}

// Client-side CSV Exporter
const exportToCSV = () => {
  if (!metrics.value) return

  // 1. Compile KPIs & Targets
  const rows = [
    ['--- SALES PERFORMANCE SUMMARY REPORT ---'],
    ['Generated Date', new Date().toLocaleString()],
    ['User Email', authStore.user?.email || 'unknown'],
    ['User Role', authStore.userRole || 'unknown'],
    [],
    ['METRIC NAME', 'ACTUAL VALUE'],
    ['Total Approved Sales (IDR)', metrics.value.kpis.totalSales],
    ['Active Leads Count', metrics.value.kpis.activeLeads],
    ['Deal Success Win Rate (%)', `${metrics.value.kpis.winRate}%`],
    ['Visits completed this month', metrics.value.kpis.visitsCount],
    [],
  ]

  if (metrics.value.targetMetrics.hasTarget) {
    const tm = metrics.value.targetMetrics
    rows.push(
      ['TARGET PARAMETER', 'MONTHLY TARGET', 'ACTUAL ACHIEVED', 'ACHIEVEMENT RATE (%)'],
      ['Sales Target (IDR)', tm.targetAmount, tm.actualAmount, `${tm.amountPct}%`],
      ['Visit Target', tm.targetVisits, tm.actualVisits, `${tm.visitsPct}%`],
      ['New Leads Target', tm.targetLeads, tm.actualLeads, `${tm.leadsPct}%`],
      []
    )
  }

  // 2. Trend data
  rows.push(['MONTHLY SALES TREND (LAST 6 MONTHS)'])
  rows.push(['Month', 'Year', 'Sales Amount (IDR)'])
  metrics.value.salesTrend.forEach(t => {
    rows.push([t.month, String(t.year), String(t.amount)])
  })
  rows.push([])

  // 3. Leaderboard
  if (isManagerOrAdmin.value && metrics.value.leaderboard.length > 0) {
    rows.push(['GLOBAL SALESPERSON LEADERBOARD'])
    rows.push(['Rank', 'Name', 'Email', 'Role', 'Total Sales (IDR)', 'Active Leads'])
    metrics.value.leaderboard.forEach((rep, index) => {
      rows.push([
        String(index + 1),
        rep.name,
        rep.email,
        rep.role,
        String(rep.totalSales),
        String(rep.activeLeads),
      ])
    })
  }

  // Convert to CSV string
  const csvContent = 'data:text/csv;charset=utf-8,' 
    + rows.map(e => e.map(val => `"${String(val !== null && val !== undefined ? val : '').replace(/"/g, '""')}"`).join(',')).join('\n')

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `SFA_Report_${new Date().toISOString().slice(0,10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="space-y-8 font-sans">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Performance Dashboard</h1>
        <p class="text-sm text-slate-500 mt-1">Real-time sales target tracking, win rate aggregations, and leaderboard tracking.</p>
      </div>
      <button 
        @click="exportToCSV"
        :disabled="isLoading"
        class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 text-sm disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.2" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Export Reports (CSV)
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-24">
      <span class="inline-block w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
    </div>

    <template v-else-if="metrics">
      <!-- Metrik KPI Cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Sales -->
        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-105 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.22.11a3.118 3.118 0 003.79-.383m0-8.598l.22.11a3.118 3.118 0 003.79-.383m0-3.363L12 3m0 18l.22-.11a3.118 3.118 0 003.79-.383" /></svg>
          </div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Sales (Approved)</span>
          <span class="text-lg font-black text-slate-800 mt-2 block">{{ formatIDR(metrics.kpis.totalSales) }}</span>
        </div>

        <!-- Leads -->
        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-105 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          </div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Leads</span>
          <span class="text-2xl font-black text-slate-800 mt-2 block">{{ metrics.kpis.activeLeads }}</span>
        </div>

        <!-- Win Rate -->
        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-105 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Deal Win Rate</span>
          <span class="text-2xl font-black text-slate-800 mt-2 block">{{ metrics.kpis.winRate }}%</span>
        </div>

        <!-- Visits -->
        <div class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-105 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Monthly Meetings</span>
          <span class="text-2xl font-black text-slate-800 mt-2 block">{{ metrics.kpis.visitsCount }}</span>
        </div>
      </div>

      <!-- Target Performance Rings Grid -->
      <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
        <div>
          <h2 class="text-base font-bold text-slate-900">Personal Target Progress (This Month)</h2>
          <p class="text-xs text-slate-500 mt-0.5">Real-time target comparison from database against your completed work.</p>
        </div>

        <div v-if="!metrics.targetMetrics.hasTarget" class="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
          No targets assigned to you for the current active period. Contact your Sales Manager.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Sales target ring -->
          <div class="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
            <span class="text-xs font-bold text-slate-500 mb-4">SALES DEALS TARGET</span>
            <div class="relative w-32 h-32 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="50" stroke="#f1f5f9" stroke-width="8" fill="transparent" />
                <circle cx="64" cy="64" r="50" stroke="#3b82f6" stroke-width="8" fill="transparent"
                  :stroke-dasharray="getCircumference(50)"
                  :stroke-dashoffset="getStrokeDashoffset(50, metrics.targetMetrics.amountPct)"
                  stroke-linecap="round" class="transition-all duration-1000 ease-out" />
              </svg>
              <div class="absolute text-center">
                <span class="text-lg font-black text-slate-800 block">{{ metrics.targetMetrics.amountPct }}%</span>
                <span class="text-[9px] text-slate-400 block uppercase font-bold">Achieved</span>
              </div>
            </div>
            <div class="text-center mt-4 space-y-1">
              <p class="text-xs text-slate-500">Target: <span class="font-bold text-slate-700">{{ formatIDR(metrics.targetMetrics.targetAmount) }}</span></p>
              <p class="text-xs text-slate-500">Actual: <span class="font-bold text-blue-600">{{ formatIDR(metrics.targetMetrics.actualAmount) }}</span></p>
            </div>
          </div>

          <!-- Visit target ring -->
          <div class="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
            <span class="text-xs font-bold text-slate-500 mb-4">CLIENT MEETINGS</span>
            <div class="relative w-32 h-32 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="50" stroke="#f1f5f9" stroke-width="8" fill="transparent" />
                <circle cx="64" cy="64" r="50" stroke="#a855f7" stroke-width="8" fill="transparent"
                  :stroke-dasharray="getCircumference(50)"
                  :stroke-dashoffset="getStrokeDashoffset(50, metrics.targetMetrics.visitsPct)"
                  stroke-linecap="round" class="transition-all duration-1000 ease-out" />
              </svg>
              <div class="absolute text-center">
                <span class="text-lg font-black text-slate-800 block">{{ metrics.targetMetrics.visitsPct }}%</span>
                <span class="text-[9px] text-slate-400 block uppercase font-bold">Achieved</span>
              </div>
            </div>
            <div class="text-center mt-4 space-y-1">
              <p class="text-xs text-slate-500">Target: <span class="font-bold text-slate-700">{{ metrics.targetMetrics.targetVisits }} meetings</span></p>
              <p class="text-xs text-slate-500">Actual: <span class="font-bold text-purple-600">{{ metrics.targetMetrics.actualVisits }} completed</span></p>
            </div>
          </div>

          <!-- New Leads ring -->
          <div class="flex flex-col items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
            <span class="text-xs font-bold text-slate-500 mb-4">NEW LEADS SOURCE</span>
            <div class="relative w-32 h-32 flex items-center justify-center">
              <svg class="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="50" stroke="#f1f5f9" stroke-width="8" fill="transparent" />
                <circle cx="64" cy="64" r="50" stroke="#f59e0b" stroke-width="8" fill="transparent"
                  :stroke-dasharray="getCircumference(50)"
                  :stroke-dashoffset="getStrokeDashoffset(50, metrics.targetMetrics.leadsPct)"
                  stroke-linecap="round" class="transition-all duration-1000 ease-out" />
              </svg>
              <div class="absolute text-center">
                <span class="text-lg font-black text-slate-800 block">{{ metrics.targetMetrics.leadsPct }}%</span>
                <span class="text-[9px] text-slate-400 block uppercase font-bold">Achieved</span>
              </div>
            </div>
            <div class="text-center mt-4 space-y-1">
              <p class="text-xs text-slate-500">Target: <span class="font-bold text-slate-700">{{ metrics.targetMetrics.targetLeads }} prospects</span></p>
              <p class="text-xs text-slate-500">Actual: <span class="font-bold text-amber-600">{{ metrics.targetMetrics.actualLeads }} added</span></p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- SVG Sales Trend Chart -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div>
            <h2 class="text-base font-bold text-slate-900">Sales Value Trend</h2>
            <p class="text-xs text-slate-500">Approved order amounts logged over the past 6 months.</p>
          </div>

          <div class="relative h-[220px] w-full flex items-end">
            <!-- SVG Plotting -->
            <svg class="w-full h-[180px]" viewBox="0 0 500 180" preserveAspectRatio="none">
              <!-- Grid lines -->
              <line x1="30" y1="30" x2="470" y2="30" stroke="#f8fafc" stroke-width="1" />
              <line x1="30" y1="80" x2="470" y2="80" stroke="#f8fafc" stroke-width="1" />
              <line x1="30" y1="130" x2="470" y2="130" stroke="#f8fafc" stroke-width="1" />
              <line x1="30" y1="160" x2="470" y2="160" stroke="#e2e8f0" stroke-width="1" />

              <!-- Line points path -->
              <polyline
                fill="none"
                stroke="url(#chartGrad)"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                :points="svgChartPoints"
              />

              <!-- Gradient Defs -->
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stop-color="#3b82f6" />
                  <stop offset="100%" stop-color="#6366f1" />
                </linearGradient>
              </defs>

              <!-- Circle handles & tooltips -->
              <circle
                v-for="(circle, index) in svgChartCircles"
                :key="index"
                :cx="circle.x"
                :cy="circle.y"
                r="5"
                fill="#ffffff"
                stroke="#6366f1"
                stroke-width="2.5"
              />
            </svg>

            <!-- X Axis Labels -->
            <div class="absolute bottom-0 left-0 right-0 flex justify-between px-6 text-[10px] text-slate-400 font-bold">
              <span v-for="circle in svgChartCircles" :key="circle.label">
                {{ circle.label }}
              </span>
            </div>

            <!-- Value indicators directly above dots -->
            <div 
              v-for="circle in svgChartCircles" 
              :key="circle.label"
              class="absolute text-[8px] font-black text-slate-600 px-1 py-0.5 bg-slate-50 border border-slate-100 rounded"
              :style="{ left: `${(circle.x / 500) * 100 - 4}%`, bottom: `${180 - (circle.y / 180) * 100 + 12}px` }"
            >
              {{ circle.amountFormatted.replace(',00', '').replace('Rp ', 'Rp') }}
            </div>
          </div>
        </div>

        <!-- Leaderboard (Visible to Manager/Admin) -->
        <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div class="space-y-4">
            <div>
              <h2 class="text-base font-bold text-slate-900">Reps Leaderboard</h2>
              <p class="text-xs text-slate-500 mt-0.5">Top performing salesperson rank list.</p>
            </div>

            <div v-if="!isManagerOrAdmin" class="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              Leaderboard rankings are restricted to Sales Management and Admin roles only.
            </div>

            <div v-else-if="metrics.leaderboard.length === 0" class="text-center py-12 text-slate-400 text-xs">
              No sales rep records found.
            </div>

            <div v-else class="space-y-3">
              <div 
                v-for="(rep, index) in metrics.leaderboard" 
                :key="rep.email"
                class="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50"
              >
                <div class="flex items-center gap-3">
                  <!-- Rank indicator badge -->
                  <span 
                    class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                    :class="[
                      index === 0 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400/20' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                    ]"
                  >
                    {{ index + 1 }}
                  </span>
                  <div>
                    <span class="text-xs font-bold text-slate-800 block line-clamp-1">{{ rep.name }}</span>
                    <span class="text-[9px] text-slate-400 block truncate max-w-[120px]">{{ rep.email }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-black text-slate-900 block">{{ formatIDR(rep.totalSales) }}</span>
                  <span class="text-[9px] text-slate-400 font-bold uppercase block">{{ rep.activeLeads }} Active Leads</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
