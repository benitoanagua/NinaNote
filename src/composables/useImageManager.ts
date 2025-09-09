import type { ThreadTweet } from '@/core/types'
import { isValidImageUrl } from '@/core/utils/imageProxy'

export const useImageManager = () => {
  const filterContentImages = (images: string[], url: string): string[] => {
    const filteredImages = images.filter((imageUrl) => {
      const lowerUrl = imageUrl.toLowerCase()

      // Patrones comunes de imágenes no deseadas
      const unwantedPatterns = [
        'logo',
        'header',
        'footer',
        'banner',
        'ad',
        'ads',
        'advertisement',
        'social',
        'icon',
        'avatar',
        'sponsor',
        'promo',
        'widget',
        'button',
        'menu',
        'nav',
        'thumbnail',
        'placeholder',
        'pixel',
        'tracking',
      ]

      // Excluir URLs que contengan estos patrones
      const hasUnwantedPattern = unwantedPatterns.some((pattern) => lowerUrl.includes(pattern))

      // Excluir imágenes muy pequeñas (probablemente iconos)
      const isLikelyIcon =
        lowerUrl.includes('x') &&
        (lowerUrl.includes('16x16') || lowerUrl.includes('32x32') || lowerUrl.includes('64x64'))

      return !hasUnwantedPattern && !isLikelyIcon
    })

    return filteredImages.slice(0, 10) // Limitar a 10 imágenes máximo
  }

  const sortImagesByRelevance = (images: string[]): string[] => {
    // Asumir que las imágenes más grandes son más relevantes
    return images.sort((a, b) => {
      const getSizeScore = (url: string) => {
        const lowerUrl = url.toLowerCase()
        if (lowerUrl.includes('1200x') || lowerUrl.includes('1000x')) return 3
        if (lowerUrl.includes('800x') || lowerUrl.includes('600x')) return 2
        if (lowerUrl.includes('400x') || lowerUrl.includes('300x')) return 1
        return 0
      }

      return getSizeScore(b) - getSizeScore(a)
    })
  }

  const extractValidImages = (images: string[], sourceUrl?: string): string[] => {
    const validImages = images.filter((img) => isValidImageUrl(img))
    const contentImages = filterContentImages(validImages, sourceUrl || '')
    return sortImagesByRelevance(contentImages)
  }

  const getImageStats = (tweets: ThreadTweet[]) => {
    const tweetsWithImages = tweets.filter((t) => t.imageUrl && t.imageUrl !== '')
    const uniqueImageUrls = new Set(tweetsWithImages.map((t) => t.imageUrl))

    return {
      totalTweets: tweets.length,
      tweetsWithImages: tweetsWithImages.length,
      uniqueImages: uniqueImageUrls.size,
      imageCoverage: Math.round((tweetsWithImages.length / tweets.length) * 100),
    }
  }

  return {
    extractValidImages,
    getImageStats,
    isValidImageUrl,
  }
}
