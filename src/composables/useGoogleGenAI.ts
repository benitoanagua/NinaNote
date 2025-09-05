import { ref } from 'vue'
import { googleGenAIService } from '@/core/ai/GoogleGenAIService'
import type { ThreadTweet } from '@/core/types'

export const useGoogleGenAI = () => {
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  const generateThread = async (text: string, images: string[] = []): Promise<ThreadTweet[]> => {
    isGenerating.value = true
    error.value = null
    try {
      return await googleGenAIService.generateThread(text, images)
    } catch (e: any) {
      error.value = e.message || 'Error generando hilo'
      throw error.value
    } finally {
      isGenerating.value = false
    }
  }

  const regenerateTweet = async (originalText: string, tweetIndex: number): Promise<string> => {
    try {
      return await googleGenAIService.regenerateTweet(originalText, tweetIndex)
    } catch (e: any) {
      throw new Error('Error regenerando tweet')
    }
  }

  const checkAvailability = async (): Promise<boolean> => {
    return await googleGenAIService.checkAvailability()
  }

  const getAvailableModels = async () => {
    return await googleGenAIService.getAvailableModels()
  }

  return {
    generateThread,
    regenerateTweet,
    checkAvailability,
    getAvailableModels,
    isGenerating,
    error,
  }
}
