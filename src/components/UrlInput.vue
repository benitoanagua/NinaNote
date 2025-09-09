<template>
  <div class="bg-surfaceContainerHigh rounded-xl p-6 shadow-md3">
    <!-- Banner de límite diario de GENERACIÓN -->
    <div
      v-if="threadHistory.hasReachedGenerationLimit"
      class="mb-6 bg-errorContainer/30 border border-errorContainer rounded-lg p-4"
    >
      <div class="flex items-start">
        <svg
          class="w-6 h-6 text-error mr-3 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <div>
          <h3 class="text-error font-semibold mb-1">Límite diario alcanzado</h3>
          <p class="text-error text-sm">
            Has generado {{ threadHistory.threadsGeneratedToday }} de
            {{ threadHistory.dailyGenerationLimit }} hilos hoy. Podrás generar
            {{ threadHistory.dailyGenerationLimit }} hilos más mañana.
          </p>
        </div>
      </div>
    </div>

    <!-- Contador de hilos restantes de GENERACIÓN -->
    <div
      v-else-if="threadHistory.threadsGeneratedToday > 0"
      class="mb-6 bg-primaryContainer/30 border border-primaryContainer rounded-lg p-4"
    >
      <div class="flex items-center">
        <svg
          class="w-5 h-5 text-primary mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p class="text-primary text-sm font-medium">
            Hilos generados hoy: {{ threadHistory.threadsGeneratedToday }}/{{
              threadHistory.dailyGenerationLimit
            }}
          </p>
          <p class="text-primary text-xs">
            {{ threadHistory.remainingThreads }} hilos restantes para hoy
          </p>
        </div>
      </div>
    </div>

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
        {{ $t('home.title') }}
      </h2>
      <p class="text-onSurfaceVariant">
        {{ $t('home.subtitle') }}
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="url" class="block text-sm font-medium text-onSurfaceVariant mb-2">
          {{ $t('home.urlInput.label') }}
        </label>
        <div class="relative">
          <input
            id="url"
            v-model="urlInput"
            type="url"
            :placeholder="$t('home.urlInput.placeholder')"
            class="input-outlined w-full px-4 py-3 bg-surfaceContainerHighest border border-outline rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-onSurface placeholder-onSurfaceVariant/60"
            :class="{ 'border-error focus:border-error focus:ring-error/20': urlError }"
            :disabled="threadHistory.hasReachedGenerationLimit"
            required
          />
        </div>
        <p v-if="urlError" class="mt-2 text-sm text-error">
          {{ urlError }}
        </p>
      </div>

      <button
        type="submit"
        :disabled="isLoading || !urlInput.trim() || threadHistory.hasReachedGenerationLimit"
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
          {{ threadHistory.hasReachedGenerationLimit ? 'Límite alcanzado' : $t('home.submit') }}
        </span>
        <span v-else class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-onPrimary mr-2"></div>
          {{ $t('common.loading') }}
        </span>
      </button>
    </form>

    <!-- Información del límite diario -->
    <div class="mt-6 bg-surfaceContainer rounded-lg p-4">
      <div class="flex items-center">
        <svg
          class="w-4 h-4 text-onSurfaceVariant mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-onSurfaceVariant text-sm">
          Límite diario: {{ threadHistory.dailyGenerationLimit }} hilos por navegador. Se reinicia
          cada día a las 00:00.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useScraper } from '@/composables/useScraper'
import { useThreadHistory } from '@/composables/useThreadHistory'
import { logger, handleError, translateError } from '@/utils/logger'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  scraped: [url: string, content: string]
  error: [error: Error | string]
}>()

const { scrapeContent, validateUrl, isLoading } = useScraper()
const threadHistory = useThreadHistory()
const { t } = useI18n()

const urlInput = ref('')
const urlError = ref<string | null>(null)

const handleSubmit = async () => {
  // Verificar límite diario de GENERACIÓN
  if (threadHistory.hasReachedGenerationLimit) {
    const errorMsg = 'Has alcanzado el límite diario de 5 hilos. Podrás generar más mañana.'
    urlError.value = errorMsg
    emit('error', errorMsg)
    return
  }

  urlError.value = null

  logger.info('Starting URL validation', { context: 'UrlInput' })

  const validation = validateUrl(urlInput.value)
  if (!validation.isValid) {
    urlError.value = validation.error || t('home.urlInput.error.invalid')
    logger.warn(`URL validation failed: ${urlError.value}`, {
      context: 'UrlInput',
      data: { url: urlInput.value },
    })
    emit('error', urlError.value)
    return
  }

  logger.info('URL validation passed', {
    context: 'UrlInput',
    data: { url: urlInput.value },
  })

  try {
    logger.info('Starting URL processing', { context: 'UrlInput' })
    logger.info(`Scraping content from: ${urlInput.value}`, { context: 'UrlInput' })

    const contentResult = await scrapeContent(urlInput.value)
    const content = contentResult.content

    logger.debug('Content scraped successfully', {
      context: 'UrlInput',
      data: {
        contentLength: content.length,
        title: contentResult.title,
        imageCount: contentResult.images?.length || 0,
      },
    })

    if (!content || content.trim().length < 100) {
      urlError.value = t('errors.scraping.noContent')
      logger.warn('Not enough content extracted from URL', {
        context: 'UrlInput',
        data: {
          contentLength: content?.length,
          url: urlInput.value,
        },
      })
      emit('error', urlError.value)
      return
    }

    logger.success('URL processed successfully', {
      context: 'UrlInput',
      data: {
        contentLength: content.length,
        hasImages: (contentResult.images?.length || 0) > 0,
      },
    })

    emit('scraped', urlInput.value, content)
  } catch (err) {
    const appError = handleError(err, 'UrlInput')
    urlError.value = translateError(appError)

    logger.error(`URL processing failed: ${appError.message}`, {
      context: 'UrlInput',
      data: {
        error: err,
        url: urlInput.value,
      },
    })

    emit('error', appError)
  }
}
</script>
