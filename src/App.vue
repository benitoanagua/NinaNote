<template>
  <div id="app" class="min-h-screen bg-background flex flex-col">
    <!-- Header Responsivo -->
    <header
      class="bg-surface shadow-sm border-b border-outlineVariant sticky top-0 z-50"
      ref="headerRef"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Sección izquierda: Logo y nombre -->
          <div class="flex items-center flex-shrink-0">
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
            <h1 class="text-xl md:text-2xl font-semibold text-onSurface">{{ $t('app.name') }}</h1>
          </div>

          <!-- Menú hamburguesa para móvil -->
          <div class="md:hidden flex items-center">
            <button
              @click.stop="toggleMobileMenu"
              class="p-2 rounded-md text-onSurfaceVariant hover:text-primary hover:bg-surfaceContainerHighest transition-colors"
              :aria-label="isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'"
              ref="menuButtonRef"
            >
              <svg
                v-if="!isMobileMenuOpen"
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Sección central: Navegación (escritorio) -->
          <nav class="hidden md:flex items-center space-x-6">
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

          <!-- Sección derecha: Controles (escritorio) -->
          <div class="hidden md:flex items-center gap-4">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>

        <!-- Menú móvil (dropdown) -->
        <transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="transform opacity-0 -translate-y-2"
          enter-to-class="transform opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="transform opacity-100 translate-y-0"
          leave-to-class="transform opacity-0 -translate-y-2"
        >
          <div
            v-if="isMobileMenuOpen"
            class="md:hidden bg-surfaceContainerHigh border-t border-outlineVariant mt-2 py-4 rounded-lg shadow-lg"
            ref="menuContentRef"
          >
            <div class="px-4 space-y-4">
              <!-- Navegación móvil -->
              <div class="space-y-2">
                <router-link
                  to="/"
                  @click="closeMobileMenu"
                  class="block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  :class="{
                    'text-primary bg-primaryContainer/20': $route.name === 'home',
                    'text-onSurfaceVariant hover:text-primary hover:bg-surfaceContainerHighest':
                      $route.name !== 'home',
                  }"
                >
                  {{ $t('navigation.home') }}
                </router-link>
                <router-link
                  to="/history"
                  @click="closeMobileMenu"
                  class="block px-3 py-2 rounded-md text-base font-medium transition-colors"
                  :class="{
                    'text-primary bg-primaryContainer/20': $route.name === 'history',
                    'text-onSurfaceVariant hover:text-primary hover:bg-surfaceContainerHighest':
                      $route.name !== 'history',
                  }"
                >
                  {{ $t('navigation.history') }}
                </router-link>
              </div>

              <!-- Controles móviles -->
              <div class="pt-4 border-t border-outlineVariant/50">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-onSurfaceVariant">Configuración</span>
                  <div class="flex items-center gap-3">
                    <LanguageSelector />
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-grow" @click="closeMobileMenuOnClickOutside">
      <router-view />
    </main>

    <!-- Terminal Global Fijo -->
    <TerminalLoader
      :isLoading="isTerminalLoading"
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-outlineVariant"
      :auto-collapse="true"
      :collapse-delay="5000"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import TerminalLoader from '@/components/TerminalLoader.vue'
import { useSEO } from '@/composables/useSEO'
import { logger } from '@/utils/logger'

// SEO global para la aplicación
useSEO({
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nina Note',
    url: 'https://ninanote.netlify.app',
    logo: 'https://ninanote.netlify.app/logo.png',
    description: 'Transforma artículos largos en hilos de Twitter impactantes con IA',
    sameAs: ['https://twitter.com/tu_usuario', 'https://github.com/tu_usuario/nina-note'],
  },
})

const sessionStore = useSessionStore()
const route = useRoute()
const isTerminalLoading = ref(false)
const isMobileMenuOpen = ref(false)
const headerRef = ref<HTMLElement | null>(null)
const menuButtonRef = ref<HTMLElement | null>(null)
const menuContentRef = ref<HTMLElement | null>(null)

// Toggle del menú móvil
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Cerrar menú móvil
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Cerrar menú móvil al hacer clic fuera
const closeMobileMenuOnClickOutside = (event: MouseEvent) => {
  if (!isMobileMenuOpen.value) return

  const target = event.target as HTMLElement
  const isClickInsideMenu = menuContentRef.value?.contains(target)
  const isClickOnMenuButton = menuButtonRef.value?.contains(target)

  if (!isClickInsideMenu && !isClickOnMenuButton) {
    closeMobileMenu()
  }
}

// Cerrar menú móvil al cambiar de ruta
watch(
  () => route.path,
  () => {
    closeMobileMenu()
  },
)

// Cerrar menú móvil al presionar Escape
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  sessionStore.loadSavedThreads()
  sessionStore.logStoreState()

  // Agregar event listeners
  document.addEventListener('keydown', handleEscapeKey)

  logger.info('Application initialized', { context: 'App' })
})

onUnmounted(() => {
  // Limpiar event listeners
  document.removeEventListener('keydown', handleEscapeKey)
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

/* Mejoras de accesibilidad para focus */
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

/* Mejoras para dispositivos táctiles */
@media (max-width: 768px) {
  .min-h-screen {
    min-height: 100vh;
    min-height: 100dvh; /* Soporte para navegadores modernos */
  }
}

/* Prevenir flashes en transiciones */
.mobile-menu-transition {
  transition:
    opacity 0.15s ease-out,
    transform 0.15s ease-out;
}

/* Mejorar rendimiento de animaciones */
.mobile-menu-content {
  will-change: transform, opacity;
}
</style>
