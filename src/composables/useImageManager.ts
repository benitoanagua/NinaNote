import { logger } from '@/utils/logger'
import { ImageGenerator } from '@/core/utils/imageGenerator'
import type { ThreadTweet } from '@/core/types'

export const useImageManager = () => {
  /**
   * Distribuye imágenes entre tweets, generando imágenes numeradas cuando sea necesario
   */
  const distributeImagesToTweets = async (
    availableImages: string[],
    tweetCount: number,
  ): Promise<string[]> => {
    logger.info('Distribuyendo imágenes a tweets', {
      context: 'ImageManager',
      data: { availableImages: availableImages.length, tweetCount },
    })

    const distributedImages: string[] = []

    for (let i = 0; i < tweetCount; i++) {
      try {
        let imageUrl = ''

        if (i < availableImages.length && ImageGenerator.isValidImageUrl(availableImages[i])) {
          // Usar imagen real con overlay numerado
          imageUrl = await ImageGenerator.generateNumberedImage(i, availableImages[i])
          logger.debug(`Imagen con overlay generada para tweet ${i + 1}`, {
            context: 'ImageManager',
          })
        } else if (
          availableImages.length > 0 &&
          ImageGenerator.isValidImageUrl(availableImages[0])
        ) {
          // Usar la primera imagen como base con overlay
          imageUrl = await ImageGenerator.generateNumberedImage(i, availableImages[0])
          logger.debug(`Imagen base con overlay generada para tweet ${i + 1}`, {
            context: 'ImageManager',
          })
        } else {
          // Generar imagen sólida con número
          imageUrl = await ImageGenerator.generateNumberedImage(i)
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

    logger.success('Imágenes distribuidas exitosamente', {
      context: 'ImageManager',
      data: { distributed: distributedImages.filter((img) => img).length },
    })

    return distributedImages
  }

  /**
   * Maneja errores de carga de imágenes para un tweet específico
   */
  const handleTweetImageError = async (
    tweet: ThreadTweet,
    index: number,
    allTweets: ThreadTweet[],
  ): Promise<ThreadTweet[]> => {
    logger.warn(`Error cargando imagen para tweet ${index + 1}`, {
      context: 'ImageManager',
      data: { imageUrl: tweet.imageUrl },
    })

    try {
      let newImageUrl = ''

      if (tweet.imageUrl && !tweet.imageUrl.startsWith('data:image/')) {
        // Intentar regenerar con la misma imagen de base
        newImageUrl = await ImageGenerator.generateNumberedImage(index, tweet.imageUrl)
        logger.info(`Imagen regenerada para tweet ${index + 1}`, {
          context: 'ImageManager',
        })
      } else {
        // Generar nueva imagen sólida
        newImageUrl = await ImageGenerator.generateNumberedImage(index)
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

  /**
   * Actualiza todas las imágenes de un conjunto de tweets
   */
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

        if (currentImageUrl && ImageGenerator.isValidImageUrl(currentImageUrl)) {
          // Regenerar manteniendo la imagen base
          newImageUrl = await ImageGenerator.generateNumberedImage(i, currentImageUrl)
        } else {
          // Generar nueva imagen sólida
          newImageUrl = await ImageGenerator.generateNumberedImage(i)
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

  /**
   * Extrae y valida imágenes de contenido scrapeado
   */
  const extractValidImages = (images: string[]): string[] => {
    return images.filter((img) => ImageGenerator.isValidImageUrl(img)).slice(0, 10) // Límite de 10 imágenes
  }

  /**
   * Obtiene estadísticas de imágenes en tweets
   */
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
    distributeImagesToTweets,
    handleTweetImageError,
    refreshAllTweetImages,
    extractValidImages,
    getImageStats,
  }
}
