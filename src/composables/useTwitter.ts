import { ref } from 'vue'
import type { ThreadTweet } from './useLLM'

interface TwitterConfig {
  bearerToken: string
}

export const useTwitter = () => {
  const isPosting = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  const validateToken = (token: string): boolean => {
    // Validación básica del formato del token
    return token.length > 50 && token.startsWith('AAAA')
  }

  const postThread = async (tweets: ThreadTweet[], config: TwitterConfig): Promise<void> => {
    isPosting.value = true
    error.value = null
    successMessage.value = null

    try {
      if (!validateToken(config.bearerToken)) {
        throw new Error('Token inválido. Debe comenzar con "AAAA" y tener más de 50 caracteres.')
      }

      // En desarrollo, simulamos la publicación
      if (import.meta.env.DEV) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        successMessage.value = `¡Hilo publicado exitosamente! ${tweets.length} tweets fueron publicados en tu cuenta de Twitter.`
        return
      }

      // Publicar en Twitter API v2
      let parentTweetId = ''

      for (let i = 0; i < tweets.length; i++) {
        const tweet = tweets[i]

        const requestBody: any = {
          text: tweet.content,
        }

        // Si no es el primer tweet, añadir reply
        if (parentTweetId) {
          requestBody.reply = {
            in_reply_to_tweet_id: parentTweetId,
          }
        }

        const response = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.bearerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(
            `Error al publicar tweet ${i + 1}: ${errorData.detail || 'Error desconocido'}`,
          )
        }

        const data = await response.json()
        parentTweetId = data.data?.id

        // Pequeña pausa entre tweets para evitar rate limiting
        if (i < tweets.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      successMessage.value = `¡Hilo publicado exitosamente! ${tweets.length} tweets fueron publicados en tu cuenta de Twitter.`
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido al publicar el hilo'
      throw error.value
    } finally {
      isPosting.value = false
    }
  }

  const copyThreadToClipboard = async (tweets: ThreadTweet[]): Promise<void> => {
    try {
      const threadText = tweets
        .map((tweet, index) => `${index + 1}/${tweets.length}\n${tweet.content}`)
        .join('\n\n---\n\n')

      await navigator.clipboard.writeText(threadText)
      successMessage.value = 'Hilo copiado al portapapeles. Puedes pegarlo manualmente en Twitter.'
    } catch (err) {
      error.value = 'Error al copiar al portapapeles'
      throw error.value
    }
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
