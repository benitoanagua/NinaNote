import { ref } from 'vue'
import { Readability } from '@mozilla/readability'

export const useScraper = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const checkPuterAvailability = (): boolean => {
    return typeof window !== 'undefined' && !!(window as any).puter?.net?.fetch
  }

  const scrapeText = async (url: string): Promise<string> => {
    isLoading.value = true
    error.value = null

    try {
      // Validar URL
      new URL(url)

      // En desarrollo sin puter.js, usar mock
      if (import.meta.env.DEV && !checkPuterAvailability()) {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        return `
Editorial: La Transformación Digital en América Latina

La transformación digital ha llegado para quedarse en América Latina. Las empresas que no se adapten a las nuevas tecnologías se quedarán atrás en un mercado cada vez más competitivo.

Los datos revelan que el 85% de las compañías latinoamericanas han acelerado sus procesos de digitalización desde 2020. Esta tendencia no es casualidad, sino una necesidad imperante para sobrevivir en la nueva economía digital.

Sin embargo, la brecha digital sigue siendo un desafío. Las PYMES enfrentan obstáculos significativos para acceder a tecnologías avanzadas debido a limitaciones presupuestarias y falta de conocimiento técnico.

La solución pasa por políticas públicas que incentiven la adopción tecnológica, programas de capacitación digital y alianzas estratégicas entre el sector público y privado.

El futuro de América Latina depende de qué tan rápido podamos cerrar esta brecha y convertir la tecnología en motor de crecimiento inclusivo y sostenible.

Esta transformación requiere una mentalidad abierta al cambio, inversión en educación digital y colaboración entre todos los sectores de la sociedad. Solo así podremos construir un futuro próspero y equitativo para todos.
        `.trim()
      }

      if (!checkPuterAvailability()) {
        throw new Error('Puter.js no está disponible para realizar el scraping')
      }

      // Usar puter.js para obtener el contenido
      const puter = (window as any).puter

      // Realizar fetch con puter.js
      const response = await puter.net.fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
      }

      const html = await response.text()

      if (!html || html.length < 100) {
        throw new Error('El contenido obtenido es demasiado corto o vacío')
      }

      // Usar Readability para extraer contenido principal
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // Limpiar scripts y elementos no deseados antes de Readability
      const unwantedElements = doc.querySelectorAll(
        'script, style, nav, header, footer, aside, .ad, .advertisement, .popup, .modal',
      )
      unwantedElements.forEach((element) => element.remove())

      const reader = new Readability(doc)
      const article = reader.parse()

      if (!article) {
        throw new Error('No se pudo procesar el artículo. El contenido podría no ser compatible.')
      }

      const textContent = article.textContent || ''

      if (textContent.length < 200) {
        throw new Error(
          'El artículo extraído es demasiado corto. Verifica que la URL contenga un artículo completo.',
        )
      }

      // Limpiar y formatear el texto
      const cleanedContent = textContent
        .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Limpiar múltiples saltos de línea
        .trim()

      return cleanedContent
    } catch (err) {
      let errorMessage = 'Error desconocido al extraer el contenido'

      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          errorMessage = 'No se pudo acceder a la URL. Verifica que sea correcta y accesible.'
        } else if (err.message.includes('parse')) {
          errorMessage = 'Error al procesar el contenido HTML de la página.'
        } else if (err.message.includes('HTTP')) {
          errorMessage = `Error del servidor: ${err.message}`
        } else if (err.message.includes('Puter')) {
          errorMessage =
            'Puter.js no está disponible. Esta funcionalidad requiere ejecutarse en el entorno Puter.'
        } else {
          errorMessage = err.message
        }
      }

      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  const validateUrl = (url: string): { isValid: boolean; error?: string } => {
    try {
      const urlObj = new URL(url)

      // Verificar que sea HTTP o HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          isValid: false,
          error: 'Solo se permiten URLs HTTP y HTTPS',
        }
      }

      // Verificar que tenga un dominio válido
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        return {
          isValid: false,
          error: 'La URL debe tener un dominio válido',
        }
      }

      return { isValid: true }
    } catch {
      return {
        isValid: false,
        error: 'URL no válida',
      }
    }
  }

  const extractMetadata = async (
    url: string,
  ): Promise<{
    title?: string
    description?: string
    image?: string
    author?: string
    publishDate?: string
  }> => {
    try {
      if (!checkPuterAvailability()) {
        return {}
      }

      const puter = (window as any).puter
      const response = await puter.net.fetch(url)
      const html = await response.text()

      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      const metadata: any = {}

      // Extraer título
      const titleEl = doc.querySelector('title')
      if (titleEl) metadata.title = titleEl.textContent?.trim()

      // Extraer meta description
      const descEl = doc.querySelector('meta[name="description"]')
      if (descEl) metadata.description = descEl.getAttribute('content')

      // Extraer Open Graph data
      const ogTitle = doc.querySelector('meta[property="og:title"]')
      if (ogTitle) metadata.title = ogTitle.getAttribute('content') || metadata.title

      const ogDesc = doc.querySelector('meta[property="og:description"]')
      if (ogDesc) metadata.description = ogDesc.getAttribute('content') || metadata.description

      const ogImage = doc.querySelector('meta[property="og:image"]')
      if (ogImage) metadata.image = ogImage.getAttribute('content')

      // Extraer autor
      const authorEl = doc.querySelector('meta[name="author"], meta[property="article:author"]')
      if (authorEl) metadata.author = authorEl.getAttribute('content')

      // Extraer fecha de publicación
      const dateEl = doc.querySelector(
        'meta[property="article:published_time"], meta[name="publish-date"]',
      )
      if (dateEl) metadata.publishDate = dateEl.getAttribute('content')

      return metadata
    } catch (err) {
      console.warn('Error extracting metadata:', err)
      return {}
    }
  }

  return {
    scrapeText,
    validateUrl,
    extractMetadata,
    checkPuterAvailability,
    isLoading,
    error,
  }
}
