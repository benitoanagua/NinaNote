import { ref } from 'vue'
import { aiService } from '@/core/ai/AIService'
import type { ThreadTweet } from '@/core/types'

export const useLLM = () => {
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  const generateThread = async (text: string, images: string[] = []): Promise<ThreadTweet[]> => {
    isGenerating.value = true
    error.value = null

    try {
      return await aiService.generateThread(text, images)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al generar el hilo'
      throw error.value
    } finally {
      isGenerating.value = false
    }
  }

  const regenerateTweet = async (originalText: string, tweetIndex: number): Promise<string> => {
    try {
      return await aiService.regenerateTweet(originalText, tweetIndex)
    } catch (err) {
      throw new Error('Error al regenerar el tweet')
    }
  }

  const getAvailableModels = async () => {
    return await aiService.getAvailableModels()
  }

  const checkPuterAvailability = async (): Promise<boolean> => {
    return await aiService.checkAvailability()
  }

  return {
    generateThread,
    regenerateTweet,
    getAvailableModels,
    checkPuterAvailability,
    isGenerating,
    error,
  }
}
