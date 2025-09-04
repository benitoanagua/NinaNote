export class ImageUtils {
  static readonly PLACEHOLDER_IMAGES = [
    'https://via.placeholder.com/600x400/29AB87/FFFFFF?text=Nina+Note',
    'https://via.placeholder.com/600x400/2563EB/FFFFFF?text=Twitter+Thread',
    'https://via.placeholder.com/600x400/7C3AED/FFFFFF?text=Content+Summary',
    'https://via.placeholder.com/600x400/DC2626/FFFFFF?text=Engagement',
  ]

  // Verificar si una URL de imagen es válida
  static isValidImageUrl(url: string | null): boolean {
    if (!url) return false

    try {
      const parsedUrl = new URL(url)
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      const validDomains = ['placeholder.com', 'images.unsplash.com', 'picsum.photos']

      // Verificar extensión
      const hasValidExtension = validExtensions.some((ext) =>
        parsedUrl.pathname.toLowerCase().endsWith(ext),
      )

      // Verificar dominio (para placeholders)
      const hasValidDomain = validDomains.some((domain) => parsedUrl.hostname.includes(domain))

      return hasValidExtension || hasValidDomain
    } catch {
      return false
    }
  }

  // Obtener imagen placeholder por índice
  static getPlaceholderImage(index: number): string {
    return this.PLACEHOLDER_IMAGES[index % this.PLACEHOLDER_IMAGES.length]
  }

  // Extraer todas las imágenes de un documento HTML
  static extractAllImages(doc: Document): string[] {
    const images: string[] = []

    // Extraer Open Graph images
    const ogImage = doc.querySelector('meta[property="og:image"]')
    if (ogImage && ogImage.getAttribute('content')) {
      images.push(ogImage.getAttribute('content')!)
    }

    // Extraer Twitter images
    const twitterImage = doc.querySelector('meta[name="twitter:image"]')
    if (twitterImage && twitterImage.getAttribute('content')) {
      images.push(twitterImage.getAttribute('content')!)
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
}
