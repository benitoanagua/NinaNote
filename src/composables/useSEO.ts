import { useHead } from '@vueuse/head'
import { seo, SITE_URL } from '@/config/seo'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Define el tipo para structured data
interface StructuredData {
  [key: string]: any
}

interface UseSEOParams {
  title?: string
  description?: string
  image?: string
  path?: string
  canonical?: string
  noindex?: boolean
  structuredData?: StructuredData | null
}

export function useSEO({
  title = seo.title,
  description = seo.description,
  image = seo.ogImage,
  path = '',
  canonical = '',
  noindex = false,
  structuredData = null,
}: UseSEOParams = {}) {
  const { t } = useI18n()
  const url = canonical || `${SITE_URL}${path}`

  // Título traducible
  const fullTitle = computed(() => {
    return title === seo.title ? t('seo.title') || title : title
  })

  const meta = [
    // Meta básicos
    { name: 'description', content: description },
    { name: 'keywords', content: seo.keywords },
    { name: 'author', content: seo.author },
    { name: 'theme-color', content: seo.themeColor },

    // Open Graph
    { property: 'og:type', content: seo.ogType },
    { property: 'og:url', content: url },
    { property: 'og:title', content: fullTitle.value },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:locale', content: seo.locale },
    { property: 'og:site_name', content: 'Nina Note' },

    // Twitter
    { name: 'twitter:card', content: seo.twitterCard },
    { name: 'twitter:url', content: url },
    { name: 'twitter:title', content: fullTitle.value },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:site', content: seo.twitterSite || '@tu_usuario_twitter' },
    { name: 'twitter:creator', content: seo.twitterSite || '@tu_usuario_twitter' },
  ]

  // Añadir noindex si es necesario
  if (noindex) {
    meta.push({ name: 'robots', content: 'noindex, nofollow' })
  } else {
    meta.push({ name: 'robots', content: 'index, follow' })
  }

  const links = [
    { rel: 'canonical', href: url },
    { rel: 'icon', href: seo.favicon },
    { rel: 'apple-touch-icon', href: `${SITE_URL}/apple-touch-icon.png` },
  ]

  // Añadir structured data si se proporciona
  const script = structuredData
    ? [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(structuredData),
        },
      ]
    : []

  useHead({
    title: fullTitle,
    titleTemplate: '%s | Nina Note',
    meta,
    link: links,
    script,
  })
}
