<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/layout/Sidebar.vue'
import Header from './components/layout/Header.vue'

const isSidebarOpen = ref(false)
const route = useRoute()
</script>

<template>
  <div v-if="route.path === '/login'" class="h-screen w-screen overflow-hidden bg-slate-950">
    <router-view />
  </div>
  <div v-else class="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
    <!-- Sidebar -->
    <Sidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />
    
    <!-- Main Content Area -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <Header @toggle-sidebar="isSidebarOpen = !isSidebarOpen" />
      
      <!-- Main view router -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-6">
        <div class="mx-auto max-w-7xl">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
/* Global Tailwind base is loaded in style.css */
</style>
