import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGoogleGenAI } from './useGoogleGenAI'
import { useScraper } from './useScraper'
import { useThreadHistory } from './useThreadHistory'
import type { ThreadTweet } from '@/core/types'
import { logger, handleError, translateError } from '@/utils/logger'
import { isValidImageUrl, logImageDetails, getImageAssignmentStats } from '@/utils/imageUtils'

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
    hasImages: articleImages.value.length > 0,
  }))

  // Log de imágenes cuando cambian
  watch(articleImages, (newImages) => {
    if (newImages.length > 0) {
      logImageDetails(newImages, 'ArticleProcessor')

      // Log más detallado para debugging
      logger.debug('Detalles completos de imágenes scrapeadas', {
        context: 'ArticleProcessor',
        data: {
          images: newImages.map((img, idx) => ({
            index: idx,
            url: img.substring(0, 50) + (img.length > 50 ? '...' : ''),
            length: img.length,
            valid: isValidImageUrl(img),
          })),
          mainImage: newImages[0] || 'No disponible',
          validImages: newImages.filter((img) => isValidImageUrl(img)).length,
        },
      })
    } else {
      logger.info('No se encontraron imágenes en el artículo', {
        context: 'ArticleProcessor',
      })
    }
  })

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

    // Log detallado de imágenes
    if (contentResult.images && contentResult.images.length > 0) {
      logger.info('Resumen de imágenes del artículo', {
        context: 'ArticleProcessor',
        data: {
          totalImages: contentResult.images.length,
          validImages: contentResult.images.filter((img) => isValidImageUrl(img)).length,
          imageSample: contentResult.images
            .slice(0, 3)
            .map((img) => img.substring(0, 40) + (img.length > 40 ? '...' : '')),
        },
      })
    }

    // 2. Generar hilo con IA
    const generatedTweets = await generateThread(contentResult.content)

    // 3. Asignar imágenes scrapeadas a los tweets de manera inteligente
    const tweetsWithImages = assignImagesToTweets(generatedTweets, articleImages.value)

    tweets.value = tweetsWithImages

    // Log de asignación de imágenes
    const imageStats = getImageAssignmentStats(tweetsWithImages, articleImages.value)
    logger.info('Asignación de imágenes completada', {
      context: 'ArticleProcessor',
      data: imageStats,
    })

    // 4. Guardar en historial
    await saveToHistory(url, contentResult.title, tweetsWithImages)
  }

  const assignImagesToTweets = (tweets: ThreadTweet[], images: string[]): ThreadTweet[] => {
    const validImages = images.filter((img) => isValidImageUrl(img))

    if (validImages.length === 0) {
      logger.info('No hay imágenes válidas para asignar a los tweets', {
        context: 'ArticleProcessor',
      })
      return tweets.map((tweet) => ({ ...tweet, imageUrl: '' }))
    }

    logger.info(`Asignando ${validImages.length} imágenes a ${tweets.length} tweets`, {
      context: 'ArticleProcessor',
    })

    // Estrategia inteligente de asignación - distribuir imágenes equitativamente
    return tweets.map((tweet, index) => {
      // Asignar imagen basado en la posición del tweet (round-robin)
      const imageIndex = index % validImages.length
      const imageUrl = validImages[imageIndex] || ''

      return {
        ...tweet,
        imageUrl,
      }
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
          imagesInThread: tweets.filter((t) => t.imageUrl).length,
          totalImages: articleImages.value.length,
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

    const imageStats = getImageAssignmentStats(updatedTweets, articleImages.value)
    logger.info('Tweets actualizados por el usuario', {
      context: 'ArticleProcessor',
      data: {
        tweetCount: updatedTweets.length,
        longTweets: updatedTweets.filter((t) => t.charCount > 280).length,
        ...imageStats,
      },
    })
  }

  const reset = () => {
    tweets.value = []
    articleContent.value = ''
    articleImages.value = []
    errorMessage.value = ''
    isLoading.value = false

    logger.info('ArticleProcessor reset', { context: 'ArticleProcessor' })
  }

  // Función para obtener estadísticas detalladas de imágenes
  const getImageStats = () => {
    return getImageAssignmentStats(tweets.value, articleImages.value)
  }

  // Función para reasignar imágenes a los tweets
  const reassignImages = (newImages: string[]) => {
    articleImages.value = newImages
    const updatedTweets = assignImagesToTweets(tweets.value, newImages)
    tweets.value = updatedTweets

    const imageStats = getImageAssignmentStats(updatedTweets, newImages)
    logger.info('Imágenes reasignadas a los tweets', {
      context: 'ArticleProcessor',
      data: imageStats,
    })
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
    getImageStats,
    reassignImages,
  }
}
