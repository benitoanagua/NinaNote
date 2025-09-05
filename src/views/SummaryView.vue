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

      <ThreadPreview
        v-if="!errorMessage && tweets.length > 0"
        :tweets="tweets"
        :original-content="articleContent"
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

      <TwitterPublish v-if="!errorMessage && tweets.length > 0" :tweets="tweets" class="mt-8" />

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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGoogleGenAI } from '@/composables/useGoogleGenAI'
import { useScraper } from '@/composables/useScraper'
import ThreadPreview from '@/components/ThreadPreview.vue'
import TwitterPublish from '@/components/TwitterPublish.vue'
import type { ThreadTweet } from '@/core/types'
import { logger, handleError, translateError } from '@/utils/logger'

const route = useRoute()
const { scrapeContent } = useScraper()
const { generateThread, isGenerating: isAIGenerating } = useGoogleGenAI()

const tweets = ref<ThreadTweet[]>([])
const articleContent = ref('')
const articleImages = ref<string[]>([])
const errorMessage = ref<string>('')
const isLoading = ref(false)

const decodedUrl = computed(() => {
  return route.query.url ? decodeURIComponent(route.query.url as string) : ''
})

// Estadísticas del proceso para logging
const processStats = computed(() => ({
  hasUrl: !!route.query.url,
  urlLength: decodedUrl.value.length,
  tweetCount: tweets.value.length,
  contentLength: articleContent.value.length,
  imageCount: articleImages.value.length,
  hasError: !!errorMessage.value,
}))

const loadArticle = async () => {
  errorMessage.value = ''
  isLoading.value = true

  logger.info('Iniciando carga de artículo', {
    context: 'SummaryView',
    data: { hasUrl: !!route.query.url },
  })

  if (!route.query.url) {
    errorMessage.value = 'No se proporcionó URL para procesar'
    logger.warn('No URL provided in route query', {
      context: 'SummaryView',
      data: { queryParams: route.query },
    })
    isLoading.value = false
    return
  }

  try {
    const url = decodeURIComponent(route.query.url as string)
    logger.info('Iniciando procesamiento de artículo', {
      context: 'SummaryView',
      data: { url: url.substring(0, 50) + (url.length > 50 ? '...' : '') },
    })

    // 1. Scraping del contenido
    logger.info('Iniciando scraping de contenido', {
      context: 'SummaryView',
      data: { url: url.substring(0, 30) + '...' },
    })

    const contentResult = await scrapeContent(url)
    articleContent.value = contentResult.content
    articleImages.value = contentResult.images || []

    logger.success('Contenido extraído exitosamente', {
      context: 'SummaryView',
      data: {
        contentLength: contentResult.content.length,
        title:
          contentResult.title.substring(0, 30) + (contentResult.title.length > 30 ? '...' : ''),
        imageCount: contentResult.images?.length || 0,
        hasAuthor: !!contentResult.author,
        hasExcerpt: !!contentResult.excerpt,
      },
    })

    // Validar longitud mínima de contenido
    if (contentResult.content.length < 300) {
      const errorMsg = `Contenido insuficiente (${contentResult.content.length} caracteres). Mínimo 300 requeridos.`
      logger.warn('Contenido demasiado corto para generar hilo', {
        context: 'SummaryView',
        data: {
          contentLength: contentResult.content.length,
          minRequired: 300,
        },
      })
      throw new Error(errorMsg)
    }

    // 2. Generar hilo con Google IA
    logger.info('Iniciando generación de hilo con IA', {
      context: 'SummaryView',
      data: {
        contentLength: contentResult.content.length,
        imageCount: articleImages.value.length,
      },
    })

    const generatedTweets = await generateThread(contentResult.content, articleImages.value)
    tweets.value = generatedTweets

    logger.success('Hilo de Twitter generado exitosamente', {
      context: 'SummaryView',
      data: {
        tweetCount: generatedTweets.length,
        totalCharacters: generatedTweets.reduce((sum, t) => sum + t.charCount, 0),
        avgTweetLength: Math.round(
          generatedTweets.reduce((sum, t) => sum + t.charCount, 0) / generatedTweets.length,
        ),
        imagesUsed: generatedTweets.filter((t) => t.imageUrl).length,
        longTweets: generatedTweets.filter((t) => t.charCount > 280).length,
      },
    })

    // Guardar estadísticas finales
    logger.info('Procesamiento completado exitosamente', {
      context: 'SummaryView',
      data: processStats.value,
    })
  } catch (error) {
    console.error('❌ Error processing article:', error)
    const appError = handleError(error, 'SummaryView')
    errorMessage.value = translateError(appError)

    logger.error('Error en el procesamiento del artículo', {
      context: 'SummaryView',
      data: {
        error: appError.message,
        originalError: error instanceof Error ? error.message : 'Unknown error',
        url: decodedUrl.value.substring(0, 30) + '...',
        ...processStats.value,
      },
    })
  } finally {
    isLoading.value = false
  }
}

const retry = () => {
  logger.info('Reintentando procesamiento de artículo', {
    context: 'SummaryView',
    data: { previousError: errorMessage.value },
  })
  loadArticle()
}

const handleTweetsUpdated = (updatedTweets: ThreadTweet[]) => {
  tweets.value = updatedTweets
  logger.info('Tweets actualizados por el usuario', {
    context: 'SummaryView',
    data: {
      tweetCount: updatedTweets.length,
      longTweets: updatedTweets.filter((t) => t.charCount > 280).length,
      totalCharacters: updatedTweets.reduce((sum, t) => sum + t.charCount, 0),
      imagesUsed: updatedTweets.filter((t) => t.imageUrl).length,
    },
  })
}

// Watch for URL changes
watch(
  () => route.query.url,
  (newUrl, oldUrl) => {
    if (newUrl && newUrl !== oldUrl) {
      logger.info('URL cambiada, recargando contenido', {
        context: 'SummaryView',
        data: {
          oldUrl: oldUrl ? 'present' : 'none',
          newUrl: 'present',
        },
      })
      loadArticle()
    }
  },
)

// Cargar automáticamente al montar el componente
onMounted(() => {
  logger.info('Componente SummaryView montado', {
    context: 'SummaryView',
    data: processStats.value,
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
      contentLength: articleContent.value.length,
    },
  })
})
</script>
