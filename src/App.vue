<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
    <header class="bg-white shadow-sm border-b border-orange-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div class="w-10 h-10 fire-gradient rounded-lg flex items-center justify-center mr-3">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Nina Note</h1>
          </div>
          <nav class="flex space-x-4">
            <router-link
              to="/"
              class="text-gray-600 hover:text-fire-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Inicio
            </router-link>
            <router-link
              to="/history"
              class="text-gray-600 hover:text-fire-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Historial
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <main class="flex-grow">
      <router-view />
    </main>

    <footer class="bg-white border-t border-gray-200 mt-12">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p class="text-center text-gray-500 text-sm">
          Nina Note - Extrae la esencia de cualquier editorial
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()

onMounted(() => {
  sessionStore.loadTwitterToken()
  sessionStore.loadSavedThreads()
})
</script>

<style>
.fire-gradient {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
}

.btn-primary {
  --apply: bg-gradient-to-r from-orange-500 to-red-500 hover: from-orange-600 hover: to-red-600
    text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform
    hover: scale-105 focus: outline-none focus: ring-2 focus: ring-orange-500 focus: ring-offset-2
    disabled: opacity-50 disabled: cursor-not-allowed disabled: hover: scale-100;
}

.btn-secondary {
  --apply: bg-white border border-gray-300 hover: border-gray-400 text-gray-700 font-semibold py-2
    px-4 rounded-lg transition-all duration-200 hover: bg-gray-50 focus: outline-none focus: ring-2
    focus: ring-gray-500 focus: ring-offset-2 disabled: opacity-50 disabled: cursor-not-allowed;
}

.card {
  --apply: bg-white rounded-xl shadow-lg border border-gray-100 p-6;
}
</style>
