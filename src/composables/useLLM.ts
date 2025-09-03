import { ref } from 'vue'

export interface ThreadTweet {
  id: string
  content: string
  charCount: number
}

export const useLLM = () => {
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  const generateThread = async (text: string): Promise<ThreadTweet[]> => {
    isGenerating.value = true
    error.value = null

    try {
      // En desarrollo, simulamos la respuesta de IA
      if (import.meta.env.DEV) {
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

      // Usar puter.ai en producción (comentado por ahora)
      /*
      const prompt = `
        Convierte este editorial en un hilo de Twitter de 4 tweets máximo.
        
        REGLAS:
        - Cada tweet debe tener máximo 280 caracteres
        - Mantén la esencia y los puntos clave del artículo
        - Usa emojis para hacerlo más atractivo
        - El primer tweet debe captar atención
        - El último tweet debe tener call-to-action o reflexión
        
        EDITORIAL:
        ${text}
        
        Formato de respuesta: devuelve solo los tweets, uno por línea.
      `
      
      const response = await puter.ai.chat(prompt, { model: 'gpt-4o-mini' })
      const tweets = response.split('\n').filter(tweet => tweet.trim().length > 0)
      
      return tweets.map((content, index) => ({
        id: `tweet-${index + 1}`,
        content: content.trim(),
        charCount: content.trim().length
      }))
      */

      return []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al generar el hilo'
      throw error.value
    } finally {
      isGenerating.value = false
    }
  }

  const regenerateTweet = async (originalText: string, tweetIndex: number): Promise<string> => {
    try {
      // Simular regeneración de un tweet específico
      const alternatives = [
        '🔄 Versión alternativa del tweet con un enfoque diferente y mismo impacto...',
        '✨ Nueva perspectiva del mismo punto clave pero con otras palabras...',
        '💫 Enfoque renovado manteniendo la esencia del mensaje original...',
      ]

      await new Promise((resolve) => setTimeout(resolve, 1000))
      return alternatives[tweetIndex % alternatives.length]
    } catch (err) {
      error.value = 'Error al regenerar el tweet'
      throw error.value
    }
  }

  return {
    generateThread,
    regenerateTweet,
    isGenerating,
    error,
  }
}
