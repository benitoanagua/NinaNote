import { Readability } from '@mozilla/readability'
import type { ScrapedContent } from '../types'
import { BaseService } from '../base/BaseService'
import { MOCK_CONTENT } from '../ai/PromptTemplate'

export class ScrapingService extends BaseService {
  constructor() {
    super('Scraping Service')
  }

  async scrapeContent(url: string): Promise<ScrapedContent> {
    this.logStart(`Scraping content from ${url}`)

    try {
      // Validar URL
      this.validateUrl(url)

      // Modo desarrollo
      if (import.meta.env.DEV && !this.checkPuterAvailability()) {
        return this.getMockContent(url)
      }

      // Scraping real con Puter.js
      const html = await this.fetchHtml(url)
      const content = this.extractContent(html, url)

      this.logSuccess(`Scraped ${content.content.length} characters`)
      return content
    } catch (error) {
      this.logError('Failed to scrape content', error)
      throw error
    }
  }

  validateUrl(url: string): void {
    try {
      const urlObj = new URL(url)

      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol')
      }

      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        throw new Error('Invalid domain')
      }
    } catch {
      throw new Error('Invalid URL')
    }
  }

  checkPuterAvailability(): boolean {
    return typeof window !== 'undefined' && !!(window as any).puter?.net?.fetch
  }

  private async fetchHtml(url: string): Promise<string> {
    const puter = (window as any).puter
    const response = await puter.net.fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.text()
  }

  private extractContent(html: string, url: string): ScrapedContent {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Limpiar elementos no deseados
    this.removeUnwantedElements(doc)

    // Usar Readability para extraer contenido
    const reader = new Readability(doc)
    const article = reader.parse()

    if (!article) {
      throw new Error('Could not parse article content')
    }

    const textContent = article.textContent || ''

    if (textContent.length < 200) {
      throw new Error('Extracted content too short')
    }

    return {
      url,
      title: article.title || 'Untitled',
      content: this.cleanText(textContent),
      excerpt: article.excerpt || '',
      author: article.byline || undefined,
      publishedDate: undefined,
      image: this.extractImage(doc) || undefined,
    }
  }

  private removeUnwantedElements(doc: Document): void {
    const unwantedSelectors = [
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
    ]

    unwantedSelectors.forEach((selector) => {
      doc.querySelectorAll(selector).forEach((element) => element.remove())
    })
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  }

  private extractImage(doc: Document): string | null {
    // Intentar varias fuentes de imágenes
    const ogImage = doc.querySelector('meta[property="og:image"]')
    if (ogImage) return ogImage.getAttribute('content')

    const twitterImage = doc.querySelector('meta[name="twitter:image"]')
    if (twitterImage) return twitterImage.getAttribute('content')

    const firstImage = doc.querySelector('img')
    if (firstImage) return firstImage.getAttribute('src')

    return null
  }

  private getMockContent(url: string): ScrapedContent {
    return {
      url,
      title: 'La Transformación Digital en América Latina',
      content: MOCK_CONTENT,
      excerpt: 'Un análisis sobre la transformación digital en América Latina y sus desafíos',
      author: 'Autor de Ejemplo',
      publishedDate: new Date().toISOString(),
    }
  }
}

// Instancia singleton
export const scrapingService = new ScrapingService()
