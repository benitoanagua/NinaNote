import type { AppError } from './errorFactory'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface LogEntry {
  message: string
  level: LogLevel
  context: string
  timestamp: number
  data?: any
}

export interface LogOptions {
  level?: LogLevel
  context?: string
  data?: any
  translate?: boolean
  i18nKey?: string
  i18nParams?: Record<string, unknown>
}

export type LogListener = (entry: LogEntry) => void

export interface LoggerInterface {
  setContext(context: string): void
  addListener(listener: LogListener): () => void
  log(level: LogLevel, message: string, options?: LogOptions): void
  debug(message: string, options?: Omit<LogOptions, 'level'>): void
  info(message: string, options?: Omit<LogOptions, 'level'>): void
  warn(message: string, options?: Omit<LogOptions, 'level'>): void
  error(message: string, options?: Omit<LogOptions, 'level'>): void
  success(message: string, options?: Omit<LogOptions, 'level'>): void
  captureError(error: unknown, context?: string): AppError
  logAndReturnError(error: unknown, context?: string): AppError
}

export interface ScrapingLogger {
  start(url: string): void
  success(contentLength: number): void
  error(error: Error): void
}

export interface AILogger {
  generating(model: string): void
  success(tweetCount: number): void
  error(error: Error): void
}

export interface TwitterLogger {
  publishing(tweetCount: number): void
  success(): void
  error(error: Error): void
}
