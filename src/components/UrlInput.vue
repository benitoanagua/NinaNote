<template>
  <div class="card max-w-2xl mx-auto">
    <div class="text-center mb-8">
      <div class="flex items-center justify-center mb-4">
        <div class="w-12 h-12 fire-gradient rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12.01 2L22 7l-10 5L2 7l10.01-5zM22 17l-10 5L2 17m20 0L12 22l10-5z"
            />
          </svg>
        </div>
      </div>
      <h2 class="text-2xl font-bold text-gray-800 mb-2">
        Extrae la esencia de cualquier editorial
      </h2>
      <p class="text-gray-600">
        Convierte artículos largos en hilos de Twitter impactantes en segundos
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="url" class="block text-sm font-medium text-gray-700 mb-2">
          URL del editorial o artículo
        </label>
        <div class="relative">
          <input
            id="url"
            v-model="urlInput"
            type="url"
            placeholder="https://ejemplo.com/editorial-interesante"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-transparent outline-none transition-all duration-200"
            :class="{ 'border-red-300 focus:ring-red-500': urlError }"
            required
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg
              v-if="!isLoading"
              class="w-5 h-5 text-gray-400"
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
            <svg v-else class="animate-spin w-5 h-5 text-fire-500" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
        <p v-if="urlError" class="mt-2 text-sm text-red-600">
          {{ urlError }}
        </p>
      </div>

      <button type="submit" :disabled="isLoading || !urlInput.trim()" class="btn-primary w-full">
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
          <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Extrayendo esencia...
        </span>
      </button>
    </form>

    <!-- Ejemplos de URLs -->
    <div class="mt-8 pt-6 border-t border-gray-200">
      <p class="text-sm text-gray-600 mb-3">Prueba con estos ejemplos:</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="example in exampleUrls"
          :key="example.url"
          @click="setExampleUrl(example.url)"
          class="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors duration-200"
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
