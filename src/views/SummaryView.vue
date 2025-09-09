<template>
  <div class="min-h-screen bg-background py-8 px-4">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-onSurface mb-2">{{ $t('summary.title') }}</h1>
        <p class="text-onSurfaceVariant">{{ $t('summary.subtitle') }}</p>
        <a
          :href="decodedUrl"
          target="_blank"
          class="text-primary hover:text-primary text-sm break-all inline-block mt-2"
        >
          {{ decodedUrl }}
        </a>
      </div>

      <!-- Mostrar error si existe -->
      <div
        v-if="errorMessage"
        class="mb-6 bg-errorContainer/30 border border-errorContainer rounded-lg p-6"
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
          <div class="flex-1">
            <h3 class="text-error font-semibold mb-2">Error al procesar el artículo</h3>
            <p class="text-error mb-4">{{ errorMessage }}</p>
            <button
              @click="retry"
              class="px-4 py-2 bg-error text-onError rounded-lg hover:bg-error/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>

      <!-- Estadísticas de procesamiento -->
      <div
        v-if="!errorMessage && tweets.length > 0"
        class="mb-6 bg-surfaceContainerHigh rounded-xl p-4"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="text-center">
              <div class="text-2xl font-semibold text-primary">{{ tweets.length }}</div>
              <div class="text-sm text-onSurfaceVariant">Tweets</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-semibold text-secondary">{{ articleImages.length }}</div>
              <div class="text-sm text-onSurfaceVariant">Imágenes</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-semibold text-tertiary">
                {{ Math.round((articleContent.length / 1000) * 100) / 100 }}k
              </div>
              <div class="text-sm text-onSurfaceVariant">Caracteres</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-onSurfaceVariant">
              {{ imageStats.tweetsWithImages }}/{{ tweets.length }} tweets con imágenes
            </div>
            <div class="text-xs text-onSurfaceVariant/60">
              Cobertura: {{ imageStats.imageCoverage }}%
            </div>
          </div>
        </div>
      </div>

      <ThreadPreview
        v-if="!errorMessage && tweets.length > 0"
        :tweets="tweets"
        :original-content="articleContent"
        :scraped-images="articleImages"
        @tweets-updated="handleTweetsUpdated"
      />

      <div v-else-if="!errorMessage && !isLoading" class="text-center py-12 text-onSurfaceVariant">
        <svg
          class="w-16 h-16 mx-auto mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>Preparado para procesar contenido...</p>
      </div>

      <div class="mt-8 text-center">
        <router-link
          to="/"
          class="px-6 py-2 bg-secondaryContainer text-onSecondaryContainer rounded-lg hover:bg-secondaryContainer hover:text-onSecondaryContainer transition-colors"
        >
          <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {{ $t('summary.backButton') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useArticleProcessor } from '@/composables/useArticleProcessor'
import ThreadPreview from '@/components/ThreadPreview.vue'
import { logger } from '@/utils/logger'

const route = useRoute()
const {
  tweets,
  articleContent,
  articleImages,
  errorMessage,
  isLoading,
  decodedUrl,
  loadArticle,
  retry,
  handleTweetsUpdated,
  getImageStats,
} = useArticleProcessor()

// Computed para estadísticas de imágenes
const imageStats = computed(() => {
  return getImageStats()
})

// Watch for URL changes
watch(
  () => route.query.url,
  (newUrl, oldUrl) => {
    if (newUrl && newUrl !== oldUrl) {
      logger.info('URL cambiada, recargando contenido', {
        context: 'SummaryView',
        data: { oldUrl: oldUrl ? 'present' : 'none', newUrl: 'present' },
      })
      loadArticle()
    }
  },
)

// Cargar automáticamente al montar el componente
onMounted(() => {
  logger.info('Componente SummaryView montado', {
    context: 'SummaryView',
  })

  if (route.query.url) {
    loadArticle()
  } else {
    logger.warn('No URL found in route parameters', {
      context: 'SummaryView',
      data: { queryParams: route.query },
    })
  }
})

// Log cuando el componente se desmonta
onUnmounted(() => {
  logger.info('Componente SummaryView desmontado', {
    context: 'SummaryView',
    data: {
      processed: tweets.value.length > 0,
      finalTweetCount: tweets.value.length,
      hadError: !!errorMessage.value,
      imagesProcessed: articleImages.value.length,
    },
  })
})
</script>
