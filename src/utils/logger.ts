import i18n from '@/i18n'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface LogOptions {
  level?: LogLevel
  context?: string
  data?: any
  translate?: boolean
  i18nKey?: string
  i18nParams?: Record<string, unknown> // Cambiado de any a unknown
}

class Logger {
  private isDevelopment = import.meta.env.DEV
  private context: string = 'NinaNote'

  setContext(context: string) {
    this.context = context
  }

  private getTimestamp(): string {
    return new Date().toISOString()
  }

  private formatMessage(level: LogLevel, message: string, options: LogOptions = {}): string {
    const timestamp = this.getTimestamp()
    const context = options.context || this.context
    const emoji = this.getLevelEmoji(level)

    return `${emoji} [${timestamp}] [${context}] ${message}`
  }

  private getLevelEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.DEBUG]: '🐛',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.SUCCESS]: '✅',
    }
    return emojis[level] || '📝'
  }

  private getTranslatedMessage(key: string, params?: Record<string, unknown>): string {
    try {
      // Asegurarnos de que params no sea undefined
      return i18n.global.t(key, params || {})
    } catch {
      return key
    }
  }

  log(level: LogLevel, message: string, options: LogOptions = {}) {
    const formattedMessage =
      options.translate && options.i18nKey
        ? this.getTranslatedMessage(options.i18nKey, options.i18nParams)
        : message

    const fullMessage = this.formatMessage(level, formattedMessage, options)

    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(fullMessage, options.data || '')
        }
        break
      case LogLevel.INFO:
        console.info(fullMessage, options.data || '')
        break
      case LogLevel.WARN:
        console.warn(fullMessage, options.data || '')
        break
      case LogLevel.ERROR:
        console.error(fullMessage, options.data || '')
        break
      case LogLevel.SUCCESS:
        console.log(fullMessage, options.data || '')
        break
    }
  }

  debug(message: string, options?: Omit<LogOptions, 'level'>) {
    this.log(LogLevel.DEBUG, message, options)
  }

  info(message: string, options?: Omit<LogOptions, 'level'>) {
    this.log(LogLevel.INFO, message, options)
  }

  warn(message: string, options?: Omit<LogOptions, 'level'>) {
    this.log(LogLevel.WARN, message, options)
  }

  error(message: string, options?: Omit<LogOptions, 'level'>) {
    this.log(LogLevel.ERROR, message, options)
  }

  success(message: string, options?: Omit<LogOptions, 'level'>) {
    this.log(LogLevel.SUCCESS, message, options)
  }

  // Métodos específicos para diferentes contextos
  scraping = {
    start: (url: string) =>
      this.info('Iniciando scraping', {
        context: 'Scraper',
        data: { url },
      }),
    success: (contentLength: number) =>
      this.success('Scraping completado', {
        context: 'Scraper',
        data: { length: contentLength },
      }),
    error: (error: Error) =>
      this.error('Error en scraping', {
        context: 'Scraper',
        data: error,
      }),
  }

  ai = {
    generating: (model: string) =>
      this.info('Generando con IA', {
        context: 'AI',
        data: { model },
      }),
    success: (tweetCount: number) =>
      this.success('IA generó tweets', {
        context: 'AI',
        data: { count: tweetCount },
      }),
    error: (error: Error) =>
      this.error('Error en IA', {
        context: 'AI',
        data: error,
      }),
  }

  twitter = {
    publishing: (tweetCount: number) =>
      this.info('Publicando en Twitter', {
        context: 'Twitter',
        data: { count: tweetCount },
      }),
    success: () => this.success('Publicación exitosa', { context: 'Twitter' }),
    error: (error: Error) =>
      this.error('Error en Twitter', {
        context: 'Twitter',
        data: error,
      }),
  }
}

export const logger = new Logger()
