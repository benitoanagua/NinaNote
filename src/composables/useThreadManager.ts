import { ref, watch } from 'vue'
import { useGoogleGenAI } from './useGoogleGenAI'
import { useImageManager } from './useImageManager'
import type { ThreadTweet } from '@/core/types'
import { logger } from '@/utils/logger'

export const useThreadManager = (originalContent: string, initialTweets: ThreadTweet[]) => {
  const { regenerateTweet: regenerateSingleTweet, generateThread, isGenerating } = useGoogleGenAI()
  const { handleTweetImageError, getImageStats } = useImageManager()

  const tweets = ref<ThreadTweet[]>([...initialTweets])
  const isRegenerating = ref(false)
  const regeneratingIndex = ref<number | null>(null)
  const editingIndex = ref<number | null>(null)
  const editingContent = ref('')
  const aiAvailable = ref(false)

  const regenerateAll = async () => {
    isRegenerating.value = true
    logger.info('Iniciando regeneración completa del hilo', { context: 'ThreadManager' })

    try {
      const newTweets = await generateThread(originalContent, [])
      tweets.value = newTweets

      logger.success('Hilo regenerado exitosamente', {
        context: 'ThreadManager',
        data: { tweetCount: newTweets.length },
      })

      return newTweets
    } catch (error) {
      logger.error('Error al regenerar el hilo', {
        context: 'ThreadManager',
        data: error,
      })
      throw error
    } finally {
      isRegenerating.value = false
    }
  }

  const regenerateSingle = async (index: number) => {
    regeneratingIndex.value = index
    logger.info(`Regenerando tweet ${index + 1}`, { context: 'ThreadManager' })

    try {
      const newContent = await regenerateSingleTweet(originalContent, index)
      const updatedTweets = [...tweets.value]
      updatedTweets[index] = {
        ...updatedTweets[index],
        content: newContent,
        charCount: newContent.length,
      }

      tweets.value = updatedTweets

      logger.success(`Tweet ${index + 1} regenerado`, {
        context: 'ThreadManager',
        data: { newLength: newContent.length },
      })

      return newContent
    } catch (error) {
      logger.error(`Error regenerando tweet ${index + 1}`, {
        context: 'ThreadManager',
        data: error,
      })
      throw error
    } finally {
      regeneratingIndex.value = null
    }
  }

  const startEdit = (index: number) => {
    editingIndex.value = index
    editingContent.value = tweets.value[index].content
    logger.info(`Editando tweet ${index + 1}`, { context: 'ThreadManager' })
  }

  const cancelEdit = () => {
    editingIndex.value = null
    editingContent.value = ''
    logger.info('Edición cancelada', { context: 'ThreadManager' })
  }

  const saveEdit = (index: number) => {
    const updatedTweets = [...tweets.value]
    updatedTweets[index] = {
      ...updatedTweets[index],
      content: editingContent.value,
      charCount: editingContent.value.length,
    }

    tweets.value = updatedTweets

    logger.info(`Tweet ${index + 1} guardado`, {
      context: 'ThreadManager',
      data: { newLength: editingContent.value.length },
    })

    cancelEdit()
  }

  const handleImageError = async (tweet: ThreadTweet, index: number) => {
    logger.warn(`Error loading image for tweet ${index + 1}`, {
      context: 'ThreadManager',
      data: { imageUrl: tweet.imageUrl },
    })

    try {
      const updatedTweets = await handleTweetImageError(tweet, index, tweets.value)
      tweets.value = updatedTweets
      logger.info(`Imagen regenerada para tweet ${index + 1}`, { context: 'ThreadManager' })
    } catch (error) {
      logger.error('Error en manejo de imagen', {
        context: 'ThreadManager',
        data: error,
      })
    }
  }

  const getThreadSizeLabel = () => {
    const count = tweets.value.length
    if (count <= 3) return 'Hilo corto'
    if (count === 4) return 'Hilo medio'
    return 'Hilo extenso'
  }

  const getTweetStats = () => {
    const longTweets = tweets.value.filter((t) => t.charCount > 280)
    const totalChars = tweets.value.reduce((sum, t) => sum + t.charCount, 0)
    const imageStats = getImageStats(tweets.value)

    return {
      longTweets: longTweets.length,
      totalChars,
      ...imageStats,
      averageLength: Math.round(totalChars / tweets.value.length),
    }
  }

  const initialize = async () => {
    if (tweets.value.length > 0) {
      const stats = getTweetStats()
      logger.success(`Hilo gestionado con ${tweets.value.length} tweets`, {
        context: 'ThreadManager',
        data: stats,
      })
    }
  }

  initialize()

  return {
    // Estado
    tweets,
    isRegenerating,
    regeneratingIndex,
    editingIndex,
    editingContent,
    isGenerating,
    aiAvailable,

    // Métodos
    regenerateAll,
    regenerateSingle,
    startEdit,
    cancelEdit,
    saveEdit,
    handleImageError,
    getThreadSizeLabel,
    getTweetStats,
  }
}
