import { ref } from 'vue'

export interface ThreadTweet {
  id: string
  content: string
  charCount: number
}

export const useLLM = () => {
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  // Modelos disponibles ordenados por preferencia
  const AVAILABLE_MODELS = [
    'claude-sonnet-4-latest',
    'openrouter:anthropic/claude-3.5-sonnet-20240620',
    'gpt-4o-mini',
    'openrouter:openai/gpt-4.1-mini',
  ]

  const checkPuterAvailability = (): boolean => {
    return typeof window !== 'undefined' && !!(window as any).puter?.ai?.chat
  }

  const selectBestAvailableModel = async (): Promise<string> => {
    if (!checkPuterAvailability()) {
      throw new Error('Puter.js no está disponible')
    }

    // Intentar cada modelo en orden de preferencia
    for (const model of AVAILABLE_MODELS) {
      try {
        // Hacer una prueba simple con cada modelo
        await (window as any).puter.ai.chat('test', {
          model,
          max_tokens: 1,
          temperature: 0,
        })
        return model
      } catch (err) {
        console.warn(`Model ${model} not available:`, err)
        continue
      }
    }

    // Fallback: usar el primer modelo sin especificar (debería usar el default)
    return AVAILABLE_MODELS[0]
  }

  const generateThread = async (text: string): Promise<ThreadTweet[]> => {
    isGenerating.value = true
    error.value = null

    try {
      // En desarrollo, mantener la simulación
      if (import.meta.env.DEV && !checkPuterAvailability()) {
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const mockTweets = [
          '🔥 La transformación digital en América Latina es imparable: 85% de empresas aceleraron digitalización desde 2020. Ya no es opción, es supervivencia en la nueva economía.',

          '💡 Pero hay un gran PERO: la brecha digital golpea fuerte a las PYMES. Falta presupuesto y conocimiento técnico para acceder a tecnologías avanzadas. Un problema que frena el crecimiento.',

          '🤝 La solución está clara: necesitamos políticas públicas inteligentes, programas de capacitación digital y alianzas estratégicas sector público-privado. Unidos podemos más.',

          '🚀 El futuro de América Latina se define HOY: cerrar la brecha digital y convertir la tecnología en motor de crecimiento inclusivo. ¿Estamos listos para el desafío?',
        ]

        return mockTweets.map((content, index) => ({
          id: `tweet-${index + 1}`,
          content,
          charCount: content.length,
        }))
      }

      // Usar puter.ai en producción
      const model = await selectBestAvailableModel()

      const prompt = `
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
      `

      const response = await (window as any).puter.ai.chat(prompt, {
        model,
        temperature: 0.8,
        max_tokens: 1000,
      })

      // Extraer contenido de la respuesta
      let content = ''
      if (typeof response === 'string') {
        content = response
      } else if (response.message?.content) {
        content = response.message.content
      } else if (response.valueOf) {
        content = response.valueOf()
      } else if (response.toString) {
        content = response.toString()
      }

      if (!content) {
        throw new Error('No se recibió contenido válido del modelo de IA')
      }

      // Procesar la respuesta
      const tweets = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .filter((line) => !line.match(/^\d+[\.\)\:]/)) // Remover numeración si existe
        .slice(0, 4) // Máximo 4 tweets

      if (tweets.length === 0) {
        throw new Error('El modelo no generó tweets válidos')
      }

      return tweets.map((content, index) => ({
        id: `tweet-${Date.now()}-${index + 1}`,
        content: content.trim(),
        charCount: content.trim().length,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar el hilo'
      error.value = errorMessage
      console.error('Error generating thread:', err)
      throw new Error(errorMessage)
    } finally {
      isGenerating.value = false
    }
  }

  const regenerateTweet = async (originalText: string, tweetIndex: number): Promise<string> => {
    try {
      // En desarrollo, usar alternativas mock
      if (import.meta.env.DEV && !checkPuterAvailability()) {
        const alternatives = [
          '🔄 Versión alternativa del tweet con un enfoque diferente y mismo impacto...',
          '✨ Nueva perspectiva del mismo punto clave pero con otras palabras...',
          '💫 Enfoque renovado manteniendo la esencia del mensaje original...',
        ]

        await new Promise((resolve) => setTimeout(resolve, 1000))
        return alternatives[tweetIndex % alternatives.length]
      }

      // Usar puter.ai para regenerar tweet específico
      const model = await selectBestAvailableModel()

      const prompt = `
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
      `

      const response = await (window as any).puter.ai.chat(prompt, {
        model,
        temperature: 0.9, // Más creatividad para variaciones
        max_tokens: 100,
      })

      // Extraer contenido
      let content = ''
      if (typeof response === 'string') {
        content = response
      } else if (response.message?.content) {
        content = response.message.content
      } else if (response.valueOf) {
        content = response.valueOf()
      } else if (response.toString) {
        content = response.toString()
      }

      return content.trim() || 'Error al regenerar tweet'
    } catch (err) {
      console.error('Error regenerating tweet:', err)
      throw new Error('Error al regenerar el tweet')
    }
  }

  const getAvailableModels = async (): Promise<string[]> => {
    if (!checkPuterAvailability()) {
      return []
    }

    const availableModels: string[] = []

    for (const model of AVAILABLE_MODELS) {
      try {
        await (window as any).puter.ai.chat('test', {
          model,
          max_tokens: 1,
        })
        availableModels.push(model)
      } catch {
        // Modelo no disponible
      }
    }

    return availableModels
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
