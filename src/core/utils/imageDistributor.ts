import { imageGenerator } from './imageGenerator'
import { logger } from '@/utils/logger'

export class ImageDistributor {
  async distributeImages(availableImages: string[], tweetCount: number): Promise<string[]> {
    logger.info('Distributing images to tweets', {
      context: 'ImageDistributor',
      data: { availableImages: availableImages.length, tweetCount },
    })

    const distributedImages: string[] = []

    for (let i = 0; i < tweetCount; i++) {
      try {
        const imageUrl = await this.getImageForTweet(i, availableImages)
        distributedImages.push(imageUrl)
      } catch (error) {
        logger.error(`Error getting image for tweet ${i + 1}`, {
          context: 'ImageDistributor',
          data: error,
        })
        // Fallback: imagen sólida
        try {
          const fallbackImage = await imageGenerator.generateNumberedImage(i)
          distributedImages.push(fallbackImage)
        } catch {
          distributedImages.push('')
        }
      }
    }

    return distributedImages
  }

  async getImageForTweet(tweetIndex: number, availableImages: string[]): Promise<string> {
    // REGLAS DE DISTRIBUCIÓN (única fuente de verdad)
    if (availableImages.length === 0) {
      // CASO 1: No hay imágenes - generar sólida con numeración
      return await imageGenerator.generateNumberedImage(tweetIndex)
    } else if (tweetIndex === 0 && availableImages.length >= 1) {
      // CASO 2: Primer tweet - usar primera imagen original
      return availableImages[0]
    } else if (tweetIndex < availableImages.length) {
      // CASO 3: Hay imagen disponible para este índice - usar tal cual
      return availableImages[tweetIndex]
    } else {
      // CASO 4: Más tweets que imágenes - usar primera imagen con overlay
      return await imageGenerator.generateNumberedImage(tweetIndex, availableImages[0])
    }
  }

  getDistributionStats(availableCount: number, tweetCount: number) {
    let caseType: string
    let description: string

    if (availableCount === 0) {
      caseType = 'CASE_1_NO_IMAGES'
      description = 'No images - all generated'
    } else if (availableCount === 1 && tweetCount > 1) {
      caseType = 'CASE_2_SINGLE_IMAGE'
      description = '1 image - first original, rest with overlay'
    } else if (availableCount >= tweetCount) {
      caseType = 'CASE_3_ENOUGH_IMAGES'
      description = 'Enough images - all original'
    } else {
      caseType = 'CASE_4_MORE_TWEETS'
      description = 'More tweets than images - some with overlay'
    }

    return { caseType, description }
  }
}

export const imageDistributor = new ImageDistributor()
