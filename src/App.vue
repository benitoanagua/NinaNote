<template>
  <div id="app" class="min-h-screen bg-background">
    <!-- Header -->
    <header class="bg-surface shadow-sm border-b border-outlineVariant sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div
              class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3 shadow-md3"
            >
              <svg
                class="w-6 h-6 text-onPrimary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-semibold text-onSurface">Nina Note</h1>
          </div>

          <div class="flex items-center gap-4">
            <nav class="flex space-x-4">
              <router-link
                to="/"
                class="text-onSurfaceVariant hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Inicio
              </router-link>
              <router-link
                to="/history"
                class="text-onSurfaceVariant hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Historial
              </router-link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-grow">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-surface border-t border-outlineVariant mt-12">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p class="text-center text-onSurfaceVariant text-sm">
          Nina Note - Extrae la esencia de cualquier editorial
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSessionStore } from '@/stores/session'
import ThemeToggle from '@/components/ThemeToggle.vue'

const sessionStore = useSessionStore()

onMounted(() => {
  sessionStore.loadTwitterToken()
  sessionStore.loadSavedThreads()
})
</script>

<style>
/* Mantener tus estilos personalizados pero adaptados a MD3 */
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primaryContainer) 100%);
  --apply: text-onPrimary font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform
    hover: scale-105 focus: outline-none focus: ring-2 focus: ring-primary disabled: opacity-50
    disabled: cursor-not-allowed disabled: hover: scale-100;
}

.btn-secondary {
  --apply: bg-surfaceContainer border border-outline text-onSurface font-semibold py-2 px-4
    rounded-lg transition-all duration-200 hover: bg-surfaceContainerHigh focus: outline-none
    focus: ring-2 focus: ring-primary disabled: opacity-50 disabled: cursor-not-allowed;
}

.card {
  --apply: bg-surfaceContainerHigh rounded-xl shadow-md3 border border-outlineVariant p-6;
}
</style>
