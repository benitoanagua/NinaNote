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
        sampleImages: availableImages.slice(0, 3).map((img) => img.substring(0, 30) + '...'),
      },
    })

    const distributedImages: string[] = []

    for (let i = 0; i < tweetCount; i++) {
      try {
        let imageUrl = ''

        // Estrategia de distribución mejorada
        if (availableImages.length > 0) {
          // Usar imágenes disponibles de manera round-robin
          const imageIndex = i % availableImages.length
          const selectedImage = availableImages[imageIndex]

          if (isValidImageUrl(selectedImage)) {
            // Usar imagen real con overlay numerado
            imageUrl = await imageGenerator.generateNumberedImage(i, selectedImage)
            logger.debug(`Imagen con overlay generada para tweet ${i + 1}`, {
              context: 'ImageManager',
              data: { imageUrl: selectedImage.substring(0, 50) + '...' },
            })
          } else {
            // Imagen inválida, generar sólida
            imageUrl = await imageGenerator.generateNumberedImage(i)
            logger.warn(`Imagen inválida, usando sólida para tweet ${i + 1}`, {
              context: 'ImageManager',
            })
          }
        } else {
          // No hay imágenes, generar sólida
          imageUrl = await imageGenerator.generateNumberedImage(i)
          logger.debug(`Imagen sólida generada para tweet ${i + 1}`, {
            context: 'ImageManager',
          })
        }

        distributedImages.push(imageUrl)
      } catch (error) {
        logger.error(`Error generando imagen para tweet ${i + 1}`, {
          context: 'ImageManager',
          data: error,
        })
        distributedImages.push('') // Fallback a sin imagen
      }
    }

    const successfulImages = distributedImages.filter((img) => img && img !== '')
    logger.success('Imágenes distribuidas exitosamente', {
      context: 'ImageManager',
      data: {
        distributed: successfulImages.length,
        total: distributedImages.length,
        successRate: Math.round((successfulImages.length / distributedImages.length) * 100),
      },
    })

    return distributedImages
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
      let newImageUrl = ''

      if (tweet.imageUrl && !tweet.imageUrl.startsWith('data:image/')) {
        // Intentar regenerar con la misma imagen de base
        newImageUrl = await imageGenerator.generateNumberedImage(index, tweet.imageUrl)
        logger.info(`Imagen regenerada para tweet ${index + 1}`, {
          context: 'ImageManager',
        })
      } else {
        // Generar nueva imagen sólida
        newImageUrl = await imageGenerator.generateNumberedImage(index)
        logger.info(`Imagen de fallback generada para tweet ${index + 1}`, {
          context: 'ImageManager',
        })
      }

      const updatedTweets = [...allTweets]
      updatedTweets[index] = {
        ...updatedTweets[index],
        imageUrl: newImageUrl,
      }

      return updatedTweets
    } catch (error) {
      logger.error(`Error manejando fallo de imagen para tweet ${index + 1}`, {
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

  const extractValidImages = (images: string[]): string[] => {
    const validImages = images.filter((img) => isValidImageUrl(img)).slice(0, 10) // Límite de 10 imágenes

    logger.debug('Imágenes validadas extraídas', {
      context: 'ImageManager',
      data: {
        originalCount: images.length,
        validCount: validImages.length,
        sample: validImages.slice(0, 3).map((img) => img.substring(0, 30) + '...'),
      },
    })

    return validImages
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
