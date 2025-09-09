import { useHead } from '@vueuse/head'
import { seo, SITE_URL } from '@/config/seo'

export function useSEO({
  title = seo.title,
  description = seo.description,
  image = seo.ogImage,
  path = '',
} = {}) {
  const url = `${SITE_URL}${path}`

  useHead({
    title,
    titleTemplate: '%s | Nina Note',
    meta: [
      { name: 'description', content: description },
      { name: 'keywords', content: seo.keywords },
      { name: 'author', content: seo.author },
      { name: 'theme-color', content: seo.themeColor },

      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:locale', content: seo.locale },

      // Twitter
      { name: 'twitter:card', content: seo.twitterCard },
      { name: 'twitter:url', content: url },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    link: [
      { rel: 'canonical', href: url },
      { rel: 'icon', href: seo.favicon },
      { rel: 'apple-touch-icon', href: `${SITE_URL}/apple-touch-icon.png` },
    ],
  })
}
