import { GoogleGenAI } from '@google/genai'
import type { AIModel, ThreadTweet } from '../types'
import { BaseService } from '../base/BaseService'
import { PROMPT_TEMPLATES, PromptEngine } from './PromptTemplate'
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

  async generateThread(text: string): Promise<ThreadTweet[]> {
    this.logStart('Generating thread with Gemini')
    logger.ai.generating('gemini-2.0-flash')

    try {
      const tweetCount = this.calculateTweetCount(text.length)
      logger.info(`Calculated tweet count: ${tweetCount} for text length: ${text.length}`, {
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

      const tweetContents = this.parseTweets(raw).slice(0, tweetCount)

      if (tweetContents.length === 0) {
        throw ErrorFactory.ai('No valid tweets generated from AI response')
      }

      logger.info(`Parsed ${tweetContents.length} tweets from AI response`, {
        context: 'AI',
      })

      // Crear tweets SIN imágenes
      const tweets = this.createThreadTweets(tweetContents)

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
      .map((l) => l.replace(/^\d+[\.\)]\s*/, ''))
      .filter((l) => l.length > 0)
  }

  private createThreadTweets(contents: string[]): ThreadTweet[] {
    return contents.map((content, index) => ({
      id: `tweet-${Date.now()}-${index}`,
      content,
      charCount: content.length,
      imageUrl: undefined,
    }))
  }
}

export const googleGenAIService = new GoogleGenAIService(import.meta.env.VITE_GEMINI_API_KEY || '')
