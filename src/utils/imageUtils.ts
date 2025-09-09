import { logger } from '@/utils/logger'
import type { ThreadTweet } from '@/core/types'

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

export const logImageDetails = (images: string[], context: string) => {
  if (images.length === 0) {
    logger.info('No images found', { context })
    return
  }

  logger.info('Image analysis completed', {
    context,
    data: {
      totalImages: images.length,
      validImages: images.filter((img) => isValidImageUrl(img)).length,
      sample: images.slice(0, 3).map((img) => ({
        url: img.substring(0, 40) + (img.length > 40 ? '...' : ''),
        valid: isValidImageUrl(img),
      })),
    },
  })
}

export const filterValidImages = (images: string[]): string[] => {
  return images.filter((img) => isValidImageUrl(img))
}

export interface ImageStats {
  totalTweets: number
  tweetsWithImages: number
  totalAvailableImages: number
  usedImages: number
  unusedImages: number
  coverage: number
  imageCoverage: number
}

export const getImageAssignmentStats = (tweets: ThreadTweet[], images: string[]): ImageStats => {
  const tweetsWithImages = tweets.filter((t) => t.imageUrl && isValidImageUrl(t.imageUrl))
  const usedImages = new Set(tweetsWithImages.map((t) => t.imageUrl))
  const validImages = images.filter((img) => isValidImageUrl(img))

  const coverage = Math.round((tweetsWithImages.length / tweets.length) * 100)

  return {
    totalTweets: tweets.length,
    tweetsWithImages: tweetsWithImages.length,
    totalAvailableImages: validImages.length,
    usedImages: usedImages.size,
    unusedImages: validImages.filter((img) => !usedImages.has(img)).length,
    coverage: coverage,
    imageCoverage: coverage,
  }
}
