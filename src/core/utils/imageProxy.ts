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
    {
      name: 'corsanywhere',
      url: (originalUrl: string) => `https://cors-anywhere.herokuapp.com/${originalUrl}`,
    },
  ]

  async getProxiedUrl(originalUrl: string): Promise<string> {
    logger.debug('Getting proxied URL for image', {
      context: 'ImageProxy',
      data: { originalUrl: originalUrl.substring(0, 50) + '...' },
    })

    // Verificar primero si la URL es válida para proxies
    if (!this.isValidUrlForProxy(originalUrl)) {
      logger.warn('URL not suitable for proxy, returning original', {
        context: 'ImageProxy',
        data: { originalUrl: originalUrl.substring(0, 50) + '...' },
      })
      return originalUrl
    }

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

    logger.error('All image proxies failed', {
      context: 'ImageProxy',
      data: { originalUrl: originalUrl.substring(0, 50) + '...' },
    })
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

  private isValidUrlForProxy(url: string): boolean {
    try {
      const parsedUrl = new URL(url)

      // No intentar proxy con URLs locales o inválidas
      const isLocal =
        parsedUrl.hostname.includes('localhost') ||
        parsedUrl.hostname.includes('127.0.0.1') ||
        parsedUrl.hostname.includes('::1') ||
        parsedUrl.hostname === ''

      const isValidProtocol = parsedUrl.protocol.startsWith('http')

      return !isLocal && isValidProtocol
    } catch {
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

    // Primero verificar si la URL es válida
    if (!this.isValidExternalUrl(originalUrl)) {
      logger.warn('URL is not valid or is local, using fallback', {
        context: 'ImageProxy',
        data: { originalUrl: originalUrl.substring(0, 50) + '...' },
      })
      return originalUrl
    }

    try {
      // Primero intentar directo (más rápido si funciona)
      const directWorks = await this.testDirectAccess(originalUrl)
      if (directWorks) {
        logger.debug('Using direct image loading (CORS allowed)', {
          context: 'ImageProxy',
          data: { originalUrl: originalUrl.substring(0, 50) + '...' },
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

  private async testDirectAccess(url: string): Promise<boolean> {
    try {
      // Test más robusto para acceso directo
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(3000),
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  private isValidExternalUrl(url: string): boolean {
    try {
      const parsed = new URL(url)

      // Excluir localhost y URLs inválidas
      const isLocal =
        parsed.hostname.includes('localhost') ||
        parsed.hostname.includes('127.0.0.1') ||
        parsed.hostname.includes('::1') ||
        parsed.hostname === ''

      const isValidProtocol = parsed.protocol.startsWith('http')
      const hasValidTld = parsed.hostname.includes('.') // Debe tener un TLD

      return !isLocal && isValidProtocol && hasValidTld
    } catch {
      return false
    }
  }

  async batchTestUrls(urls: string[]): Promise<{ url: string; accessible: boolean }[]> {
    const results = await Promise.all(
      urls.map(async (url) => {
        const accessible = await this.testDirectAccess(url)
        return { url, accessible }
      }),
    )

    logger.debug('Batch URL accessibility test completed', {
      context: 'ImageProxy',
      data: {
        total: urls.length,
        accessible: results.filter((r) => r.accessible).length,
        inaccessible: results.filter((r) => !r.accessible).length,
      },
    })

    return results
  }
}

// Exportar instancia singleton
export const imageProxy = new SmartImageProxy()

export const getDomainFromUrl = (url: string): string => {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return ''
  }
}

export const isSameDomain = (url1: string, url2: string): boolean => {
  return getDomainFromUrl(url1) === getDomainFromUrl(url2)
}

export const normalizeImageUrl = (url: string, baseUrl: string): string => {
  if (!url) return url

  try {
    // Si ya es una URL absoluta, devolver tal cual
    if (url.startsWith('http')) return url

    // Si es protocolo-relative, agregar https:
    if (url.startsWith('//')) return `https:${url}`

    // Si es relativa, agregar base URL
    if (url.startsWith('/')) {
      const baseDomain = getDomainFromUrl(baseUrl) || baseUrl
      return `https://${baseDomain}${url}`
    }

    // Para URLs relativas sin slash
    const baseDomain = getDomainFromUrl(baseUrl) || baseUrl
    return `https://${baseDomain}/${url}`
  } catch {
    return url // Fallback a URL original
  }
}
