import { ref } from 'vue'
import { Readability } from '@mozilla/readability'
import { logger } from '@/utils/logger'
import { ScrapingError, handleError, ErrorCodes } from '@/utils/errorHandler'
import i18n from '@/i18n'

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
      logger.scraping.start(url)

      // Validar URL
      new URL(url)

      // Modo desarrollo sin puter.js
      if (import.meta.env.DEV && !checkPuterAvailability()) {
        logger.warn('Development mode: Using mock data')
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const mockContent = `
Editorial: La Transformación Digital en América Latina

La transformación digital ha llegado para quedarse en América Latina. Las empresas que no se adapten a las nuevas tecnologías se quedarán atrás en un mercado cada vez más competitivo.

Los datos revelan que el 85% de las compañías latinoamericanas han acelerado sus procesos de digitalización desde 2020. Esta tendencia no es casualidad, sino una necesidad imperante para sobrevivir en la nueva economía digital.

Sin embargo, la brecha digital sigue siendo un desafío. Las PYMES enfrentan obstáculos significativos para acceder a tecnologías avanzadas debido a limitaciones presupuestarias y falta de conocimiento técnico.

La solución pasa por políticas públicas que incentiven la adopción tecnológica, programas de capacitación digital y alianzas estratégicas entre el sector público y privado.

El futuro de América Latina depende de qué tan rápido podamos cerrar esta brecha y convertir la tecnología en motor de crecimiento inclusivo y sostenible.
        `.trim()

        logger.scraping.success(mockContent.length)
        return mockContent
      }

      if (!checkPuterAvailability()) {
        throw new ScrapingError(
          i18n.global.t('errors.scraping.puterRequired'),
          new Error('Puter.js not available'),
        )
      }

      // Usar puter.js para scraping real
      const puter = (window as any).puter
      const response = await puter.net.fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })

      if (!response.ok) {
        throw new ScrapingError(
          i18n.global.t('errors.scraping.serverError', {
            message: `${response.status} - ${response.statusText}`,
          }),
          new Error(`HTTP ${response.status}: ${response.statusText}`),
        )
      }

      const html = await response.text()

      if (!html || html.length < 100) {
        throw new ScrapingError(
          i18n.global.t('errors.scraping.noContent'),
          new Error('HTML content too short or empty'),
        )
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
        throw new ScrapingError(
          i18n.global.t('errors.scraping.parseError'),
          new Error('Readability could not parse the article'),
        )
      }

      const textContent = article.textContent || ''

      if (textContent.length < 200) {
        throw new ScrapingError(
          i18n.global.t('errors.scraping.noContent'),
          new Error('Extracted content too short'),
        )
      }

      // Limpiar y formatear el texto
      const cleanedContent = textContent
        .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Limpiar múltiples saltos de línea
        .trim()

      logger.scraping.success(cleanedContent.length)
      return cleanedContent
    } catch (err) {
      const appError = handleError(err, 'Scraper')
      error.value = appError.message
      throw appError
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
          error: i18n.global.t('home.urlInput.error.invalidProtocol'),
        }
      }

      // Verificar que tenga un dominio válido
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        return {
          isValid: false,
          error: i18n.global.t('home.urlInput.error.invalidDomain'),
        }
      }

      return { isValid: true }
    } catch {
      return {
        isValid: false,
        error: i18n.global.t('home.urlInput.error.invalid'),
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
      logger.warn('Error extracting metadata', { data: err })
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
