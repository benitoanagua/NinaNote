import type { AIModel, AIResponse, ThreadTweet } from '../types'
import { BaseService } from '../base/BaseService'
import { PROMPT_TEMPLATES, PromptEngine, MOCK_CONTENT } from './PromptTemplate'

export class AIService extends BaseService {
  private availableModels: AIModel[] = [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', available: false },
    {
      id: 'claude-sonnet-4-latest',
      name: 'Claude Sonnet',
      provider: 'Anthropic',
      available: false,
    },
    {
      id: 'openrouter:openai/gpt-4.1-mini',
      name: 'GPT-4.1 Mini',
      provider: 'OpenRouter',
      available: false,
    },
    {
      id: 'openrouter:anthropic/claude-3.5-sonnet-20240620',
      name: 'Claude 3.5 Sonnet',
      provider: 'OpenRouter',
      available: false,
    },
  ]

  constructor() {
    super('AI Service')
  }

  async checkAvailability(): Promise<boolean> {
    return typeof window !== 'undefined' && !!(window as any).puter?.ai?.chat
  }

  async getAvailableModels(): Promise<AIModel[]> {
    if (!(await this.checkAvailability())) {
      return this.availableModels.map((model) => ({ ...model, available: false }))
    }

    const checkedModels = await Promise.all(
      this.availableModels.map(async (model) => {
        try {
          await (window as any).puter.ai.chat('test', {
            model: model.id,
            max_tokens: 1,
            temperature: 0,
          })
          return { ...model, available: true }
        } catch (err) {
          return { ...model, available: false }
        }
      }),
    )

    return checkedModels
  }

  async generateThread(text: string, modelId?: string): Promise<ThreadTweet[]> {
    this.logStart('Generating thread')

    try {
      const availableModels = await this.getAvailableModels()
      const modelToUse = modelId
        ? availableModels.find((m) => m.id === modelId && m.available)
        : availableModels.find((m) => m.available)

      if (!modelToUse) {
        throw new Error('No AI models available')
      }

      const prompt = this.buildThreadPrompt(text)
      const response = await this.sendAIRequest(prompt, modelToUse.id)
      const tweets = this.processAIResponse(response)

      this.logSuccess(`Generated ${tweets.length} tweets`)
      return tweets
    } catch (error) {
      this.logError('Failed to generate thread', error)
      throw error
    }
  }

  async regenerateTweet(
    originalText: string,
    tweetIndex: number,
    modelId?: string,
  ): Promise<string> {
    this.logStart('Regenerating tweet')

    try {
      const availableModels = await this.getAvailableModels()
      const modelToUse = modelId
        ? availableModels.find((m) => m.id === modelId && m.available)
        : availableModels.find((m) => m.available)

      if (!modelToUse) {
        throw new Error('No AI models available')
      }

      const prompt = this.buildRegeneratePrompt(originalText, tweetIndex)
      const response = await this.sendAIRequest(prompt, modelToUse.id, 0.9, 100)

      this.logSuccess('Tweet regenerated successfully')
      return response.content.trim()
    } catch (error) {
      this.logError('Failed to regenerate tweet', error)
      throw error
    }
  }

  private buildThreadPrompt(text: string): string {
    const truncatedContent = PromptEngine.truncateContent(text, 4000)

    return PromptEngine.compile(PROMPT_TEMPLATES.GENERATE_THREAD, {
      content: truncatedContent,
    })
  }

  private buildRegeneratePrompt(originalText: string, tweetIndex: number): string {
    const truncatedContent = PromptEngine.truncateContent(originalText, 2000)

    return PromptEngine.compile(PROMPT_TEMPLATES.REGENERATE_TWEET, {
      content: truncatedContent,
      tweetIndex: tweetIndex + 1, // Convertir a 1-based index para el prompt
    })
  }

  private async sendAIRequest(
    prompt: string,
    model: string,
    temperature = 0.8,
    maxTokens = 1000,
  ): Promise<AIResponse> {
    const response = await (window as any).puter.ai.chat(prompt, {
      model,
      temperature,
      max_tokens: maxTokens,
    })

    return this.extractContentFromResponse(response)
  }

  private extractContentFromResponse(response: any): AIResponse {
    let content = ''

    if (typeof response === 'string') {
      content = response
    } else if (response.message?.content) {
      content = response.message.content
    } else if (response.choices?.[0]?.message?.content) {
      content = response.choices[0].message.content
    } else if (response.completion) {
      content = response.completion
    } else if (response.text) {
      content = response.text
    } else if (response.content) {
      content = response.content
    } else if (response.valueOf && typeof response.valueOf === 'function') {
      const value = response.valueOf()
      if (typeof value === 'string') content = value
    } else if (response.toString && typeof response.toString === 'function') {
      content = response.toString()
    }

    return {
      content,
      model: 'unknown',
      tokens: 0,
    }
  }

  private processAIResponse(response: AIResponse): ThreadTweet[] {
    const tweets = response.content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !line.match(/^\d+[\.\)\:]/))
      .slice(0, 4)

    if (tweets.length === 0) {
      throw new Error('El modelo no generó tweets válidos')
    }

    return tweets.map((content, index) => ({
      id: `tweet-${Date.now()}-${index + 1}`,
      content: content.trim(),
      charCount: content.trim().length,
    }))
  }

  // Método para obtener contenido mock (para desarrollo)
  getMockContent(): string {
    return MOCK_CONTENT
  }
}

// Instancia singleton
export const aiService = new AIService()
