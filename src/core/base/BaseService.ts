import { logger } from '@/utils/logger'

export abstract class BaseService {
  protected serviceName: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  protected logStart(action: string, data?: any): void {
    logger.info(`${this.serviceName}: ${action}`, {
      context: this.serviceName,
      data,
    })
  }

  protected logSuccess(message: string, data?: any): void {
    logger.success(`${this.serviceName}: ${message}`, {
      context: this.serviceName,
      data,
    })
  }

  protected logError(message: string, error: any): void {
    logger.error(`${this.serviceName}: ${message}`, {
      context: this.serviceName,
      data: error,
    })
  }

  protected logWarning(message: string, data?: any): void {
    logger.warn(`${this.serviceName}: ${message}`, {
      context: this.serviceName,
      data,
    })
  }
}
