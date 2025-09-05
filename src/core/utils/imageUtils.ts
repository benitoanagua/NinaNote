import { ImageGenerator } from './imageGenerator'

export class ImageUtils {
  static isValidImageUrl(url: string | null): boolean {
    if (!url) return false

    if (url.startsWith('data:image/')) return true

    try {
      const parsedUrl = new URL(url)
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

      const hasValidExtension = validExtensions.some((ext) =>
        parsedUrl.pathname.toLowerCase().endsWith(ext),
      )

      return hasValidExtension
    } catch {
      return false
    }
  }

  static async getGeneratedImage(
    index: number,
    total: number,
    baseImageUrl?: string,
  ): Promise<string> {
    return ImageGenerator.generateNumberedImage(index, total, baseImageUrl)
  }

  static extractAllImages(doc: Document): string[] {
    const images: string[] = []

    const ogImage = doc.querySelector('meta[property="og:image"]')
    if (ogImage && ogImage.getAttribute('content')) {
      const imageUrl = ogImage.getAttribute('content')!
      if (this.isValidImageUrl(imageUrl)) {
        images.push(imageUrl)
      }
    }

    const twitterImage = doc.querySelector('meta[name="twitter:image"]')
    if (twitterImage && twitterImage.getAttribute('content')) {
      const imageUrl = twitterImage.getAttribute('content')!
      if (this.isValidImageUrl(imageUrl)) {
        images.push(imageUrl)
      }
    }

    const contentImages = Array.from(doc.querySelectorAll('img'))
      .map((img) => img.src)
      .filter((src) => this.isValidImageUrl(src))
      .slice(0, 5)

    images.push(...contentImages)

    return Array.from(new Set(images)).filter((url) => this.isValidImageUrl(url))
  }

  static async distributeImagesForTweets(
    availableImages: string[],
    tweetCount: number,
  ): Promise<string[]> {
    const distributedImages: string[] = []

    if (availableImages.length === 0) {
      for (let i = 0; i < tweetCount; i++) {
        const image = await this.getGeneratedImage(i, tweetCount)
        distributedImages.push(image)
      }
    } else {
      for (let i = 0; i < tweetCount; i++) {
        if (i < availableImages.length) {
          distributedImages.push(availableImages[i])
        } else {
          const baseImage = availableImages[0]
          const image = await this.getGeneratedImage(i, tweetCount, baseImage)
          distributedImages.push(image)
        }
      }
    }

    return distributedImages
  }
}
