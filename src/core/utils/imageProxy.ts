import { logger } from '@/utils/logger'

export interface ImageProxy {
  getProxiedUrl(originalUrl: string): Promise<string>
  preloadImage(url: string): Promise<boolean>
}

export class PublicImageProxy implements ImageProxy {
  private readonly proxies = [
    {
      name: 'corsproxy',
      url: (originalUrl: string) => `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`,
    },
    {
      name: 'weserv',
      url: (originalUrl: string) =>
        `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&output=jpg&w=1200&h=675`,
    },
    {
      name: 'allorigins',
      url: (originalUrl: string) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
    },
  ]

  async getProxiedUrl(originalUrl: string): Promise<string> {
    logger.debug('Getting proxied URL for image', {
      context: 'ImageProxy',
      data: { originalUrl: originalUrl.substring(0, 50) + '...' },
    })

    // Intentar cada proxy en orden
    for (const proxy of this.proxies) {
      try {
        const proxiedUrl = proxy.url(originalUrl)
        const isValid = await this.testProxy(proxiedUrl)

        if (isValid) {
          logger.debug(`Using proxy: ${proxy.name}`, {
            context: 'ImageProxy',
            data: { proxiedUrl: proxiedUrl.substring(0, 50) + '...' },
          })
          return proxiedUrl
        }
      } catch (error) {
        logger.warn(`Proxy ${proxy.name} failed`, {
          context: 'ImageProxy',
          data: error,
        })
      }
    }

    throw new Error('All image proxies failed')
  }

  async preloadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url

      // Timeout después de 5 segundos
      setTimeout(() => resolve(false), 5000)
    })
  }

  private async testProxy(proxyUrl: string): Promise<boolean> {
    try {
      // Test rápido con HEAD request
      const response = await fetch(proxyUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export class DirectImageProxy implements ImageProxy {
  async getProxiedUrl(originalUrl: string): Promise<string> {
    // Devolver URL directa (para imágenes que no tienen CORS)
    return originalUrl
  }

  async preloadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url

      setTimeout(() => resolve(false), 5000)
    })
  }
}

export class SmartImageProxy implements ImageProxy {
  private publicProxy = new PublicImageProxy()
  private directProxy = new DirectImageProxy()

  async getProxiedUrl(originalUrl: string): Promise<string> {
    logger.debug('Smart proxy selecting best method for image', {
      context: 'ImageProxy',
      data: { originalUrl: originalUrl.substring(0, 50) + '...' },
    })

    try {
      // Primero intentar directo (más rápido si funciona)
      const directWorks = await this.directProxy.preloadImage(originalUrl)
      if (directWorks) {
        logger.debug('Using direct image loading (CORS allowed)', {
          context: 'ImageProxy',
        })
        return originalUrl
      }

      // Si directo falla, usar proxy público
      logger.debug('Direct loading failed, using public proxy', {
        context: 'ImageProxy',
      })
      return await this.publicProxy.getProxiedUrl(originalUrl)
    } catch (error) {
      logger.error('Smart proxy failed, using direct as fallback', {
        context: 'ImageProxy',
        data: error,
      })
      return originalUrl // Fallback a URL directa
    }
  }

  async preloadImage(url: string): Promise<boolean> {
    return this.directProxy.preloadImage(url)
  }
}

// Exportar instancia singleton
export const imageProxy = new SmartImageProxy()
