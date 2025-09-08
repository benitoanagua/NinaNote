import { ref } from 'vue'
import type { ThreadTweet } from '@/core/types'
import { logger } from '@/utils/logger'

export interface TwitterPublishStatus {
  isPublishing: boolean
  status: 'idle' | 'publishing' | 'success' | 'error'
  message: string
  publishedTweets: number[]
  lastTweetId: string
}

export const useTwitterPublisher = (tweets: ThreadTweet[]) => {
  const isPublishing = ref(false)
  const publishingStatus = ref<'idle' | 'publishing' | 'success' | 'error'>('idle')
  const statusMessage = ref('')
  const publishedTweets = ref<number[]>([])
  const lastTweetId = ref<string>('')

  const openTwitterComposer = (text: string) => {
    const encodedText = encodeURIComponent(text)
    const url = `https://twitter.com/intent/tweet?text=${encodedText}`

    window.open(
      url,
      '_blank',
      'width=550,height=420,menubar=no,toolbar=no,resizable=yes,scrollbars=yes',
    )
  }

  const publishSingleTweet = (index: number) => {
    if (index < 0 || index >= tweets.length) {
      logger.warn('Invalid tweet index', { context: 'TwitterPublisher', data: { index } })
      return
    }

    const tweet = tweets[index]

    // Para tweets que no son el primero, intentar incluir referencia al tweet anterior
    let tweetText = tweet.content
    if (index > 0 && lastTweetId.value) {
      tweetText += `\n\n(Continuación del hilo)`
    }

    openTwitterComposer(tweetText)
    publishedTweets.value.push(index)

    // Simular ID del tweet publicado (en producción usarías la API de Twitter)
    lastTweetId.value = `tweet-${Date.now()}-${index}`

    statusMessage.value = `Tweet ${index + 1} listo para publicar`
    publishingStatus.value = 'success'

    logger.info('Tweet ready for publication', {
      context: 'TwitterPublisher',
      data: { tweetIndex: index, charCount: tweet.charCount },
    })

    clearStatusAfterDelay()
  }

  const publishFullThread = () => {
    if (tweets.length === 0) {
      logger.warn('No tweets to publish', { context: 'TwitterPublisher' })
      return
    }

    isPublishing.value = true
    publishingStatus.value = 'publishing'
    statusMessage.value = 'Publicando hilo completo...'

    try {
      // Publicar el primer tweet
      const firstTweet = tweets[0]
      openTwitterComposer(firstTweet.content)
      publishedTweets.value.push(0)

      lastTweetId.value = `tweet-${Date.now()}-0`

      statusMessage.value = 'Primer tweet publicado. Continúa con los siguientes.'
      publishingStatus.value = 'success'

      logger.success('First tweet published', {
        context: 'TwitterPublisher',
        data: { tweetCount: tweets.length },
      })
    } catch (error) {
      logger.error('Error publishing thread', {
        context: 'TwitterPublisher',
        data: error,
      })
      statusMessage.value = 'Error al publicar el hilo'
      publishingStatus.value = 'error'
    } finally {
      isPublishing.value = false
      clearStatusAfterDelay()
    }
  }

  const copyToClipboard = async () => {
    if (tweets.length === 0) {
      logger.warn('No tweets to copy', { context: 'TwitterPublisher' })
      return
    }

    try {
      const threadText = tweets
        .map((tweet, index) => `${index + 1}/${tweets.length}\n${tweet.content}`)
        .join('\n\n---\n\n')

      await navigator.clipboard.writeText(threadText)
      statusMessage.value = 'Hilo copiado al portapapeles'
      publishingStatus.value = 'success'

      logger.info('Thread copied to clipboard', {
        context: 'TwitterPublisher',
        data: { tweetCount: tweets.length },
      })
    } catch (error) {
      logger.error('Error copying to clipboard', {
        context: 'TwitterPublisher',
        data: error,
      })
      statusMessage.value = 'Error al copiar al portapapeles'
      publishingStatus.value = 'error'
    } finally {
      clearStatusAfterDelay()
    }
  }

  const clearStatusAfterDelay = () => {
    setTimeout(() => {
      publishingStatus.value = 'idle'
      statusMessage.value = ''
    }, 5000)
  }

  const resetPublishingState = () => {
    isPublishing.value = false
    publishingStatus.value = 'idle'
    statusMessage.value = ''
    publishedTweets.value = []
    lastTweetId.value = ''
  }

  const getStatusClass = () => {
    switch (publishingStatus.value) {
      case 'publishing':
        return 'bg-primaryContainer/30 text-primary border border-primaryContainer'
      case 'success':
        return 'bg-successContainer/30 text-success border border-successContainer'
      case 'error':
        return 'bg-errorContainer/30 text-error border border-errorContainer'
      default:
        return ''
    }
  }

  return {
    // Estado
    isPublishing,
    publishingStatus,
    statusMessage,
    publishedTweets,
    lastTweetId,

    // Métodos
    publishSingleTweet,
    publishFullThread,
    copyToClipboard,
    resetPublishingState,
    getStatusClass,

    // Computed (si necesitas exponer más estado)
    hasPublishedTweets: () => publishedTweets.value.length > 0,
    allTweetsPublished: () => publishedTweets.value.length === tweets.length,
    nextTweetToPublish: () => {
      if (publishedTweets.value.length === 0) return 0
      const lastPublished = Math.max(...publishedTweets.value)
      return lastPublished + 1
    },
  }
}
