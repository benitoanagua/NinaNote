import { ErrorCodes, type ErrorCode } from './errorCodes'

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
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
    public code: ErrorCode = ErrorCodes.SCRAPING_FAILED,
  ) {
    super(message, code, originalError, 'Scraper')
  }
}

export class AIError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorCodes.AI_GENERATION_FAILED, originalError, 'AI')
  }
}

export class TwitterError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorCodes.TWITTER_POST_FAILED, originalError, 'Twitter')
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, ErrorCodes.VALIDATION_ERROR, undefined, 'Validation')
  }
}

export class CorsError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorCodes.CORS_ERROR, originalError, 'Scraper')
  }
}

export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorCodes.NETWORK_ERROR, originalError, 'Scraper')
  }
}

export const ErrorFactory = {
  scraping: (message: string, originalError?: Error) => new ScrapingError(message, originalError),

  ai: (message: string, originalError?: Error) => new AIError(message, originalError),

  twitter: (message: string, originalError?: Error) => new TwitterError(message, originalError),

  validation: (message: string) => new ValidationError(message),

  cors: (message: string, originalError?: Error) => new CorsError(message, originalError),

  network: (message: string, originalError?: Error) => new NetworkError(message, originalError),

  generic: (message: string, originalError?: Error, context?: string) =>
    new AppError(message, ErrorCodes.UNKNOWN_ERROR, originalError, context),
}
