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
            required
          />
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
          {{ $t('home.submit') }}
        </span>
        <span v-else class="flex items-center justify-center">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-onPrimary mr-2"></div>
          {{ $t('common.loading') }}
        </span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useScraper } from '@/composables/useScraper'
import { logger } from '@/utils/logger'
import { handleError } from '@/utils/errorHandler'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  scraped: [url: string, content: string]
  error: [error: Error | string]
}>()

const { scrapeText, validateUrl, checkPuterAvailability, isLoading, error } = useScraper()
const { t } = useI18n()

const urlInput = ref('')
const urlError = ref<string | null>(null)
const puterAvailable = ref(false)

const handleSubmit = async () => {
  urlError.value = null

  const validation = validateUrl(urlInput.value)
  if (!validation.isValid) {
    urlError.value = validation.error || t('home.urlInput.error.invalid')
    emit('error', urlError.value)
    return
  }

  try {
    logger.info('Starting URL processing', { context: 'UrlInput' })
    const content = await scrapeText(urlInput.value)

    if (!content || content.trim().length < 100) {
      urlError.value = t('errors.scraping.noContent')
      emit('error', urlError.value)
      return
    }

    logger.success('URL processed successfully', { context: 'UrlInput' })
    emit('scraped', urlInput.value, content)
  } catch (err) {
    const appError = handleError(err, 'UrlInput')
    urlError.value = appError.message
    emit('error', appError)
  }
}
</script>
