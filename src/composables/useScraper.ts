import { ref } from 'vue'
import { Readability } from '@mozilla/readability'

export const useScraper = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const scrapeText = async (url: string): Promise<string> => {
    isLoading.value = true
    error.value = null

    try {
      // Validar URL
      new URL(url)

      // En desarrollo, simulamos el scraping
      if (import.meta.env.DEV) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        return `
          Editorial: La Transformación Digital en América Latina
          
          La transformación digital ha llegado para quedarse en América Latina. Las empresas que no se adapten a las nuevas tecnologías se quedarán atrás en un mercado cada vez más competitivo.
          
          Los datos revelan que el 85% de las compañías latinoamericanas han acelerado sus procesos de digitalización desde 2020. Esta tendencia no es casualidad, sino una necesidad imperante para sobrevivir en la nueva economía digital.
          
          Sin embargo, la brecha digital sigue siendo un desafío. Las PYMES enfrentan obstáculos significativos para acceder a tecnologías avanzadas debido a limitaciones presupuestarias y falta de conocimiento técnico.
          
          La solución pasa por políticas públicas que incentiven la adopción tecnológica, programas de capacitación digital y alianzas estratégicas entre el sector público y privado.
          
          El futuro de América Latina depende de qué tan rápido podamos cerrar esta brecha y convertir la tecnología en motor de crecimiento inclusivo y sostenible.
        `.trim()
      }

      // Implementación real con puter.js
      if (typeof window !== 'undefined' && (window as any).puter) {
        const puter = (window as any).puter
        const response = await puter.net.fetch(url)
        const html = await response.text()

        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        const reader = new Readability(doc)
        const article = reader.parse()

        return article?.textContent || 'No se pudo extraer contenido del artículo'
      }

      throw new Error('Puter.js no está disponible')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido al extraer el contenido'
      throw error.value
    } finally {
      isLoading.value = false
    }
  }

  return {
    scrapeText,
    isLoading,
    error,
  }
}
