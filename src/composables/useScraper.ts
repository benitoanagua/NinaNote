import { ref } from 'vue'
import { scrapingService } from '@/core/scraping/ScrapingService'
import { logger, handleError, translateError } from '@/utils/logger'
import type { ScrapedContent } from '@/core/types'

export const useScraper = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const scrapeContent = async (url: string): Promise<ScrapedContent> => {
    isLoading.value = true
    error.value = null

    logger.info('Starting URL scraping process', {
      context: 'useScraper',
      data: { url },
    })

    try {
      logger.debug('Validating URL format', {
        context: 'useScraper',
        data: { url },
      })

      // Validación básica adicional
      if (!url.trim()) {
        throw new Error('URL cannot be empty')
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('URL must start with http:// or https://')
      }

      logger.info('Calling scraping service', {
        context: 'useScraper',
        data: { url: url.substring(0, 50) + (url.length > 50 ? '...' : '') },
      })

      const content = await scrapingService.scrapeContent(url)

      // Log detallado de imágenes encontradas
      if (content.images && content.images.length > 0) {
        logger.info('Images found during scraping', {
          context: 'useScraper',
          data: {
            totalImages: content.images.length,
            imageUrls: content.images.slice(0, 5).map((img) => img.substring(0, 50) + '...'),
            hasMainImage: !!content.image,
            imagesSample: content.images.slice(0, 3).map((img, index) => ({
              index,
              url: img.substring(0, 40) + (img.length > 40 ? '...' : ''),
              length: img.length,
            })),
          },
        })
      } else {
        logger.info('No images found during scraping', {
          context: 'useScraper',
        })
      }

      logger.success('URL scraped successfully', {
        context: 'useScraper',
        data: {
          contentLength: content.content.length,
          title: content.title,
          imageCount: content.images?.length || 0,
          hasAuthor: !!content.author,
          hasExcerpt: !!content.excerpt,
        },
      })

      // Validación de longitud de contenido
      if (content.content.length < 100) {
        logger.warn('Scraped content is very short', {
          context: 'useScraper',
          data: { contentLength: content.content.length },
        })
      }

      return content
    } catch (err) {
      const appError = handleError(err, 'useScraper')
      error.value = translateError(appError)

      logger.error('URL scraping failed', {
        context: 'useScraper',
        data: {
          error: appError.message,
          url,
          originalError: err,
        },
      })

      throw appError
    } finally {
      isLoading.value = false
    }
  }

  const validateUrl = (url: string): { isValid: boolean; error?: string } => {
    logger.debug('Validating URL', {
      context: 'useScraper',
      data: { url },
    })

    try {
      scrapingService.validateUrl(url)

      logger.info('URL validation passed', {
        context: 'useScraper',
        data: { url: url.substring(0, 30) + (url.length > 30 ? '...' : '') },
      })

      return { isValid: true }
    } catch (err) {
      const appError = handleError(err, 'useScraper')
      const errorMessage = translateError(appError)

      logger.warn('URL validation failed', {
        context: 'useScraper',
        data: {
          error: errorMessage,
          url,
          originalError: err,
        },
      })

      return {
        isValid: false,
        error: errorMessage,
      }
    }
  }

  const validateContentLength = (content: string): { isValid: boolean; error?: string } => {
    const minLength = 300

    logger.debug('Validating content length', {
      context: 'useScraper',
      data: { contentLength: content.length, minLength },
    })

    if (!content || content.trim().length < minLength) {
      const errorMsg = `Content too short. Minimum ${minLength} characters required, got ${content.length}`

      logger.warn('Content length validation failed', {
        context: 'useScraper',
        data: {
          contentLength: content.length,
          minLength,
          hasContent: !!content,
        },
      })

      return {
        isValid: false,
        error: errorMsg,
      }
    }

    logger.info('Content length validation passed', {
      context: 'useScraper',
      data: { contentLength: content.length },
    })

    return { isValid: true }
  }

  const extractImagesFromUrl = async (url: string): Promise<string[]> => {
    logger.info('Extracting images from URL', {
      context: 'useScraper',
      data: { url },
    })

    try {
      const images = await scrapingService.extractImages(url)

      logger.success('Images extracted successfully', {
        context: 'useScraper',
        data: {
          imageCount: images.length,
          hasImages: images.length > 0,
          imagesSample: images.slice(0, 3).map((img, index) => ({
            index,
            url: img.substring(0, 40) + (img.length > 40 ? '...' : ''),
          })),
        },
      })

      return images
    } catch (err) {
      const appError = handleError(err, 'useScraper')

      logger.error('Image extraction failed', {
        context: 'useScraper',
        data: {
          error: appError.message,
          url,
          originalError: err,
        },
      })

      throw appError
    }
  }

  const clearError = () => {
    if (error.value) {
      logger.info('Clearing previous scraping error', {
        context: 'useScraper',
        data: { previousError: error.value },
      })
    }
    error.value = null
  }

  const resetState = () => {
    clearError()
    isLoading.value = false
    logger.info('Scraper composable state reset', { context: 'useScraper' })
  }

  // Método para validar y scrapear en un solo paso
  const validateAndScrape = async (url: string): Promise<ScrapedContent> => {
    logger.info('Starting combined validation and scraping', {
      context: 'useScraper',
      data: { url },
    })

    const validation = validateUrl(url)
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid URL')
    }

    return await scrapeContent(url)
  }

  return {
    scrapeContent,
    validateUrl,
    validateContentLength,
    extractImagesFromUrl,
    validateAndScrape,
    clearError,
    resetState,
    isLoading,
    error,
  }
}
