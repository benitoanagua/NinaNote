import { Readability } from '@mozilla/readability'
import type { ScrapedContent } from '../types'
import { BaseService } from '../base/BaseService'
import { MOCK_CONTENT } from '../ai/PromptTemplate'
import { ImageUtils } from '../utils/imageUtils'

export class ScrapingService extends BaseService {
  constructor() {
    super('Scraping Service')
  }

  async scrapeContent(url: string): Promise<ScrapedContent> {
    this.logStart(`Scraping content from ${url}`)
    try {
      this.validateUrl(url)

      // 🔥 SCRAPING REAL CON FETCH NATIVO
      const html = await this.fetchHtml(url)
      const content = this.extractContent(html, url)

      this.logSuccess(`Scraped ${content.content.length} characters`)
      return content
    } catch (error) {
      this.logError('Failed to scrape content', error)
      // Fallback siempre disponible
      return this.getMockContent(url)
    }
  }

  async extractImages(url: string): Promise<string[]> {
    try {
      const html = await this.fetchHtml(url)
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const images = ImageUtils.extractAllImages(doc)
      this.logSuccess(`Extracted ${images.length} images`)
      return images
    } catch (error) {
      this.logError('Failed to extract images', error)
      return this.getMockImages()
    }
  }

  validateUrl(url: string): void {
    try {
      const u = new URL(url)
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Invalid protocol')
      if (!u.hostname || u.hostname.length < 3) throw new Error('Invalid domain')
    } catch {
      throw new Error('Invalid URL')
    }
  }

  // 🔥 FETCH NATIVO - SIN PUTER
  private async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    return res.text()
  }

  private extractContent(html: string, url: string): ScrapedContent {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    this.removeUnwantedElements(doc)

    const reader = new Readability(doc)
    const article = reader.parse()
    if (!article) throw new Error('Could not parse article content')

    const textContent = article.textContent || ''
    if (textContent.length < 200) throw new Error('Extracted content too short')

    const images = ImageUtils.extractAllImages(doc)

    return {
      url,
      title: article.title || 'Untitled',
      content: this.cleanText(textContent),
      excerpt: article.excerpt || '',
      author: article.byline || undefined,
      publishedDate: undefined,
      image: images[0] || undefined,
      images,
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
    ]
    selectors.forEach((s) => doc.querySelectorAll(s).forEach((el) => el.remove()))
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  }

  private getMockContent(url: string): ScrapedContent {
    return {
      url,
      title: 'La Transformación Digital en América Latina',
      content: MOCK_CONTENT,
      excerpt: 'Análisis sobre transformación digital',
      author: 'Autor de Ejemplo',
      publishedDate: new Date().toISOString(),
      images: this.getMockImages(),
    }
  }

  private getMockImages(): string[] {
    // Ya no necesitamos imágenes mock externas
    return []
  }
}

export const scrapingService = new ScrapingService()
