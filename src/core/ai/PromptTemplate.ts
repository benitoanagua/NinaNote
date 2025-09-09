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

    return compiledPrompt
  }

  static truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content
    }

    return `${content.slice(0, maxLength)}...`
  }
}
