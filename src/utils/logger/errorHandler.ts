import i18n from '@/i18n'
import { logger } from './Logger'
import { AppError } from './errorFactory'
import { ErrorCodes } from './errorCodes'

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
    ErrorCodes.UNKNOWN_ERROR,
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
