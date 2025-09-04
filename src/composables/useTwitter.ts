import { ref } from 'vue'
import { twitterService } from '@/core/twitter/TwitterService'
import type { ThreadTweet } from '@/core/types'

export const useTwitter = () => {
  const isPosting = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  const postThread = async (
    tweets: ThreadTweet[],
    config: { bearerToken: string },
  ): Promise<void> => {
    isPosting.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await twitterService.publishThread(tweets, config)

      if (result.success) {
        successMessage.value = `¡Hilo publicado exitosamente! ${tweets.length} tweets fueron publicados en tu cuenta de Twitter.`
      } else {
        throw new Error(result.error || 'Error desconocido al publicar el hilo')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido al publicar el hilo'
      throw error.value
    } finally {
      isPosting.value = false
    }
  }

  const copyThreadToClipboard = async (tweets: ThreadTweet[]): Promise<void> => {
    try {
      const success = await twitterService.copyToClipboard(tweets)

      if (success) {
        successMessage.value =
          'Hilo copiado al portapapeles. Puedes pegarlo manualmente en Twitter.'
      } else {
        throw new Error('Error al copiar al portapapeles')
      }
    } catch (err) {
      error.value = 'Error al copiar al portapapeles'
      throw error.value
    }
  }

  const validateToken = (token: string): boolean => {
    return twitterService.validateToken(token)
  }

  const clearMessages = () => {
    error.value = null
    successMessage.value = null
  }

  return {
    postThread,
    copyThreadToClipboard,
    validateToken,
    clearMessages,
    isPosting,
    error,
    successMessage,
  }
}
