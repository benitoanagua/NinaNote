import { logger } from '@/utils/logger'
import { imageProxy, type ImageProxy } from './imageProxy'

export class ImageGenerator {
  constructor(private proxy: ImageProxy = imageProxy) {}

  async generateNumberedImage(index: number, baseImageUrl?: string): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context not available')
      }

      // Tamaño estándar para Twitter
      canvas.width = 1200
      canvas.height = 675

      if (baseImageUrl) {
        // Modo con imagen de fondo usando proxy
        await this.drawImageWithOverlay(ctx, baseImageUrl, index, canvas.width, canvas.height)
      } else {
        // Modo sin imagen - solo color sólido
        this.drawSolidBackground(ctx, index, canvas.width, canvas.height)
        this.drawNumber(ctx, index, canvas.width, canvas.height)
      }

      return canvas.toDataURL('image/jpeg', 0.8)
    } catch (error) {
      logger.error('Error generating numbered image', {
        context: 'ImageGenerator',
        data: error,
      })
      return this.generateFallbackImage(index)
    }
  }

  private async drawImageWithOverlay(
    ctx: CanvasRenderingContext2D,
    originalImageUrl: string,
    index: number,
    width: number,
    height: number,
  ): Promise<void> {
    try {
      // 1. Obtener URL proxied
      const imageUrl = await this.proxy.getProxiedUrl(originalImageUrl)

      // 2. Cargar imagen
      const image = await this.loadImage(imageUrl)

      // 3. Dibujar imagen manteniendo aspect ratio
      const scale = Math.max(width / image.width, height / image.height)
      const scaledWidth = image.width * scale
      const scaledHeight = image.height * scale
      const x = (width - scaledWidth) / 2
      const y = (height - scaledHeight) / 2

      ctx.drawImage(image, x, y, scaledWidth, scaledHeight)

      // 4. Overlay semi-transparente
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(0, 0, width, height)

      // 5. Número centrado
      this.drawNumber(ctx, index, width, height)

      logger.debug('Image with overlay generated successfully', {
        context: 'ImageGenerator',
        data: { index, originalUrl: originalImageUrl.substring(0, 50) + '...' },
      })
    } catch (error) {
      logger.warn('Failed to draw image with overlay, using fallback', {
        context: 'ImageGenerator',
        data: error,
      })
      // Fallback a fondo sólido
      this.drawSolidBackground(ctx, index, width, height)
      this.drawNumber(ctx, index, width, height)
    }
  }

  private drawSolidBackground(
    ctx: CanvasRenderingContext2D,
    index: number,
    width: number,
    height: number,
  ): void {
    const color = this.getColorForIndex(index)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
  }

  private drawNumber(
    ctx: CanvasRenderingContext2D,
    index: number,
    width: number,
    height: number,
  ): void {
    const number = (index + 1).toString()

    // Sombra para mejor contraste
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // Texto principal
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 120px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(number, width / 2, height / 2)

    // Resetear sombra
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        if (img.width > 0 && img.height > 0) {
          resolve(img)
        } else {
          reject(new Error('Image loaded but has zero dimensions'))
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      // Timeout
      const timeout = setTimeout(() => {
        reject(new Error('Image loading timeout'))
      }, 10000)

      img.onload = () => {
        clearTimeout(timeout)
        if (img.width > 0 && img.height > 0) {
          resolve(img)
        }
      }

      img.src = url

      // Si ya está cargada
      if (img.complete && img.width > 0 && img.height > 0) {
        clearTimeout(timeout)
        resolve(img)
      }
    })
  }

  private getColorForIndex(index: number): string {
    const colors = [
      '#29AB87',
      '#2563EB',
      '#7C3AED',
      '#DC2626',
      '#D97706',
      '#059669',
      '#DB2777',
      '#7C3AED',
      '#F59E0B',
      '#10B981',
    ]
    return colors[index % colors.length]
  }

  private generateFallbackImage(index: number): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return ''

    canvas.width = 600
    canvas.height = 400

    // Fondo de color sólido
    ctx.fillStyle = this.getColorForIndex(index)
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Número
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 80px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((index + 1).toString(), canvas.width / 2, canvas.height / 2)

    return canvas.toDataURL('image/jpeg')
  }
}

// Exportar instancia singleton
export const imageGenerator = new ImageGenerator()
