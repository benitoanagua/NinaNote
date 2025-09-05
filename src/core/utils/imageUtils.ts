import { ImageGenerator } from './imageGenerator'

export class ImageUtils {
  // Elimina las URLs de placeholder externas
  static readonly PLACEHOLDER_IMAGES: string[] = []

  // Verificar si una URL de imagen es válida
  static isValidImageUrl(url: string | null): boolean {
    if (!url) return false

    // Las imágenes generadas localmente son siempre válidas
    if (url.startsWith('data:image/')) return true

    try {
      const parsedUrl = new URL(url)
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      const validDomains = ['images.unsplash.com', 'picsum.photos']

      // Verificar extensión
      const hasValidExtension = validExtensions.some((ext) =>
        parsedUrl.pathname.toLowerCase().endsWith(ext),
      )

      // Verificar dominio
      const hasValidDomain = validDomains.some((domain) => parsedUrl.hostname.includes(domain))

      return hasValidExtension || hasValidDomain
    } catch {
      return false
    }
  }

  // Obtener imagen generada localmente por índice
  static getGeneratedImage(index: number, total: number): string {
    return ImageGenerator.generateNumberedImage(index, total)
  }

  // Obtener imagen de gradiente
  static getGradientImage(index: number, total: number): string {
    return ImageGenerator.generateGradientImage(index, total)
  }

  // Extraer todas las imágenes de un documento HTML
  static extractAllImages(doc: Document): string[] {
    const images: string[] = []

    // Extraer Open Graph images
    const ogImage = doc.querySelector('meta[property="og:image"]')
    if (ogImage && ogImage.getAttribute('content')) {
      const imageUrl = ogImage.getAttribute('content')!
      if (this.isValidImageUrl(imageUrl)) {
        images.push(imageUrl)
      }
    }

    // Extraer Twitter images
    const twitterImage = doc.querySelector('meta[name="twitter:image"]')
    if (twitterImage && twitterImage.getAttribute('content')) {
      const imageUrl = twitterImage.getAttribute('content')!
      if (this.isValidImageUrl(imageUrl)) {
        images.push(imageUrl)
      }
    }

    // Extraer imágenes de contenido (solo las más relevantes)
    const contentImages = Array.from(doc.querySelectorAll('img'))
      .map((img) => img.src)
      .filter((src) => this.isValidImageUrl(src))
      .slice(0, 5) // Limitar a 5 imágenes para evitar demasiadas

    images.push(...contentImages)

    // Filtrar duplicados y URLs inválidas
    return Array.from(new Set(images)).filter((url) => this.isValidImageUrl(url))
  }

  // Distribuir imágenes para los tweets
  static distributeImagesForTweets(availableImages: string[], tweetCount: number): string[] {
    const distributedImages: string[] = []

    if (availableImages.length === 0) {
      // Si no hay imágenes, generar una para cada tweet
      for (let i = 0; i < tweetCount; i++) {
        distributedImages.push(this.getGeneratedImage(i, tweetCount))
      }
    } else if (availableImages.length === 1) {
      // Si hay solo una imagen, usarla para el primer tweet y generar las demás
      distributedImages.push(availableImages[0])
      for (let i = 1; i < tweetCount; i++) {
        // Crear variaciones basadas en la primera imagen
        distributedImages.push(this.getGeneratedImage(i, tweetCount))
      }
    } else {
      // Si hay múltiples imágenes, distribuirlas equitativamente
      for (let i = 0; i < tweetCount; i++) {
        if (i < availableImages.length) {
          distributedImages.push(availableImages[i])
        } else {
          // Si hay más tweets que imágenes, reciclar las imágenes
          distributedImages.push(availableImages[i % availableImages.length])
        }
      }
    }

    return distributedImages
  }
}
