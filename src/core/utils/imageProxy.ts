import { logger } from '@/utils/logger'

export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false
  if (url.startsWith('data:image/')) return true

  try {
    const parsedUrl = new URL(url)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']
    return validExtensions.some((ext) => parsedUrl.pathname.toLowerCase().endsWith(ext))
  } catch {
    return false
  }
}

export const getDomainFromUrl = (url: string): string => {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return ''
  }
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
