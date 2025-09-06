import { logger } from '@/utils/logger'
import { imageGenerator } from '@/core/utils/imageGenerator'
import type { ThreadTweet } from '@/core/types'

export const useImageManager = () => {
  const isValidImageUrl = (url: string | null): boolean => {
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

  const distributeImagesToTweets = async (
    availableImages: string[],
    tweetCount: number,
  ): Promise<string[]> => {
    logger.info('Distribuyendo imágenes a tweets', {
      context: 'ImageManager',
      data: {
        availableImages: availableImages.length,
        tweetCount,
        availableImagesSample: availableImages
          .slice(0, 3)
          .map((img) => img.substring(0, 30) + '...'),
      },
    })

    const distributedImages: string[] = []

    for (let i = 0; i < tweetCount; i++) {
      try {
        let imageUrl = ''

        // Comportamiento según las reglas especificadas
        if (availableImages.length === 0) {
          // CASO 4: No hay imágenes - generar sólida con numeración
          imageUrl = await imageGenerator.generateNumberedImage(i)
          logger.debug(`Caso 4: Imagen sólida generada para tweet ${i + 1}`, {
            context: 'ImageManager',
          })
        } else if (i < availableImages.length) {
          // CASO 1 y 2: Hay imagen disponible para este índice
          if (i === 0 && availableImages.length === 1) {
            // CASO 2: Solo una imagen - primera imagen sin modificar
            imageUrl = availableImages[0]
            logger.debug(`Caso 2: Imagen original sin modificar para tweet ${i + 1}`, {
              context: 'ImageManager',
            })
          } else {
            // CASO 1: Imagen disponible - usar tal cual
            imageUrl = availableImages[i]
            logger.debug(`Caso 1: Imagen disponible para tweet ${i + 1}`, {
              context: 'ImageManager',
            })
          }
        } else {
          // CASO 3: Más tweets que imágenes - usar primera imagen con overlay
          imageUrl = await imageGenerator.generateNumberedImage(i, availableImages[0])
          logger.debug(`Caso 3: Imagen con overlay para tweet ${i + 1}`, {
            context: 'ImageManager',
            data: { baseImage: availableImages[0].substring(0, 30) + '...' },
          })
        }

        distributedImages.push(imageUrl)
      } catch (error) {
        logger.error(`Error generando imagen para tweet ${i + 1}`, {
          context: 'ImageManager',
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

    const stats = getDistributionStats(availableImages.length, tweetCount, distributedImages)
    logger.success('Imágenes distribuidas exitosamente', {
      context: 'ImageManager',
      data: stats,
    })

    return distributedImages
  }

  const getDistributionStats = (
    availableCount: number,
    tweetCount: number,
    distributed: string[],
  ) => {
    const originalImages = distributed.filter((img) => img && !img.startsWith('data:image/')).length
    const generatedImages = distributed.filter((img) => img && img.startsWith('data:image/')).length
    const noImages = distributed.filter((img) => !img).length

    return {
      availableImages: availableCount,
      tweetCount,
      originalImagesUsed: originalImages,
      generatedImages: generatedImages,
      tweetsWithoutImages: noImages,
      distributionCase: getDistributionCase(availableCount, tweetCount),
    }
  }

  const getDistributionCase = (availableCount: number, tweetCount: number): string => {
    if (availableCount === 0) return 'Caso 4: Sin imágenes - todas generadas'
    if (availableCount === 1 && tweetCount > 1)
      return 'Caso 2: 1 imagen - primera original, resto con overlay'
    if (availableCount >= tweetCount) return 'Caso 1: Suficientes imágenes - todas originales'
    return 'Caso 3: Más tweets que imágenes - algunas con overlay'
  }

  const filterContentImages = (images: string[], url: string): string[] => {
    const filteredImages = images.filter((imageUrl) => {
      // Excluir imágenes comunes de publicidad/header
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

    logger.debug('Imágenes filtradas (removida publicidad/header)', {
      context: 'ImageManager',
      data: {
        originalCount: images.length,
        filteredCount: filteredImages.length,
        removedCount: images.length - filteredImages.length,
        sample: filteredImages.slice(0, 3).map((img) => img.substring(0, 30) + '...'),
      },
    })

    return filteredImages.slice(0, 10) // Limitar a 10 imágenes máximo
  }

  const sortImagesByRelevance = (images: string[]): string[] => {
    // Asumir que las imágenes más grandes son más relevantes
    // Las URLs con dimensiones en el nombre suelen ser más grandes
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
    // Primero filtrar imágenes válidas
    const validImages = images.filter((img) => isValidImageUrl(img))

    // Luego filtrar contenido no deseado
    const contentImages = filterContentImages(validImages, sourceUrl || '')

    // Ordenar por relevancia
    const sortedImages = sortImagesByRelevance(contentImages)

    logger.debug('Imágenes de contenido extraídas', {
      context: 'ImageManager',
      data: {
        originalCount: images.length,
        validCount: validImages.length,
        contentCount: contentImages.length,
        finalCount: sortedImages.length,
        finalImages: sortedImages.slice(0, 3).map((img) => img.substring(0, 30) + '...'),
      },
    })

    return sortedImages
  }

  const handleTweetImageError = async (
    tweet: ThreadTweet,
    index: number,
    allTweets: ThreadTweet[],
  ): Promise<ThreadTweet[]> => {
    logger.warn(`Error cargando imagen para tweet ${index + 1}`, {
      context: 'ImageManager',
      data: { imageUrl: tweet.imageUrl ? tweet.imageUrl.substring(0, 50) + '...' : 'none' },
    })

    try {
      // Siempre generar imagen sólida como fallback
      const newImageUrl = await imageGenerator.generateNumberedImage(index)

      const updatedTweets = [...allTweets]
      updatedTweets[index] = {
        ...updatedTweets[index],
        imageUrl: newImageUrl,
      }

      logger.info(`Imagen de fallback generada para tweet ${index + 1}`, {
        context: 'ImageManager',
      })

      return updatedTweets
    } catch (error) {
      logger.error(`Error manejando fallo de imagen para tweet ${index + 1}`, {
        // ← Cambiado i por index
        context: 'ImageManager',
        data: error,
      })

      // Fallback: eliminar la imagen problemática
      const updatedTweets = [...allTweets]
      updatedTweets[index] = {
        ...updatedTweets[index],
        imageUrl: '',
      }

      return updatedTweets
    }
  }

  const refreshAllTweetImages = async (tweets: ThreadTweet[]): Promise<ThreadTweet[]> => {
    logger.info('Actualizando todas las imágenes de tweets', {
      context: 'ImageManager',
      data: { tweetCount: tweets.length },
    })

    const updatedTweets = [...tweets]

    for (let i = 0; i < updatedTweets.length; i++) {
      try {
        const currentImageUrl = updatedTweets[i].imageUrl
        let newImageUrl = ''

        if (currentImageUrl && isValidImageUrl(currentImageUrl)) {
          // Regenerar manteniendo la imagen base
          newImageUrl = await imageGenerator.generateNumberedImage(i, currentImageUrl)
        } else {
          // Generar nueva imagen sólida
          newImageUrl = await imageGenerator.generateNumberedImage(i)
        }

        updatedTweets[i] = {
          ...updatedTweets[i],
          imageUrl: newImageUrl,
        }
      } catch (error) {
        logger.error(`Error actualizando imagen para tweet ${i + 1}`, {
          context: 'ImageManager',
          data: error,
        })
        // Mantener la imagen existente o vacía en caso de error
      }
    }

    return updatedTweets
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

  const testImageAccessibility = async (url: string): Promise<boolean> => {
    if (!isValidImageUrl(url)) return false

    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)

      // Timeout después de 5 segundos
      const timeout = setTimeout(() => resolve(false), 5000)

      img.onload = () => {
        clearTimeout(timeout)
        resolve(true)
      }

      img.onerror = () => {
        clearTimeout(timeout)
        resolve(false)
      }

      img.src = url
    })
  }

  return {
    // Métodos principales
    distributeImagesToTweets,
    handleTweetImageError,
    refreshAllTweetImages,
    extractValidImages,
    getImageStats,
    testImageAccessibility,

    // Utilidades
    isValidImageUrl,

    // Información de estado
    hasImages: (tweets: ThreadTweet[]) => tweets.some((t) => t.imageUrl && t.imageUrl !== ''),
    imageCount: (tweets: ThreadTweet[]) =>
      tweets.filter((t) => t.imageUrl && t.imageUrl !== '').length,
  }
}
