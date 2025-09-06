import { Readability } from '@mozilla/readability'
import type { ScrapedContent } from '../types'
import { BaseService } from '../base/BaseService'
import { logger, ErrorFactory } from '@/utils/logger'

export class ScrapingService extends BaseService {
  constructor() {
    super('Scraping Service')
  }

  async scrapeContent(url: string): Promise<ScrapedContent> {
    this.logStart(`Scraping content from ${url}`)
    logger.scraping.start(url)

    try {
      this.validateUrl(url)

      const html = await this.fetchHtml(url)
      const content = this.extractContent(html, url)

      this.logSuccess(`Scraped ${content.content.length} characters`)
      logger.scraping.success(content.content.length)
      return content
    } catch (error) {
      this.logError('Failed to scrape content', error)
      logger.scraping.error(error instanceof Error ? error : new Error(String(error)))

      // Manejar específicamente errores de CORS
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('CORS') || errorMessage.includes('cors')) {
        throw ErrorFactory.cors(errorMessage, error instanceof Error ? error : undefined)
      }

      if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        throw ErrorFactory.network(errorMessage, error instanceof Error ? error : undefined)
      }

      throw ErrorFactory.scraping(errorMessage, error instanceof Error ? error : undefined)
    }
  }

  async extractImages(url: string): Promise<string[]> {
    try {
      const html = await this.fetchHtml(url)
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      // Extraer y filtrar imágenes relevantes
      const allImages = this.extractAllImages(doc, url)
      const contentImages = this.filterContentImages(allImages, url)

      return contentImages
    } catch (error) {
      this.logError('Failed to extract images', error)
      logger.scraping.error(error instanceof Error ? error : new Error(String(error)))
      throw ErrorFactory.scraping(
        'Failed to extract images from URL',
        error instanceof Error ? error : undefined,
      )
    }
  }

  validateUrl(url: string): void {
    try {
      const u = new URL(url)
      if (!['http:', 'https:'].includes(u.protocol)) {
        throw ErrorFactory.validation('Invalid protocol. Only HTTP and HTTPS URLs are allowed')
      }
      if (!u.hostname || u.hostname.length < 3) {
        throw ErrorFactory.validation('Invalid domain')
      }
    } catch {
      throw ErrorFactory.validation('Invalid URL format')
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    try {
      // Intentar con CORS proxy primero
      const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`

      const res = await fetch(corsProxyUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        signal: AbortSignal.timeout(15000), // Timeout de 15 segundos
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      return await res.text()
    } catch (corsError) {
      logger.warn('CORS proxy failed, trying direct fetch', {
        context: 'ScrapingService',
        data: { url, error: corsError },
      })

      // Fallback a fetch directo
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          signal: AbortSignal.timeout(10000), // Timeout más corto para direct fetch
        })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }

        return await res.text()
      } catch (directError) {
        logger.error('Both CORS proxy and direct fetch failed', {
          context: 'ScrapingService',
          data: { url, corsError, directError },
        })

        throw new Error(
          `No se pudo acceder a la URL debido a restricciones CORS. Error: ${directError instanceof Error ? directError.message : 'Unknown error'}`,
        )
      }
    }
  }

  private extractContent(html: string, url: string): ScrapedContent {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    this.removeUnwantedElements(doc)

    const reader = new Readability(doc)
    const article = reader.parse()
    if (!article) {
      throw ErrorFactory.scraping('Could not parse article content')
    }

    const textContent = article.textContent || ''
    if (textContent.length < 200) {
      throw ErrorFactory.scraping('Extracted content too short')
    }

    // Extraer imágenes relevantes del contenido (no publicidad)
    const allImages = this.extractAllImages(doc, url)
    const contentImages = this.filterContentImages(allImages, url)

    return {
      url,
      title: article.title || 'Untitled',
      content: this.cleanText(textContent),
      excerpt: article.excerpt || '',
      author: article.byline || undefined,
      publishedDate: undefined,
      image: contentImages[0] || undefined,
      images: contentImages,
    }
  }

  private extractAllImages(doc: Document, sourceUrl: string): string[] {
    const images: string[] = []

    // 1. Extraer Open Graph image
    const ogImage = doc.querySelector('meta[property="og:image"]')
    if (ogImage && ogImage.getAttribute('content')) {
      const imageUrl = ogImage.getAttribute('content')!
      if (this.isValidImageUrl(imageUrl)) {
        images.push(this.ensureAbsoluteUrl(imageUrl, sourceUrl))
      }
    }

    // 2. Extraer Twitter image
    const twitterImage = doc.querySelector('meta[name="twitter:image"]')
    if (twitterImage && twitterImage.getAttribute('content')) {
      const imageUrl = twitterImage.getAttribute('content')!
      if (this.isValidImageUrl(imageUrl)) {
        images.push(this.ensureAbsoluteUrl(imageUrl, sourceUrl))
      }
    }

    // 3. Extraer imágenes del contenido principal
    const contentImages = Array.from(doc.querySelectorAll('img'))
      .map((img) => this.ensureAbsoluteUrl(img.src, sourceUrl))
      .filter((src) => this.isValidImageUrl(src))

    images.push(...contentImages)

    return Array.from(new Set(images)) // Eliminar duplicados
  }

  private ensureAbsoluteUrl(url: string, sourceUrl: string): string {
    if (url.startsWith('http')) return url
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) {
      // Usar el dominio de la URL fuente, no el dominio actual
      const baseUrl = this.getBaseUrlFromSource(sourceUrl)
      return `${baseUrl}${url}`
    }
    // Para URLs relativas sin slash
    const baseUrl = this.getBaseUrlFromSource(sourceUrl)
    return `${baseUrl}/${url}`
  }

  private getBaseUrlFromSource(url: string): string {
    try {
      const parsedUrl = new URL(url)
      return `${parsedUrl.protocol}//${parsedUrl.hostname}`
    } catch {
      return window.location.origin // Fallback
    }
  }

  private filterContentImages(images: string[], sourceUrl: string): string[] {
    const filteredImages = images.filter((imageUrl) => {
      // Excluir imágenes comunes de publicidad/header
      const lowerUrl = imageUrl.toLowerCase()

      // Patrones comunes de imágenes no deseadas
      const unwantedPatterns = [
        'logo',
        'header',
        'footer',
        'banner',
        'ad',
        'ads',
        'advertisement',
        'social',
        'icon',
        'avatar',
        'sponsor',
        'promo',
        'widget',
        'button',
        'menu',
        'nav',
        'thumbnail',
        'placeholder',
        'pixel',
        'tracking',
        'facebook',
        'twitter',
        'instagram',
        'whatsapp',
        'linkedin',
      ]

      // Excluir URLs que contengan estos patrones
      const hasUnwantedPattern = unwantedPatterns.some((pattern) => lowerUrl.includes(pattern))

      // Excluir imágenes muy pequeñas (probablemente iconos)
      const isLikelyIcon =
        lowerUrl.includes('x') &&
        (lowerUrl.includes('16x16') || lowerUrl.includes('32x32') || lowerUrl.includes('64x64'))

      // Excluir imágenes de redes sociales y favicons
      const isSocialMedia =
        lowerUrl.includes('facebook') ||
        lowerUrl.includes('twitter') ||
        lowerUrl.includes('instagram') ||
        lowerUrl.includes('favicon')

      return !hasUnwantedPattern && !isLikelyIcon && !isSocialMedia
    })

    // Ordenar por relevancia (imágenes más grandes primero)
    const sortedImages = filteredImages.sort((a, b) => {
      const getSizeScore = (url: string) => {
        const lowerUrl = url.toLowerCase()
        if (lowerUrl.includes('1200x') || lowerUrl.includes('1000x') || lowerUrl.includes('large'))
          return 3
        if (lowerUrl.includes('800x') || lowerUrl.includes('600x') || lowerUrl.includes('medium'))
          return 2
        if (lowerUrl.includes('400x') || lowerUrl.includes('300x') || lowerUrl.includes('small'))
          return 1
        return 0
      }

      return getSizeScore(b) - getSizeScore(a)
    })

    logger.debug('Imágenes de contenido filtradas', {
      context: 'ScrapingService',
      data: {
        originalCount: images.length,
        filteredCount: sortedImages.length,
        sample: sortedImages.slice(0, 3).map((img) => img.substring(0, 50) + '...'),
      },
    })

    return sortedImages.slice(0, 5) // Limitar a 5 imágenes máximo
  }

  private isValidImageUrl(url: string): boolean {
    if (!url) return false
    if (url.startsWith('data:image/')) return true

    try {
      new URL(url)

      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']
      return imageExtensions.some((ext) => url.toLowerCase().includes(ext))
    } catch {
      return false
    }
  }

  private removeUnwantedElements(doc: Document): void {
    const selectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      '.ad',
      '.advertisement',
      '.popup',
      '.modal',
      '.newsletter',
      '.social-share',
      '.comments',
      '.banner',
      '.widget',
      'iframe',
      'form',
      '.promo',
      '.sponsor',
    ]
    selectors.forEach((s) => doc.querySelectorAll(s).forEach((el) => el.remove()))
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  }
}

export const scrapingService = new ScrapingService()
