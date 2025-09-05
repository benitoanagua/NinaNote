import { GoogleGenAI } from '@google/genai'
import type { AIModel, ThreadTweet } from '../types'
import { BaseService } from '../base/BaseService'
import { PROMPT_TEMPLATES, PromptEngine } from './PromptTemplate'
import { ImageGenerator } from '../utils/imageGenerator'

export class GoogleGenAIService extends BaseService {
  private ai: GoogleGenAI

  constructor(apiKey: string) {
    super('GoogleGenAI Service')
    this.ai = new GoogleGenAI({ apiKey })
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.ai.models.list({ config: { pageSize: 1 } })
      return true
    } catch {
      return false
    }
  }

  async getAvailableModels(): Promise<AIModel[]> {
    const models = await this.ai.models.list({ config: { pageSize: 20 } })
    const available: AIModel[] = []
    for await (const m of models) {
      available.push({
        id: m.name!,
        name: m.displayName || m.name!,
        provider: 'Google',
        available: true,
      })
    }
    return available
  }

  async generateThread(text: string, images: string[] = []): Promise<ThreadTweet[]> {
    this.logStart('Generating thread with Gemini')

    const textLength = text.length
    let tweetCount = 4

    if (textLength < 800) {
      tweetCount = 3
    } else if (textLength > 2000) {
      tweetCount = 5
    }

    const prompt = PromptEngine.compile(PROMPT_TEMPLATES.GENERATE_THREAD, {
      content: text,
      tweetCount,
    })

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { temperature: 0.8, maxOutputTokens: 1000 },
    })

    const raw = response.text ?? ''
    const tweetContents = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, tweetCount)

    const distributedImages = await this.distributeImages(images, tweetCount)

    const tweets = tweetContents.map((content, i) => ({
      id: `tweet-${Date.now()}-${i}`,
      content,
      charCount: content.length,
      imageUrl: distributedImages[i],
    }))

    this.logSuccess(`Generated ${tweets.length} tweets`)
    return tweets
  }

  private async distributeImages(availableImages: string[], tweetCount: number): Promise<string[]> {
    const distributedImages: string[] = []

    for (let i = 0; i < tweetCount; i++) {
      if (i < availableImages.length) {
        // Usar imagen real del artículo
        distributedImages.push(availableImages[i])
      } else if (availableImages.length > 0) {
        // Generar imagen con overlay usando la primera imagen como base
        const image = await ImageGenerator.generateNumberedImage(i, tweetCount, availableImages[0])
        distributedImages.push(image)
      } else {
        // Generar imagen con color sólido
        const image = await ImageGenerator.generateNumberedImage(i, tweetCount)
        distributedImages.push(image)
      }
    }

    return distributedImages
  }

  async regenerateTweet(originalText: string, tweetIndex: number): Promise<string> {
    this.logStart('Regenerating single tweet')
    const prompt = PromptEngine.compile(PROMPT_TEMPLATES.REGENERATE_TWEET, {
      content: originalText,
      tweetIndex: tweetIndex + 1,
    })

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { temperature: 0.9, maxOutputTokens: 150 },
    })

    return (response.text ?? '').trim()
  }
}

export const googleGenAIService = new GoogleGenAIService(import.meta.env.VITE_GEMINI_API_KEY || '')
