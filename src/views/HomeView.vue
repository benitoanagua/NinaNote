<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <UrlInput @scraped="handleScraped" @error="handleError" />

      <!-- Mostrar errores si es necesario -->
      <div
        v-if="errorMessage"
        class="mt-4 bg-errorContainer/30 border border-errorContainer rounded-lg p-4"
      >
        <p class="text-error text-sm">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSEO } from '@/composables/useSEO'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import UrlInput from '@/components/UrlInput.vue'

useSEO({ path: '/' })
const router = useRouter()
const sessionStore = useSessionStore()
const errorMessage = ref<string>('')

const handleScraped = (url: string, content: string) => {
  errorMessage.value = '' // Limpiar error previo
  sessionStore.setLastProcessedUrl(url)
  router.push({
    path: '/summary',
    query: { url: encodeURIComponent(url) },
  })
}

const handleError = (error: string | Error) => {
  errorMessage.value = typeof error === 'string' ? error : error.message
  console.error('Error from UrlInput:', error)

  // Opcional: auto-ocultar el error después de 5 segundos
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}
</script>
