import { useSessionStore } from '@/stores/session'
import { logger } from '@/utils/logger'
import type { ThreadTweet } from '@/core/types'

export const useThreadHistory = () => {
  const sessionStore = useSessionStore()

  const saveThreadToHistory = async (
    url: string,
    title: string,
    tweets: ThreadTweet[],
  ): Promise<boolean> => {
    try {
      logger.info('Saving thread to history', {
        context: 'ThreadHistory',
        data: {
          url: url.substring(0, 30) + (url.length > 30 ? '...' : ''),
          title,
          tweetCount: tweets.length,
        },
      })

      // Validar que tengamos datos necesarios
      if (!url || !title || !tweets || tweets.length === 0) {
        logger.warn('Cannot save thread: missing required data', {
          context: 'ThreadHistory',
          data: { hasUrl: !!url, hasTitle: !!title, hasTweets: tweets?.length > 0 },
        })
        return false
      }

      // Validar que los tweets tengan contenido
      const invalidTweets = tweets.filter((t) => !t.content || t.content.trim().length === 0)
      if (invalidTweets.length > 0) {
        logger.warn('Some tweets are empty, filtering them out', {
          context: 'ThreadHistory',
          data: { invalidTweetCount: invalidTweets.length },
        })
      }

      // Filtrar tweets vacíos
      const validTweets = tweets.filter((t) => t.content && t.content.trim().length > 0)

      if (validTweets.length === 0) {
        logger.error('Cannot save thread: no valid tweets', {
          context: 'ThreadHistory',
        })
        return false
      }

      // Guardar en el store
      sessionStore.saveThread({
        url,
        title,
        tweets: validTweets,
      })

      logger.success('Thread successfully saved to history', {
        context: 'ThreadHistory',
        data: {
          tweetCount: validTweets.length,
          title,
          totalThreads: sessionStore.savedThreads.length,
        },
      })

      return true
    } catch (error) {
      logger.error('Failed to save thread to history', {
        context: 'ThreadHistory',
        data: error,
      })
      return false
    }
  }

  const getThreadHistory = () => {
    return sessionStore.savedThreads
  }

  const clearThreadHistory = (): number => {
    const count = sessionStore.savedThreads.length
    sessionStore.savedThreads = []

    if (typeof window !== 'undefined') {
      localStorage.removeItem('nina-note-threads')
    }

    logger.info('Thread history cleared', {
      context: 'ThreadHistory',
      data: { clearedCount: count },
    })

    return count
  }

  const getThreadById = (threadId: string) => {
    return sessionStore.savedThreads.find((thread) => thread.id === threadId)
  }

  const getRecentThreads = (limit: number = 10) => {
    return sessionStore.savedThreads.slice(0, limit)
  }

  return {
    saveThreadToHistory,
    getThreadHistory,
    clearThreadHistory,
    getThreadById,
    getRecentThreads,
    hasThreads: () => sessionStore.savedThreads.length > 0,
    threadCount: () => sessionStore.savedThreads.length,
  }
}
