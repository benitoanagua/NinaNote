import { GoogleGenAI } from '@google/genai'
import type { AIModel, ThreadTweet } from '../types'
import { BaseService } from '../base/BaseService'
import { PROMPT_TEMPLATES, PromptEngine } from './PromptTemplate'
import { ImageGenerator } from '../utils/imageGenerator'
import { logger, ErrorFactory } from '@/utils/logger'

export class GoogleGenAIService extends BaseService {
  private ai: GoogleGenAI

  constructor(apiKey: string) {
    super('GoogleGenAI Service')
    this.ai = new GoogleGenAI({ apiKey })
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.ai.models.list({ config: { pageSize: 1 } })
      logger.info('Google Gemini API available', { context: 'AI' })
      return true
    } catch (error) {
      logger.warn('Google Gemini API not available', {
        context: 'AI',
        data: error,
      })
      return false
    }
  }

  async getAvailableModels(): Promise<AIModel[]> {
    try {
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

      logger.info(`Found ${available.length} available AI models`, { context: 'AI' })
      return available
    } catch (error) {
      logger.error('Failed to get available models', {
        context: 'AI',
        data: error,
      })
      throw ErrorFactory.ai(
        'Failed to retrieve available models',
        error instanceof Error ? error : undefined,
      )
    }
  }

  async generateThread(text: string, images: string[] = []): Promise<ThreadTweet[]> {
    this.logStart('Generating thread with Gemini')
    logger.ai.generating('gemini-2.0-flash')

    try {
      const textLength = text.length
      let tweetCount = 4

      if (textLength < 800) {
        tweetCount = 3
      } else if (textLength > 2000) {
        tweetCount = 5
      }

      logger.info(`Calculated tweet count: ${tweetCount} for text length: ${textLength}`, {
        context: 'AI',
      })

      const prompt = PromptEngine.compile(PROMPT_TEMPLATES.GENERATE_THREAD, {
        content: text,
        tweetCount,
      })

      logger.debug('Sending prompt to Gemini API', {
        context: 'AI',
        data: { promptLength: prompt.length, tweetCount },
      })

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { temperature: 0.8, maxOutputTokens: 1000 },
      })

      const raw = response.text ?? ''

      logger.debug('Received response from Gemini API', {
        context: 'AI',
        data: { responseLength: raw.length },
      })

      const tweetContents = raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .slice(0, tweetCount)

      if (tweetContents.length === 0) {
        throw ErrorFactory.ai('No valid tweets generated from AI response')
      }

      logger.info(`Parsed ${tweetContents.length} tweets from AI response`, {
        context: 'AI',
      })

      const distributedImages = await this.distributeImages(images, tweetContents.length)

      logger.debug('Distributed images to tweets', {
        context: 'AI',
        data: { imageCount: distributedImages.filter((img) => img).length },
      })

      const tweets = tweetContents.map((content, i) => ({
        id: `tweet-${Date.now()}-${i}`,
        content,
        charCount: content.length,
        imageUrl: distributedImages[i],
      }))

      this.logSuccess(`Generated ${tweets.length} tweets`)
      logger.ai.success(tweets.length)

      return tweets
    } catch (error) {
      this.logError('Failed to generate thread', error)
      logger.ai.error(error instanceof Error ? error : new Error(String(error)))
      throw ErrorFactory.ai(
        'Failed to generate Twitter thread',
        error instanceof Error ? error : undefined,
      )
    }
  }

  private async distributeImages(availableImages: string[], tweetCount: number): Promise<string[]> {
    const distributedImages: string[] = []

    logger.info(`Distributing ${availableImages.length} images to ${tweetCount} tweets`, {
      context: 'AI',
    })

    for (let i = 0; i < tweetCount; i++) {
      if (i < availableImages.length) {
        // Usar imagen real del artículo
        distributedImages.push(availableImages[i])
        logger.debug(`Using real image for tweet ${i + 1}`, {
          context: 'AI',
          data: { imageUrl: availableImages[i] },
        })
      } else if (availableImages.length > 0) {
        // Generar imagen con overlay usando la primera imagen como base
        try {
          const image = await ImageGenerator.generateNumberedImage(
            i,
            tweetCount,
            availableImages[0],
          )
          distributedImages.push(image)
          logger.debug(`Generated overlay image for tweet ${i + 1}`, {
            context: 'AI',
          })
        } catch (error) {
          logger.warn(`Failed to generate overlay image for tweet ${i + 1}`, {
            context: 'AI',
            data: error,
          })
          distributedImages.push('')
        }
      } else {
        // Generar imagen con color sólido
        try {
          const image = await ImageGenerator.generateNumberedImage(i, tweetCount)
          distributedImages.push(image)
          logger.debug(`Generated solid color image for tweet ${i + 1}`, {
            context: 'AI',
          })
        } catch (error) {
          logger.warn(`Failed to generate solid color image for tweet ${i + 1}`, {
            context: 'AI',
            data: error,
          })
          distributedImages.push('')
        }
      }
    }

    return distributedImages
  }

  async regenerateTweet(originalText: string, tweetIndex: number): Promise<string> {
    this.logStart('Regenerating single tweet')
    logger.info(`Regenerating tweet ${tweetIndex + 1}`, { context: 'AI' })

    try {
      const prompt = PromptEngine.compile(PROMPT_TEMPLATES.REGENERATE_TWEET, {
        content: originalText,
        tweetIndex: tweetIndex + 1,
      })

      logger.debug('Sending regeneration prompt to Gemini API', {
        context: 'AI',
        data: { promptLength: prompt.length, tweetIndex },
      })

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { temperature: 0.9, maxOutputTokens: 150 },
      })

      const newContent = (response.text ?? '').trim()

      if (!newContent) {
        throw ErrorFactory.ai('No content received for regenerated tweet')
      }

      logger.info(`Successfully regenerated tweet ${tweetIndex + 1}`, {
        context: 'AI',
        data: { newLength: newContent.length },
      })

      return newContent
    } catch (error) {
      this.logError('Failed to regenerate tweet', error)
      logger.ai.error(error instanceof Error ? error : new Error(String(error)))
      throw ErrorFactory.ai(
        'Failed to regenerate tweet',
        error instanceof Error ? error : undefined,
      )
    }
  }

  private calculateTweetCount(textLength: number): number {
    if (textLength < 800) return 3
    if (textLength > 2000) return 5
    return 4
  }

  private parseTweets(rawContent: string): string[] {
    return rawContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('/*'))
      .map((l) => l.replace(/^\d+[\.\)]\s*/, '')) // Remove numbering like "1.", "2)", etc.
      .filter((l) => l.length > 0)
  }
}

export const googleGenAIService = new GoogleGenAIService(import.meta.env.VITE_GEMINI_API_KEY || '')
