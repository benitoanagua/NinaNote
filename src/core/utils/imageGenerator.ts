export class ImageGenerator {
  static async generateNumberedImage(index: number, baseImageUrl?: string): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context not available')
      }

      // Tamaño estándar para imágenes de Twitter
      canvas.width = 1200
      canvas.height = 675

      if (baseImageUrl) {
        // Modo con imagen de fondo
        await this.drawImageWithOverlay(ctx, baseImageUrl, index, canvas.width, canvas.height)
      } else {
        // Modo sin imagen - solo color sólido
        this.drawSolidBackground(ctx, index, canvas.width, canvas.height)
        this.drawNumber(ctx, index, canvas.width, canvas.height)
      }

      return canvas.toDataURL('image/jpeg', 0.8)
    } catch (error) {
      console.error('Error generating numbered image:', error)
      // Fallback a imagen simple
      return this.generateFallbackImage(index)
    }
  }

  private static async drawImageWithOverlay(
    ctx: CanvasRenderingContext2D,
    imageUrl: string,
    index: number,
    width: number,
    height: number,
  ): Promise<void> {
    try {
      // 1. Primera capa: Imagen de fondo
      const image = await this.loadImage(imageUrl)

      // Dibujar imagen manteniendo aspect ratio
      const scale = Math.max(width / image.width, height / image.height)
      const scaledWidth = image.width * scale
      const scaledHeight = image.height * scale
      const x = (width - scaledWidth) / 2
      const y = (height - scaledHeight) / 2

      ctx.drawImage(image, x, y, scaledWidth, scaledHeight)

      // 2. Segunda capa: Color sólido con transparencia (overlay)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)' // Overlay oscuro semi-transparente
      ctx.fillRect(0, 0, width, height)

      // 3. Tercera capa: Número
      this.drawNumber(ctx, index, width, height)
    } catch (error) {
      console.warn('Failed to load background image, using fallback:', error)
      // Fallback a fondo sólido
      this.drawSolidBackground(ctx, index, width, height)
      this.drawNumber(ctx, index, width, height)
    }
  }

  private static drawSolidBackground(
    ctx: CanvasRenderingContext2D,
    index: number,
    width: number,
    height: number,
  ): void {
    const color = this.getColorForIndex(index)
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
  }

  private static drawNumber(
    ctx: CanvasRenderingContext2D,
    index: number,
    width: number,
    height: number,
  ): void {
    const number = (index + 1).toString()

    // Sombra del texto para mejor contraste
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

  private static async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous' // Important for CORS

      img.onload = () => {
        // Verificar que la imagen se cargó correctamente
        if (img.width > 0 && img.height > 0) {
          resolve(img)
        } else {
          reject(new Error('Image failed to load'))
        }
      }

      img.onerror = (error) => {
        reject(new Error(`Failed to load image: ${error}`))
      }

      // Timeout para evitar que se quede colgado
      const timeout = setTimeout(() => {
        reject(new Error('Image loading timeout'))
      }, 10000)

      img.onload = () => {
        clearTimeout(timeout)
        if (img.width > 0 && img.height > 0) {
          resolve(img)
        } else {
          reject(new Error('Image loaded but has zero dimensions'))
        }
      }

      img.onerror = () => {
        clearTimeout(timeout)
        reject(new Error('Failed to load image'))
      }

      img.src = url

      // Si la imagen ya está en cache, puede que no dispare onload
      if (img.complete && img.width > 0 && img.height > 0) {
        clearTimeout(timeout)
        resolve(img)
      }
    })
  }

  private static getColorForIndex(index: number): string {
    const colors = [
      '#29AB87', // Verde
      '#2563EB', // Azul
      '#7C3AED', // Púrpura
      '#DC2626', // Rojo
      '#D97706', // Ámbar
      '#059669', // Emerald
      '#DB2777', // Pink
      '#7C3AED', // Purple
      '#F59E0B', // Amber
      '#10B981', // Green
    ]

    return colors[index % colors.length]
  }

  private static generateFallbackImage(index: number): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return '' // Fallback extremo
    }

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

  // Método auxiliar para verificar si una URL de imagen es válida
  static isValidImageUrl(url: string): boolean {
    if (!url) return false
    if (url.startsWith('data:image/')) return true

    try {
      const parsedUrl = new URL(url)
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']
      const hasValidExtension = validExtensions.some((ext) =>
        parsedUrl.pathname.toLowerCase().endsWith(ext),
      )
      return hasValidExtension
    } catch {
      return false
    }
  }
}
