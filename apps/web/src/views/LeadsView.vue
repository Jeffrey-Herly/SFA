<script setup lang="ts">
import { ref } from 'vue'

// Ini adalah contoh data rekayasa (mock data)
// Nantinya data ini akan diambil dari Backend
const leads = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'New' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Contacted' },
  { id: 3, name: 'Robert Downey', email: 'robert@stark.com', status: 'Qualified' },
])
</script>

<template>
  <div class="space-y-6">
    <!-- Header Halaman -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Manajemen Leads</h1>
      <p class="text-sm text-slate-500 mt-1">Lacak dan kelola calon pelanggan potensial Anda di sini.</p>
    </div>

    <!-- Tabel Data -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr v-for="lead in leads" :key="lead.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{{ lead.name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{{ lead.email }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                {{ lead.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
