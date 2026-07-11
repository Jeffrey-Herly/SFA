<script setup lang="ts">
import { ref } from 'vue'

const stats = [
  { name: 'Total Leads', value: '245', change: '+12%', trend: 'up' },
  { name: 'Active Opportunities', value: '43', change: '+5%', trend: 'up' },
  { name: 'Win Rate', value: '32.4%', change: '-2%', trend: 'down' },
  { name: 'Pipeline Value', value: '$1.2M', change: '+18%', trend: 'up' },
]

const recentLeads = [
  { id: 1, name: 'Sarah Connor', company: 'Cyberdyne Systems', status: 'New', date: '2h ago', amount: '$45k' },
  { id: 2, name: 'Bruce Wayne', company: 'Wayne Enterprises', status: 'Qualified', date: '5h ago', amount: '$2M' },
  { id: 3, name: 'Tony Stark', company: 'Stark Industries', status: 'Contacted', date: '1d ago', amount: '$1.5M' },
  { id: 4, name: 'Diana Prince', company: 'Themyscira Antiques', status: 'Converted', date: '2d ago', amount: '$120k' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      <p class="text-sm text-slate-500 mt-1">Welcome back! Here's what's happening with your sales today.</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div 
        v-for="stat in stats" 
        :key="stat.name" 
        class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <p class="text-sm font-medium text-slate-500">{{ stat.name }}</p>
        <div class="mt-2 flex items-baseline gap-2">
          <p class="text-3xl font-semibold text-slate-900">{{ stat.value }}</p>
          <span 
            class="text-xs font-medium px-2 py-1 rounded-full"
            :class="stat.trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'"
          >
            {{ stat.change }}
          </span>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Recent Leads Table -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-900">Recent Leads</h2>
          <button class="text-sm text-blue-600 font-medium hover:text-blue-700">View all</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase">
              <tr>
                <th class="px-6 py-3 font-medium">Lead Name</th>
                <th class="px-6 py-3 font-medium">Status</th>
                <th class="px-6 py-3 font-medium">Est. Value</th>
                <th class="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="lead in recentLeads" :key="lead.id" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4">
                  <p class="font-medium text-slate-900">{{ lead.name }}</p>
                  <p class="text-slate-500 text-xs">{{ lead.company }}</p>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                    {{ lead.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-slate-600 font-medium">{{ lead.amount }}</td>
                <td class="px-6 py-4 text-slate-500 whitespace-nowrap">{{ lead.date }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions / Tasks -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 class="text-base font-semibold text-slate-900 mb-4">Tasks for Today</h2>
        <ul class="space-y-4">
          <li class="flex gap-3">
            <div class="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
            <div>
              <p class="text-sm font-medium text-slate-900">Call Sarah Connor</p>
              <p class="text-xs text-slate-500 mt-0.5">Follow up on proposal</p>
            </div>
          </li>
          <li class="flex gap-3">
            <div class="w-2 h-2 mt-2 rounded-full bg-amber-500"></div>
            <div>
              <p class="text-sm font-medium text-slate-900">Prepare Q3 Report</p>
              <p class="text-xs text-slate-500 mt-0.5">Due in 2 days</p>
            </div>
          </li>
          <li class="flex gap-3">
            <div class="w-2 h-2 mt-2 rounded-full bg-emerald-500"></div>
            <div>
              <p class="text-sm font-medium text-slate-900">Meeting with Bruce</p>
              <p class="text-xs text-slate-500 mt-0.5">2:00 PM - Zoom</p>
            </div>
          </li>
        </ul>
        <button class="mt-6 w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-xl text-sm transition-colors border border-slate-200">
          + Add New Task
        </button>
      </div>

    </div>
  </div>
</template>
