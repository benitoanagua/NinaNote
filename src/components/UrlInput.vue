<template>
  <div class="bg-surfaceContainerHigh rounded-xl p-6 shadow-md3">
    <div class="text-center mb-8">
      <div class="flex items-center justify-center mb-4">
        <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-md3">
          <svg class="w-8 h-8 text-onPrimary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>
      </div>
      <h2 class="text-2xl font-semibold text-onSurface mb-2">
        Extrae la esencia de cualquier editorial
      </h2>
      <p class="text-onSurfaceVariant">
        Convierte artículos largos en hilos de Twitter impactantes en segundos
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="url" class="block text-sm font-medium text-onSurfaceVariant mb-2">
          URL del editorial o artículo
        </label>
        <div class="relative">
          <input
            id="url"
            v-model="urlInput"
            type="url"
            placeholder="https://ejemplo.com/editorial-interesante"
            class="input-outlined w-full px-4 py-3 bg-surfaceContainerHighest border border-outline rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-onSurface placeholder-onSurfaceVariant/60"
            :class="{ 'border-error focus:border-error focus:ring-error/20': urlError }"
            required
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg
              v-if="!isLoading"
              class="w-5 h-5 text-onSurfaceVariant"
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
            <div v-else class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        </div>
        <p v-if="urlError" class="mt-2 text-sm text-error">
          {{ urlError }}
        </p>
      </div>

      <button
        type="submit"
        :disabled="isLoading || !urlInput.trim()"
        class="w-full py-3 bg-primary text-onPrimary rounded-xl shadow-md3 hover:shadow-md3-lg disabled:opacity-60 disabled:pointer-events-none transition-all duration-200 font-medium"
      >
        <span v-if="!isLoading" class="flex items-center justify-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
            />
          </svg>
          Encender la chispa
        </span>
        <span v-else class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-onPrimary mr-2"></div>
          Extrayendo esencia...
        </span>
      </button>
    </form>

    <!-- Ejemplos de URLs -->
    <div class="mt-8 pt-6 border-t border-outlineVariant">
      <p class="text-sm text-onSurfaceVariant mb-3">Prueba con estos ejemplos:</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="example in exampleUrls"
          :key="example.url"
          @click="setExampleUrl(example.url)"
          class="px-3 py-1 bg-secondaryContainer text-onSecondaryContainer rounded-full text-sm hover:bg-secondaryContainer hover:text-onSecondaryContainer transition-colors duration-200"
        >
          {{ example.title }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useScraper } from '@/composables/useScraper'

const emit = defineEmits<{
  scraped: [url: string, content: string]
}>()

const { scrapeText, isLoading, error } = useScraper()

const urlInput = ref('')
const urlError = ref<string | null>(null)

const exampleUrls = [
  {
    title: 'Tecnología',
    url: 'https://ejemplo.com/transformacion-digital-latam',
  },
  {
    title: 'Economía',
    url: 'https://ejemplo.com/futuro-economia-digital',
  },
  {
    title: 'Política',
    url: 'https://ejemplo.com/democracia-era-digital',
  },
]

const setExampleUrl = (url: string) => {
  urlInput.value = url
  urlError.value = null
}

const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const handleSubmit = async () => {
  urlError.value = null

  if (!validateUrl(urlInput.value)) {
    urlError.value = 'Por favor ingresa una URL válida'
    return
  }

  try {
    const content = await scrapeText(urlInput.value)

    if (!content || content.trim().length < 100) {
      urlError.value = 'No se pudo extraer suficiente contenido del artículo'
      return
    }

    emit('scraped', urlInput.value, content)
  } catch (err) {
    urlError.value = typeof err === 'string' ? err : 'Error al procesar la URL'
  }
}
</script>
