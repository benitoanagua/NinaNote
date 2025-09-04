import type { ThreadTweet, TwitterConfig, TwitterPublishResult } from '../types'
import { BaseService } from '../base/BaseService'

export class TwitterService extends BaseService {
  constructor() {
    super('Twitter Service')
  }

  validateToken(token: string): boolean {
    return token.length > 50 && token.startsWith('AAAA')
  }

  async publishThread(tweets: ThreadTweet[], config: TwitterConfig): Promise<TwitterPublishResult> {
    this.logStart(`Publishing thread with ${tweets.length} tweets`)

    try {
      if (!this.validateToken(config.bearerToken)) {
        throw new Error('Token inválido. Debe comenzar con "AAAA" y tener más de 50 caracteres.')
      }

      // Modo desarrollo
      if (import.meta.env.DEV) {
        await this.delay(3000)
        return {
          success: true,
          tweetIds: tweets.map((_, i) => `mock-tweet-${Date.now()}-${i}`),
        }
      }

      // Publicación real
      const tweetIds = await this.publishToTwitter(tweets, config.bearerToken)

      this.logSuccess('Thread published successfully')
      return {
        success: true,
        tweetIds,
      }
    } catch (error) {
      this.logError('Failed to publish thread', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async copyToClipboard(tweets: ThreadTweet[]): Promise<boolean> {
    this.logStart('Copying thread to clipboard')

    try {
      const threadText = tweets
        .map((tweet, index) => `${index + 1}/${tweets.length}\n${tweet.content}`)
        .join('\n\n---\n\n')

      await navigator.clipboard.writeText(threadText)

      this.logSuccess('Thread copied to clipboard')
      return true
    } catch (error) {
      this.logError('Failed to copy to clipboard', error)
      return false
    }
  }

  private async publishToTwitter(tweets: ThreadTweet[], bearerToken: string): Promise<string[]> {
    const tweetIds: string[] = []
    let parentTweetId = ''

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i]
      const requestBody: any = {
        text: tweet.content,
      }

      if (parentTweetId) {
        requestBody.reply = {
          in_reply_to_tweet_id: parentTweetId,
        }
      }

      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Error al publicar tweet ${i + 1}: ${errorData.detail || 'Error desconocido'}`,
        )
      }

      const data = await response.json()
      parentTweetId = data.data?.id
      tweetIds.push(parentTweetId)

      // Pequeña pausa entre tweets
      if (i < tweets.length - 1) {
        await this.delay(1000)
      }
    }

    return tweetIds
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Instancia singleton
export const twitterService = new TwitterService()
