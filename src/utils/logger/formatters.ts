import { LogLevel, type LogOptions } from './types'
import i18n from '@/i18n'

export class LogFormatter {
  static getTimestamp(): string {
    return new Date().toISOString()
  }

  static formatMessage(level: LogLevel, message: string, options: LogOptions = {}): string {
    const timestamp = this.getTimestamp()
    const context = options.context || 'NinaNote'
    const emoji = this.getLevelEmoji(level)

    return `${emoji} [${timestamp}] [${context}] ${message}`
  }

  static getLevelEmoji(level: LogLevel): string {
    const emojis = {
      [LogLevel.DEBUG]: '🐛',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.SUCCESS]: '✅',
    }
    return emojis[level] || '📝'
  }

  static getTranslatedMessage(key: string, params?: Record<string, unknown>): string {
    try {
      return i18n.global.t(key, params || {})
    } catch {
      return key
    }
  }

  static formatLogEntry(message: string, options: LogOptions): string {
    return options.translate && options.i18nKey
      ? this.getTranslatedMessage(options.i18nKey, options.i18nParams)
      : message
  }
}
