import { ref } from 'vue'
import { scrapingService } from '@/core/scraping/ScrapingService'
import { logger } from '@/utils/logger'
import { ScrapingError, handleError, ErrorCodes } from '@/utils/errorHandler'
import i18n from '@/i18n'
import type { ScrapedContent } from '@/core/types'

export const useScraper = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const scrapeContent = async (url: string): Promise<ScrapedContent> => {
    isLoading.value = true
    error.value = null

    try {
      const content = await scrapingService.scrapeContent(url)
      return content
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

  const validateContentLength = (content: string): { isValid: boolean; error?: string } => {
    const minLength = 300
    if (!content || content.trim().length < minLength) {
      return {
        isValid: false,
        error: i18n.global.t('errors.scraping.minimumContent', { minLength }),
      }
    }
    return { isValid: true }
  }

  return {
    scrapeContent,
    validateUrl,
    validateContentLength,
    isLoading,
    error,
  }
}
