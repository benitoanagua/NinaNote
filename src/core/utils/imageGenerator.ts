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
        // MODO CON IMAGEN BASE: 3 capas
        await this.drawImageWithLayers(ctx, baseImageUrl, index, canvas.width, canvas.height)
      } else {
        // MODO SIN IMAGEN BASE: 2 capas
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

  private async drawImageWithLayers(
    ctx: CanvasRenderingContext2D,
    baseImageUrl: string,
    index: number,
    width: number,
    height: number,
  ): Promise<void> {
    try {
      // 1. PRIMERA CAPA: Imagen base con proxy para evitar CORS
      const imageUrl = await this.proxy.getProxiedUrl(baseImageUrl)
      const image = await this.loadImage(imageUrl)

      // Dibujar imagen manteniendo aspect ratio
      const scale = Math.max(width / image.width, height / image.height)
      const scaledWidth = image.width * scale
      const scaledHeight = image.height * scale
      const x = (width - scaledWidth) / 2
      const y = (height - scaledHeight) / 2

      ctx.drawImage(image, x, y, scaledWidth, scaledHeight)

      // 2. SEGUNDA CAPA: Color sólido con transparencia (50%)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, width, height)

      // 3. TERCERA CAPA: Número centrado
      this.drawNumber(ctx, index, width, height)
    } catch (error) {
      logger.warn('Failed to draw image with layers, using solid background', {
        context: 'ImageGenerator',
        data: { error, baseImageUrl, index },
      })

      // Fallback robusto: fondo sólido + número
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

      let isResolved = false

      const onLoad = () => {
        if (!isResolved && img.width > 0 && img.height > 0) {
          isResolved = true
          clearTimeout(timeout)
          resolve(img)
        }
      }

      const onError = () => {
        if (!isResolved) {
          isResolved = true
          clearTimeout(timeout)
          reject(new Error('Failed to load image'))
        }
      }

      img.onload = onLoad
      img.onerror = onError

      // Timeout más corto para imágenes que fallan por CORS
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true
          reject(new Error('Image loading timeout'))
        }
      }, 5000) // 5 segundos en lugar de 10

      img.src = url

      // Si ya está cargada (caché)
      if (img.complete && img.width > 0 && img.height > 0) {
        onLoad()
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
