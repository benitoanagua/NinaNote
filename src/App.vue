<template>
  <div id="app" class="min-h-screen bg-background">
    <!-- Header -->
    <header class="bg-surface shadow-sm border-b border-outlineVariant sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Sección izquierda: Logo y nombre -->
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

          <!-- Sección central: Navegación -->
          <nav class="flex items-center space-x-6">
            <router-link
              to="/"
              class="text-onSurfaceVariant hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="{ 'text-primary font-semibold': $route.name === 'home' }"
            >
              {{ $t('navigation.home') }}
            </router-link>
            <router-link
              to="/history"
              class="text-onSurfaceVariant hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="{ 'text-primary font-semibold': $route.name === 'history' }"
            >
              {{ $t('navigation.history') }}
            </router-link>
          </nav>

          <!-- Sección derecha: Controles -->
          <div class="flex items-center gap-4">
            <LanguageSelector />
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
          {{ $t('app.description') }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSessionStore } from '@/stores/session'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'

const sessionStore = useSessionStore()

onMounted(() => {
  sessionStore.loadTwitterToken()
  sessionStore.loadSavedThreads()
})
</script>

<style>
/* Estilos para enlaces activos */
.router-link-active {
  --apply: text-primary;
}

/* Transiciones suaves */
.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>
