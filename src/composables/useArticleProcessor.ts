import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGoogleGenAI } from './useGoogleGenAI'
import { useScraper } from './useScraper'
import { useThreadHistory } from './useThreadHistory'
import type { ThreadTweet } from '@/core/types'
import { logger, handleError, translateError } from '@/utils/logger'

export const useArticleProcessor = () => {
  const route = useRoute()
  const { scrapeContent } = useScraper()
  const { generateThread, isGenerating: isAIGenerating } = useGoogleGenAI()
  const { saveThreadToHistory } = useThreadHistory()

  // Estado reactivo
  const tweets = ref<ThreadTweet[]>([])
  const articleContent = ref('')
  const articleImages = ref<string[]>([])
  const errorMessage = ref<string>('')
  const isLoading = ref(false)

  // Computed
  const decodedUrl = computed(() => {
    return route.query.url ? decodeURIComponent(route.query.url as string) : ''
  })

  const processStats = computed(() => ({
    hasUrl: !!route.query.url,
    urlLength: decodedUrl.value.length,
    tweetCount: tweets.value.length,
    contentLength: articleContent.value.length,
    imageCount: articleImages.value.length,
    hasError: !!errorMessage.value,
  }))

  // Métodos
  const loadArticle = async () => {
    errorMessage.value = ''
    isLoading.value = true

    logger.info('Iniciando carga de artículo', {
      context: 'ArticleProcessor',
      data: { hasUrl: !!route.query.url },
    })

    if (!route.query.url) {
      errorMessage.value = 'No se proporcionó URL para procesar'
      logger.warn('No URL provided in route query', {
        context: 'ArticleProcessor',
        data: { queryParams: route.query },
      })
      isLoading.value = false
      return
    }

    try {
      const url = decodeURIComponent(route.query.url as string)
      await processArticle(url)
    } catch (error) {
      handleProcessError(error)
    } finally {
      isLoading.value = false
    }
  }

  const processArticle = async (url: string) => {
    logger.info('Iniciando procesamiento de artículo', {
      context: 'ArticleProcessor',
      data: { url: url.substring(0, 50) + (url.length > 50 ? '...' : '') },
    })

    // 1. Scraping del contenido
    const contentResult = await scrapeContent(url)
    articleContent.value = contentResult.content
    articleImages.value = contentResult.images || []

    logger.success('Contenido extraído exitosamente', {
      context: 'ArticleProcessor',
      data: {
        contentLength: contentResult.content.length,
        title:
          contentResult.title.substring(0, 30) + (contentResult.title.length > 30 ? '...' : ''),
        imageCount: contentResult.images?.length || 0,
        imagesSample:
          contentResult.images?.slice(0, 3).map((img) => img.substring(0, 30) + '...') || [],
      },
    })

    // Validar longitud mínima
    validateContentLength(contentResult.content.length)

    // 2. Generar hilo con IA - ¡PASAR LAS IMÁGENES SCRAPEADAS!
    const generatedTweets = await generateThread(contentResult.content, articleImages.value)
    tweets.value = generatedTweets

    logger.success('Hilo de Twitter generado exitosamente', {
      context: 'ArticleProcessor',
      data: {
        tweetCount: generatedTweets.length,
        totalCharacters: generatedTweets.reduce((sum, t) => sum + t.charCount, 0),
        tweetsWithImages: generatedTweets.filter((t) => t.imageUrl).length,
      },
    })

    // 3. Guardar en historial
    await saveToHistory(url, contentResult.title, generatedTweets)

    logger.info('Procesamiento completado exitosamente', {
      context: 'ArticleProcessor',
      data: processStats.value,
    })
  }

  const validateContentLength = (contentLength: number) => {
    if (contentLength < 300) {
      const errorMsg = `Contenido insuficiente (${contentLength} caracteres). Mínimo 300 requeridos.`
      logger.warn('Contenido demasiado corto para generar hilo', {
        context: 'ArticleProcessor',
        data: { contentLength, minRequired: 300 },
      })
      throw new Error(errorMsg)
    }
  }

  const saveToHistory = async (url: string, title: string, tweets: ThreadTweet[]) => {
    const success = await saveThreadToHistory(url, title || 'Untitled Article', tweets)

    if (success) {
      logger.info('Hilo guardado exitosamente en el historial', {
        context: 'ArticleProcessor',
        data: {
          tweetCount: tweets.length,
          title: title.substring(0, 20) + (title.length > 20 ? '...' : ''),
        },
      })
    } else {
      logger.warn('El hilo no se pudo guardar en el historial', {
        context: 'ArticleProcessor',
      })
    }
  }

  const handleProcessError = (error: unknown) => {
    const appError = handleError(error, 'ArticleProcessor')
    errorMessage.value = translateError(appError)

    logger.error('Error en el procesamiento del artículo', {
      context: 'ArticleProcessor',
      data: {
        error: appError.message,
        url: decodedUrl.value.substring(0, 30) + '...',
        ...processStats.value,
      },
    })
  }

  const retry = () => {
    logger.info('Reintentando procesamiento de artículo', {
      context: 'ArticleProcessor',
      data: { previousError: errorMessage.value },
    })
    loadArticle()
  }

  const handleTweetsUpdated = (updatedTweets: ThreadTweet[]) => {
    tweets.value = updatedTweets
    logger.info('Tweets actualizados por el usuario', {
      context: 'ArticleProcessor',
      data: {
        tweetCount: updatedTweets.length,
        longTweets: updatedTweets.filter((t) => t.charCount > 280).length,
      },
    })
  }

  const reset = () => {
    tweets.value = []
    articleContent.value = ''
    articleImages.value = []
    errorMessage.value = ''
    isLoading.value = false
  }

  return {
    // Estado
    tweets,
    articleContent,
    articleImages,
    errorMessage,
    isLoading,

    // Computed
    decodedUrl,
    processStats,

    // Métodos
    loadArticle,
    retry,
    handleTweetsUpdated,
    reset,
  }
}
