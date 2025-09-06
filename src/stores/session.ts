import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SavedThread, ThreadTweet } from '@/core/types'
import { logger } from '@/utils/logger'

export const useSessionStore = defineStore('session', () => {
  // Estado
  const twitterToken = ref<string>('')
  const lastProcessedUrl = ref<string>('')
  const savedThreads = ref<SavedThread[]>([])

  // Getters
  const hasTwitterToken = () => twitterToken.value.length > 0
  const isValidToken = () => twitterToken.value.length > 50 && twitterToken.value.startsWith('AAAA')

  // Actions
  const setTwitterToken = (token: string) => {
    twitterToken.value = token.trim()
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nina-note-token', token.trim())
    }
    logger.info('Twitter token set', { context: 'SessionStore' })
  }

  const loadTwitterToken = () => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('nina-note-token')
      if (stored) {
        twitterToken.value = stored
        logger.info('Twitter token loaded from sessionStorage', {
          context: 'SessionStore',
          data: { tokenLength: stored.length },
        })
      } else {
        logger.info('No Twitter token found in sessionStorage', { context: 'SessionStore' })
      }
    }
  }

  const clearTwitterToken = () => {
    twitterToken.value = ''
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nina-note-token')
    }
    logger.info('Twitter token cleared', { context: 'SessionStore' })
  }

  const setLastProcessedUrl = (url: string) => {
    lastProcessedUrl.value = url
    logger.debug('Last processed URL set', {
      context: 'SessionStore',
      data: { url: url.substring(0, 50) + (url.length > 50 ? '...' : '') },
    })
  }

  const saveThread = (thread: { url: string; title: string; tweets: ThreadTweet[] }) => {
    const savedThread: SavedThread = {
      id: Date.now().toString(),
      ...thread,
      createdAt: new Date().toISOString(),
    }

    // Agregar al inicio del array
    savedThreads.value.unshift(savedThread)

    // Mantener solo los últimos 10 hilos
    if (savedThreads.value.length > 10) {
      const removedCount = savedThreads.value.length - 10
      savedThreads.value = savedThreads.value.slice(0, 10)
      logger.debug(`Removed ${removedCount} old threads due to limit`, { context: 'SessionStore' })
    }

    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nina-note-threads', JSON.stringify(savedThreads.value))
        logger.success('Thread saved to history', {
          context: 'SessionStore',
          data: {
            threadId: savedThread.id,
            title: savedThread.title,
            tweetCount: savedThread.tweets.length,
            totalThreads: savedThreads.value.length,
            url: savedThread.url.substring(0, 30) + (savedThread.url.length > 30 ? '...' : ''),
          },
        })
      } catch (error) {
        logger.error('Failed to save thread to localStorage', {
          context: 'SessionStore',
          data: error,
        })
      }
    }
  }

  const loadSavedThreads = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nina-note-threads')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Asegurarnos de que sea un array válido
          if (Array.isArray(parsed)) {
            savedThreads.value = parsed
            logger.success('Threads loaded from localStorage', {
              context: 'SessionStore',
              data: { threadCount: parsed.length },
            })
          } else {
            logger.warn('Invalid threads data in localStorage, resetting...', {
              context: 'SessionStore',
              data: { storedData: stored },
            })
            savedThreads.value = []
            localStorage.removeItem('nina-note-threads')
          }
        } catch (e) {
          logger.error('Error parsing saved threads from localStorage', {
            context: 'SessionStore',
            data: e,
          })
          // En caso de error, limpiar el localStorage
          savedThreads.value = []
          localStorage.removeItem('nina-note-threads')
        }
      } else {
        logger.info('No saved threads found in localStorage', { context: 'SessionStore' })
      }
    }
  }

  const deleteThread = (threadId: string) => {
    const initialLength = savedThreads.value.length
    const threadToDelete = savedThreads.value.find((t) => t.id === threadId)

    savedThreads.value = savedThreads.value.filter((t) => t.id !== threadId)

    if (typeof window !== 'undefined') {
      try {
        if (savedThreads.value.length === 0) {
          localStorage.removeItem('nina-note-threads')
          logger.info('Last thread deleted, localStorage cleared', { context: 'SessionStore' })
        } else {
          localStorage.setItem('nina-note-threads', JSON.stringify(savedThreads.value))
          logger.info('Thread deleted from history', {
            context: 'SessionStore',
            data: {
              threadId,
              title: threadToDelete?.title || 'Unknown',
              remainingThreads: savedThreads.value.length,
              initialThreads: initialLength,
            },
          })
        }
      } catch (error) {
        logger.error('Failed to update localStorage after deleting thread', {
          context: 'SessionStore',
          data: error,
        })
      }
    }
  }

  // Función para debuggear el estado actual usando logger
  const logStoreState = () => {
    logger.debug('Session store state', {
      context: 'SessionStore',
      data: {
        hasTwitterToken: hasTwitterToken(),
        twitterTokenLength: twitterToken.value.length,
        lastProcessedUrl: lastProcessedUrl.value,
        savedThreadsCount: savedThreads.value.length,
        savedThreads: savedThreads.value.map((t) => ({
          id: t.id,
          title: t.title,
          tweetCount: t.tweets.length,
          createdAt: t.createdAt,
        })),
      },
    })

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nina-note-threads')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          logger.debug('LocalStorage threads state', {
            context: 'SessionStore',
            data: {
              storedThreadsCount: Array.isArray(parsed) ? parsed.length : 'Invalid format',
              storedData: stored.substring(0, 200) + (stored.length > 200 ? '...' : ''),
            },
          })
        } catch (e) {
          logger.warn('Cannot parse localStorage data for debugging', {
            context: 'SessionStore',
            data: e,
          })
        }
      } else {
        logger.debug('No data found in localStorage for threads', { context: 'SessionStore' })
      }
    }
  }

  return {
    // Estado
    twitterToken,
    lastProcessedUrl,
    savedThreads,

    // Getters
    hasTwitterToken,
    isValidToken,

    // Actions
    setTwitterToken,
    loadTwitterToken,
    clearTwitterToken,
    setLastProcessedUrl,
    saveThread,
    loadSavedThreads,
    deleteThread,
    logStoreState,
  }
})
