import { ref } from 'vue'
import { googleGenAIService } from '@/core/ai/GoogleGenAIService'
import type { ThreadTweet } from '@/core/types'
import { logger, handleError, translateError } from '@/utils/logger'

export const useGoogleGenAI = () => {
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  const generateThread = async (text: string): Promise<ThreadTweet[]> => {
    isGenerating.value = true
    error.value = null

    logger.info('Starting thread generation process', {
      context: 'useGoogleGenAI',
      data: { textLength: text.length },
    })

    try {
      logger.debug('Calling Google Gemini API for thread generation', {
        context: 'useGoogleGenAI',
        data: { textPreview: text.substring(0, 100) + '...' },
      })

      // LLAMADA ACTUALIZADA: sin parámetro de imágenes
      const result = await googleGenAIService.generateThread(text)

      logger.success('Thread generation completed successfully', {
        context: 'useGoogleGenAI',
        data: {
          tweetCount: result.length,
          totalCharacters: result.reduce((sum, t) => sum + t.charCount, 0),
          // Nota: las imágenes ya no se generan automáticamente
        },
      })

      return result
    } catch (e: any) {
      const appError = handleError(e, 'useGoogleGenAI')
      error.value = translateError(appError)

      logger.error('Thread generation failed', {
        context: 'useGoogleGenAI',
        data: {
          error: appError.message,
          textLength: text.length,
          originalError: e,
        },
      })

      throw appError
    } finally {
      isGenerating.value = false
    }
  }

  const regenerateTweet = async (originalText: string, tweetIndex: number): Promise<string> => {
    logger.info('Regenerating single tweet', {
      context: 'useGoogleGenAI',
      data: { tweetIndex, textLength: originalText.length },
    })

    try {
      logger.debug('Calling Google Gemini API for tweet regeneration', {
        context: 'useGoogleGenAI',
        data: { tweetIndex, textPreview: originalText.substring(0, 50) + '...' },
      })

      const result = await googleGenAIService.regenerateTweet(originalText, tweetIndex)

      logger.success('Tweet regeneration completed', {
        context: 'useGoogleGenAI',
        data: {
          tweetIndex,
          newLength: result.length,
          originalLength: originalText.length,
        },
      })

      return result
    } catch (e: any) {
      const appError = handleError(e, 'useGoogleGenAI')

      logger.error('Tweet regeneration failed', {
        context: 'useGoogleGenAI',
        data: {
          error: appError.message,
          tweetIndex,
          originalError: e,
        },
      })

      throw appError
    }
  }

  const checkAvailability = async (): Promise<boolean> => {
    logger.info('Checking Google Gemini API availability', { context: 'useGoogleGenAI' })

    try {
      const isAvailable = await googleGenAIService.checkAvailability()

      if (isAvailable) {
        logger.success('Google Gemini API is available', { context: 'useGoogleGenAI' })
      } else {
        logger.warn('Google Gemini API is not available', { context: 'useGoogleGenAI' })
      }

      return isAvailable
    } catch (e: any) {
      const appError = handleError(e, 'useGoogleGenAI')

      logger.error('Failed to check API availability', {
        context: 'useGoogleGenAI',
        data: { error: appError.message },
      })

      return false
    }
  }

  const getAvailableModels = async () => {
    logger.info('Fetching available AI models', { context: 'useGoogleGenAI' })

    try {
      const models = await googleGenAIService.getAvailableModels()

      logger.success('Available models retrieved', {
        context: 'useGoogleGenAI',
        data: { modelCount: models.length },
      })

      return models
    } catch (e: any) {
      const appError = handleError(e, 'useGoogleGenAI')

      logger.error('Failed to get available models', {
        context: 'useGoogleGenAI',
        data: { error: appError.message },
      })

      throw appError
    }
  }

  const clearError = () => {
    if (error.value) {
      logger.info('Clearing previous error', {
        context: 'useGoogleGenAI',
        data: { previousError: error.value },
      })
    }
    error.value = null
  }

  const resetState = () => {
    clearError()
    isGenerating.value = false
    logger.info('Composable state reset', { context: 'useGoogleGenAI' })
  }

  return {
    generateThread,
    regenerateTweet,
    checkAvailability,
    getAvailableModels,
    clearError,
    resetState,
    isGenerating,
    error,
  }
}
