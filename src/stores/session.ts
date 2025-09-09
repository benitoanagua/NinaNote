import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SavedThread, ThreadTweet } from '@/core/types'
import { logger } from '@/utils/logger'

// Clave para el almacenamiento diario
const getDailyStorageKey = (): string => {
  const today = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
  return `nina-note-daily-${today}`
}

export const useSessionStore = defineStore('session', () => {
  // Estado
  const lastProcessedUrl = ref<string>('')
  const savedThreads = ref<SavedThread[]>([])
  const dailyGenerationLimit = ref<number>(5) // Límite de GENERACIÓN por día
  const maxSavedThreads = ref<number>(20) // Límite de ALMACENAMIENTO (puede ser mayor)
  const threadsGeneratedToday = ref<number>(0)
  const canGenerateMore = ref<boolean>(true)

  // Computed
  const remainingThreads = computed(() =>
    Math.max(0, dailyGenerationLimit.value - threadsGeneratedToday.value),
  )
  const hasReachedGenerationLimit = computed(
    () => threadsGeneratedToday.value >= dailyGenerationLimit.value,
  )

  // Inicializar contador diario
  const initializeDailyCounter = () => {
    if (typeof window === 'undefined') return

    const dailyKey = getDailyStorageKey()
    const stored = localStorage.getItem(dailyKey)

    if (stored) {
      try {
        const data = JSON.parse(stored)
        threadsGeneratedToday.value = data.count || 0
        canGenerateMore.value = data.canGenerateMore !== false
      } catch (e) {
        logger.warn('Error parsing daily counter data', {
          context: 'SessionStore',
          data: e,
        })
        threadsGeneratedToday.value = 0
        canGenerateMore.value = true
      }
    } else {
      // Nuevo día, resetear contador
      threadsGeneratedToday.value = 0
      canGenerateMore.value = true
      saveDailyCounter()
    }

    logger.info('Daily counter initialized', {
      context: 'SessionStore',
      data: {
        generatedToday: threadsGeneratedToday.value,
        remaining: remainingThreads.value,
        hasReachedLimit: hasReachedGenerationLimit.value,
      },
    })
  }

  // Guardar contador diario
  const saveDailyCounter = () => {
    if (typeof window === 'undefined') return

    const dailyKey = getDailyStorageKey()
    const data = {
      count: threadsGeneratedToday.value,
      canGenerateMore: canGenerateMore.value,
      timestamp: new Date().toISOString(),
    }

    try {
      localStorage.setItem(dailyKey, JSON.stringify(data))
    } catch (error) {
      logger.error('Failed to save daily counter', {
        context: 'SessionStore',
        data: error,
      })
    }
  }

  const setLastProcessedUrl = (url: string) => {
    lastProcessedUrl.value = url
    logger.debug('Last processed URL set', {
      context: 'SessionStore',
      data: { url: url.substring(0, 50) + (url.length > 50 ? '...' : '') },
    })
  }

  const incrementDailyCounter = (): boolean => {
    if (hasReachedGenerationLimit.value) {
      canGenerateMore.value = false
      saveDailyCounter()
      return false
    }

    threadsGeneratedToday.value += 1
    saveDailyCounter()

    logger.info('Daily counter incremented', {
      context: 'SessionStore',
      data: {
        newCount: threadsGeneratedToday.value,
        remaining: remainingThreads.value,
      },
    })

    return true
  }

  const saveThread = (thread: { url: string; title: string; tweets: ThreadTweet[] }): boolean => {
    // Verificar límite diario de GENERACIÓN
    if (hasReachedGenerationLimit.value) {
      logger.warn('Daily generation limit reached, cannot save thread', {
        context: 'SessionStore',
        data: {
          currentCount: threadsGeneratedToday.value,
          limit: dailyGenerationLimit.value,
        },
      })
      return false
    }

    // Incrementar contador de GENERACIÓN
    if (!incrementDailyCounter()) {
      return false
    }

    const savedThread: SavedThread = {
      id: Date.now().toString(),
      ...thread,
      createdAt: new Date().toISOString(),
    }

    // Agregar al inicio del array
    savedThreads.value.unshift(savedThread)

    // Mantener solo el límite de ALMACENAMIENTO (no de generación)
    if (savedThreads.value.length > maxSavedThreads.value) {
      const removedThread = savedThreads.value.pop()
      logger.debug(`Removed oldest thread due to storage limit`, {
        context: 'SessionStore',
        data: {
          removedThreadId: removedThread?.id,
          storageLimit: maxSavedThreads.value,
        },
      })
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
            dailyCount: threadsGeneratedToday.value,
            remainingDaily: remainingThreads.value,
            storageLimit: maxSavedThreads.value,
          },
        })
      } catch (error) {
        logger.error('Failed to save thread to localStorage', {
          context: 'SessionStore',
          data: error,
        })
      }
    }

    return true
  }

  const loadSavedThreads = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nina-note-threads')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Asegurarnos de que sea un array válido
          if (Array.isArray(parsed)) {
            savedThreads.value = parsed.slice(0, maxSavedThreads.value) // Aplicar límite de almacenamiento
            logger.success('Threads loaded from localStorage', {
              context: 'SessionStore',
              data: {
                threadCount: parsed.length,
                loadedCount: savedThreads.value.length,
                storageLimit: maxSavedThreads.value,
              },
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
        lastProcessedUrl: lastProcessedUrl.value,
        savedThreadsCount: savedThreads.value.length,
        dailyGenerationLimit: dailyGenerationLimit.value,
        maxSavedThreads: maxSavedThreads.value,
        threadsGeneratedToday: threadsGeneratedToday.value,
        remainingThreads: remainingThreads.value,
        hasReachedGenerationLimit: hasReachedGenerationLimit.value,
        canGenerateMore: canGenerateMore.value,
        savedThreads: savedThreads.value.map((t) => ({
          id: t.id,
          title: t.title,
          tweetCount: t.tweets.length,
          createdAt: t.createdAt,
        })),
      },
    })
  }

  // Inicializar al crear el store
  initializeDailyCounter()

  return {
    lastProcessedUrl,
    savedThreads,
    dailyGenerationLimit,
    maxSavedThreads,
    threadsGeneratedToday,
    remainingThreads,
    hasReachedGenerationLimit,
    canGenerateMore,

    setLastProcessedUrl,
    saveThread,
    loadSavedThreads,
    deleteThread,
    incrementDailyCounter,
    initializeDailyCounter,
    logStoreState,
  }
})
