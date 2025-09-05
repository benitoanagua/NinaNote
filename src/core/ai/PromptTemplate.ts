export interface PromptTemplate {
  name: string
  version: string
  template: string
  variables: readonly string[]
}

export const PROMPT_TEMPLATES = {
  GENERATE_THREAD: {
    name: 'generate-thread',
    version: '1.1',
    variables: ['content', 'tweetCount'],
    template: `
Convierte este editorial en un hilo de Twitter de exactamente {{tweetCount}} tweets.

REGLAS ESTRICTAS:
- Cada tweet debe tener máximo 280 caracteres
- Mantén la esencia y los puntos clave del artículo
- Usa emojis estratégicamente para hacerlo más atractivo
- El primer tweet debe captar atención inmediatamente
- El último tweet debe tener call-to-action o reflexión poderosa
- Cada tweet debe funcionar de forma independiente pero conectar con los demás
- Usa un tono profesional pero accesible

EDITORIAL:
{{content}}

Formato de respuesta: devuelve SOLO los tweets, uno por línea, sin numeración ni explicaciones adicionales.
    `.trim(),
  },

  REGENERATE_TWEET: {
    name: 'regenerate-tweet',
    version: '1.0',
    variables: ['content', 'tweetIndex'],
    template: `
Regenera SOLO el tweet número {{tweetIndex}} de un hilo sobre este contenido:

{{content}}

Requisitos:
- Máximo 280 caracteres
- Diferente perspectiva pero mismo mensaje clave
- Mantén el tono y estilo profesional
- Incluye emojis estratégicos
- {{tweetSpecificRequirements}}

Responde SOLO con el nuevo tweet, sin explicaciones.
    `.trim(),
  },
} as const

export interface PromptVariables {
  [key: string]: string | number
}

export class PromptEngine {
  static compile(template: PromptTemplate, variables: PromptVariables): string {
    let compiledPrompt = template.template

    // Reemplazar variables
    for (const variable of template.variables) {
      const value = variables[variable]
      if (value !== undefined) {
        compiledPrompt = compiledPrompt.replace(
          new RegExp(`{{${variable}}}`, 'g'),
          value.toString(),
        )
      }
    }

    // Procesamiento especial para requisitos específicos del tweet
    if (template.name === 'regenerate-tweet') {
      const tweetIndex = variables.tweetIndex as number
      const tweetSpecificRequirements = this.getTweetSpecificRequirements(tweetIndex)
      compiledPrompt = compiledPrompt.replace(
        '{{tweetSpecificRequirements}}',
        tweetSpecificRequirements,
      )
    }

    return compiledPrompt
  }

  private static getTweetSpecificRequirements(tweetIndex: number): string {
    const requirements: string[] = []

    if (tweetIndex === 1) {
      requirements.push('Debe captar atención (es el primer tweet)')
    } else if (tweetIndex === 4) {
      requirements.push('Debe incluir call-to-action o reflexión final')
    }

    return requirements.join('\n- ')
  }

  static truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content
    }

    return `${content.slice(0, maxLength)}...`
  }
}

// Contenido de ejemplo para desarrollo
export const MOCK_CONTENT = `
Editorial: La Transformación Digital en América Latina

La transformación digital ha llegado para quedarse en América Latina. Las empresas que no se adapten a las nuevas tecnologías se quedarán atrás en un mercado cada vez más competitivo.

Los datos revelan que el 85% de las compañías latinoamericanas han acelerado sus procesos de digitalización desde 2020. Esta tendencia no es casualidad, sino una necesidad imperante para sobrevivir en la nueva economía digital.

Sin embargo, la brecha digital sigue siendo un desafío. Las PYMES enfrentan obstáculos significativos para acceder a tecnologías avanzadas debido a limitaciones presupuestarias y falta de conocimiento técnico.

La solución pasa por políticas públicas que incentiven la adopción tecnológica, programas de capacitación digital y alianzas estratégicas entre el sector público y privado.

El futuro de América Latina depende de qué tan rápido podamos cerrar esta brecha y convertir la tecnología en motor de crecimiento inclusivo y sostenible.
`.trim()
