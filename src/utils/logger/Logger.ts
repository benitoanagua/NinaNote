import { LogFormatter } from './formatters'
import { handleError } from './errorHandler'
import { AppError } from './errorFactory'
import { LogLevel } from './types'
import type {
  LogEntry,
  LogOptions,
  LogListener,
  LoggerInterface,
  ScrapingLogger,
  AILogger,
  TwitterLogger,
} from './types'

export class Logger implements LoggerInterface {
  private isDevelopment = import.meta.env.DEV
  private context: string = 'NinaNote'
  private listeners: Set<LogListener> = new Set()

  setContext(context: string) {
    this.context = context
  }

  addListener(listener: LogListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emitLog(level: LogLevel, message: string, options: LogOptions = {}) {
    const logEntry: LogEntry = {
      message: LogFormatter.formatLogEntry(message, options),
      level,
      context: options.context || this.context,
      timestamp: Date.now(),
      data: options.data,
    }

    // Emitir a los listeners
    this.listeners.forEach((listener) => listener(logEntry))

    // Log a consola
    const formattedMessage = LogFormatter.formatMessage(level, message, options)

    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedMessage, options.data || '')
        }
        break
      case LogLevel.INFO:
        console.info(formattedMessage, options.data || '')
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, options.data || '')
        break
      case LogLevel.ERROR:
        console.error(formattedMessage, options.data || '')
        break
      case LogLevel.SUCCESS:
        console.log(formattedMessage, options.data || '')
        break
    }
  }

  log(level: LogLevel, message: string, options: LogOptions = {}) {
    this.emitLog(level, message, options)
  }

  debug(message: string, options?: Omit<LogOptions, 'level'>) {
    this.emitLog(LogLevel.DEBUG, message, options)
  }

  info(message: string, options?: Omit<LogOptions, 'level'>) {
    this.emitLog(LogLevel.INFO, message, options)
  }

  warn(message: string, options?: Omit<LogOptions, 'level'>) {
    this.emitLog(LogLevel.WARN, message, options)
  }

  error(message: string, options?: Omit<LogOptions, 'level'>) {
    this.emitLog(LogLevel.ERROR, message, options)
  }

  success(message: string, options?: Omit<LogOptions, 'level'>) {
    this.emitLog(LogLevel.SUCCESS, message, options)
  }

  // Domain-specific loggers
  scraping: ScrapingLogger = {
    start: (url: string) =>
      this.info('Starting URL scraping', {
        context: 'Scraper',
        data: { url },
      }),
    success: (contentLength: number) =>
      this.success('URL scraped successfully', {
        context: 'Scraper',
        data: { length: contentLength },
      }),
    error: (error: Error) =>
      this.error('Scraping failed', {
        context: 'Scraper',
        data: error,
      }),
  }

  ai: AILogger = {
    generating: (model: string) =>
      this.info('Generating content with AI', {
        context: 'AI',
        data: { model },
      }),
    success: (tweetCount: number) =>
      this.success('AI generation completed', {
        context: 'AI',
        data: { count: tweetCount },
      }),
    error: (error: Error) =>
      this.error('AI generation failed', {
        context: 'AI',
        data: error,
      }),
  }

  twitter: TwitterLogger = {
    publishing: (tweetCount: number) =>
      this.info('Publishing to Twitter', {
        context: 'Twitter',
        data: { count: tweetCount },
      }),
    success: () => this.success('Twitter publish successful', { context: 'Twitter' }),
    error: (error: Error) =>
      this.error('Twitter publish failed', {
        context: 'Twitter',
        data: error,
      }),
  }

  // Error handling methods
  captureError(error: unknown, context?: string): AppError {
    return handleError(error, context)
  }

  logAndReturnError(error: unknown, context?: string): AppError {
    const appError = this.captureError(error, context)
    return appError
  }
}

export const logger = new Logger()
