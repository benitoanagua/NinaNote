export class ImageGenerator {
  static generateNumberedImage(
    index: number,
    total: number,
    baseImageUrl?: string,
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve('')
        return
      }

      // Tamaño del canvas
      canvas.width = 600
      canvas.height = 400

      const drawFinalImage = () => {
        // Color de fondo con transparencia del 75%
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Dibujar número grande en el centro (horizontal y vertical)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 120px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText((index + 1).toString(), canvas.width / 2, canvas.height / 2)

        // Devolver la imagen como data URL
        resolve(canvas.toDataURL('image/jpeg'))
      }

      if (baseImageUrl) {
        // Si hay una imagen base, cargarla primero
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.onload = () => {
          // Dibujar la imagen base
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          drawFinalImage()
        }
        img.onerror = () => {
          // Si falla la carga de la imagen base, usar color sólido
          const backgroundColor = this.getColorForIndex(index)
          ctx.fillStyle = backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          drawFinalImage()
        }
        img.src = baseImageUrl
      } else {
        // Si no hay imagen base, usar color sólido
        const backgroundColor = this.getColorForIndex(index)
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        drawFinalImage()
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
    ]

    return colors[index % colors.length]
  }

  static generateGradientImage(index: number, total: number): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return ''

    canvas.width = 600
    canvas.height = 400

    // Crear gradiente
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, this.getColorForIndex(index))
    gradient.addColorStop(1, this.getColorForIndex((index + 2) % 5))

    // Dibujar fondo con gradiente
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Añadir capa semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dibujar número centrado
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 120px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((index + 1).toString(), canvas.width / 2, canvas.height / 2)

    return canvas.toDataURL('image/jpeg')
  }
}
