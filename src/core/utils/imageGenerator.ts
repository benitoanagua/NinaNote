export class ImageGenerator {
  static generateNumberedImage(index: number, total: number, baseColor?: string): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return ''

    // Tamaño del canvas
    canvas.width = 600
    canvas.height = 400

    // Color de fondo (usar el proporcionado o uno por defecto)
    const backgroundColor = baseColor || this.getColorForIndex(index)

    // Dibujar fondo
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dibujar número grande en el centro
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 120px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((index + 1).toString(), canvas.width / 2, canvas.height / 2 - 20)

    // Dibujar texto pequeño debajo
    ctx.font = '20px Arial'
    ctx.fillText(`Tweet ${index + 1} de ${total}`, canvas.width / 2, canvas.height / 2 + 60)

    // Devolver la imagen como data URL
    return canvas.toDataURL('image/jpeg')
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dibujar número
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 120px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((index + 1).toString(), canvas.width / 2, canvas.height / 2 - 20)

    // Dibujar texto
    ctx.font = '20px Arial'
    ctx.fillText(`Parte ${index + 1} de ${total}`, canvas.width / 2, canvas.height / 2 + 60)

    return canvas.toDataURL('image/jpeg')
  }
}
