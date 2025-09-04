import { ref } from 'vue'
import { scrapingService } from '@/core/scraping/ScrapingService'
import { logger } from '@/utils/logger'
import { ScrapingError, handleError, ErrorCodes } from '@/utils/errorHandler'
import i18n from '@/i18n'

export const useScraper = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const scrapeText = async (url: string): Promise<string> => {
    isLoading.value = true
    error.value = null

    try {
      const content = await scrapingService.scrapeContent(url)
      return content.content
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
      scrapingService.validateUrl(url)
      return { isValid: true }
    } catch (err) {
      return {
        isValid: false,
        error: err instanceof Error ? err.message : i18n.global.t('home.urlInput.error.invalid'),
      }
    }
  }

  const extractMetadata = async (url: string) => {
    // Esta funcionalidad se puede mover al servicio de scraping
    try {
      const content = await scrapingService.scrapeContent(url)
      return {
        title: content.title,
        description: content.excerpt,
        image: content.image,
        author: content.author,
        publishDate: content.publishedDate,
      }
    } catch (err) {
      logger.warn('Error extracting metadata', { data: err })
      return {}
    }
  }

  const checkPuterAvailability = (): boolean => {
    return scrapingService.checkPuterAvailability()
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
