import { logger } from './logger'
import i18n from '@/i18n'

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error,
    public context?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ScrapingError extends AppError {
  constructor(
    message: string,
    originalError?: Error,
    public code: string = ErrorCodes.SCRAPING_FAILED,
  ) {
    super(message, code, originalError, 'Scraper')
  }
}

export class AIError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'AI_ERROR', originalError, 'AI')
  }
}

export class TwitterError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'TWITTER_ERROR', originalError, 'Twitter')
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', undefined, 'Validation')
  }
}

export const handleError = (error: unknown, context?: string): AppError => {
  if (error instanceof AppError) {
    logger.error(error.message, {
      context: error.context || context,
      data: error.originalError,
    })
    return error
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const appError = new AppError(
    errorMessage,
    'UNKNOWN_ERROR',
    error instanceof Error ? error : undefined,
    context,
  )

  logger.error(errorMessage, {
    context: context || 'Unknown',
    data: error,
  })

  return appError
}

export const translateError = (error: Error): string => {
  if (error instanceof AppError) {
    try {
      const key = `errors.${error.code.toLowerCase()}`
      const translated = i18n.global.t(key)
      return translated !== key ? translated : error.message
    } catch {
      return error.message
    }
  }

  try {
    return i18n.global.t('errors.generic')
  } catch {
    return 'An unexpected error occurred'
  }
}

export const ErrorCodes = {
  // Scraping errors
  SCRAPING_FAILED: 'SCRAPING_FAILED',
  NO_CONTENT: 'NO_CONTENT',
  INVALID_URL: 'INVALID_URL',
  PARSE_ERROR: 'PARSE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',

  // AI errors
  AI_NO_RESPONSE: 'AI_NO_RESPONSE',
  AI_INVALID_TWEETS: 'AI_INVALID_TWEETS',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  AI_REGENERATION_FAILED: 'AI_REGENERATION_FAILED',

  // Twitter errors
  TWITTER_POST_FAILED: 'TWITTER_POST_FAILED',
  TWITTER_COPY_FAILED: 'TWITTER_COPY_FAILED',
  TWITTER_API_ERROR: 'TWITTER_API_ERROR',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
} as const

// Helper para crear errores específicos
export const ErrorFactory = {
  scraping: (message: string, originalError?: Error) => new ScrapingError(message, originalError),

  ai: (message: string, originalError?: Error) => new AIError(message, originalError),

  twitter: (message: string, originalError?: Error) => new TwitterError(message, originalError),

  validation: (message: string) => new ValidationError(message),
}
