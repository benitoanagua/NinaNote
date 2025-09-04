import type { AIModel, AIResponse, ThreadTweet } from '../types'
import { BaseService } from '../base/BaseService'

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
    return `
Convierte este editorial en un hilo de Twitter de máximo 4 tweets.

REGLAS ESTRICTAS:
- Cada tweet debe tener máximo 280 caracteres
- Mantén la esencia y los puntos clave del artículo
- Usa emojis estratégicamente para hacerlo más atractivo
- El primer tweet debe captar atención inmediatamente
- El último tweet debe tener call-to-action o reflexión poderosa
- Cada tweet debe funcionar de forma independiente pero conectar con los demás
- Usa un tono profesional pero accesible

EDITORIAL:
${text.slice(0, 4000)} ${text.length > 4000 ? '...' : ''}

Formato de respuesta: devuelve SOLO los tweets, uno por línea, sin numeración ni explicaciones adicionales.
    `.trim()
  }

  private buildRegeneratePrompt(originalText: string, tweetIndex: number): string {
    return `
Regenera SOLO el tweet número ${tweetIndex + 1} de un hilo sobre este contenido:

${originalText.slice(0, 2000)}

Requisitos:
- Máximo 280 caracteres
- Diferente perspectiva pero mismo mensaje clave
- Mantén el tono y estilo profesional
- Incluye emojis estratégicos
- ${tweetIndex === 0 ? 'Debe captar atención (es el primer tweet)' : ''}
- ${tweetIndex === 3 ? 'Debe incluir call-to-action o reflexión final' : ''}

Responde SOLO con el nuevo tweet, sin explicaciones.
    `.trim()
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
}

// Instancia singleton
export const aiService = new AIService()
