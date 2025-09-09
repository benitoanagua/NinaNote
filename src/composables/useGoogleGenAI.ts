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

      const result = await googleGenAIService.generateThread(text)

      logger.success('Thread generation completed successfully', {
        context: 'useGoogleGenAI',
        data: {
          tweetCount: result.length,
          totalCharacters: result.reduce((sum, t) => sum + t.charCount, 0),
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
    clearError,
    resetState,
    isGenerating,
    error,
  }
}
