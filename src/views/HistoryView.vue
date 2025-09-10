<template>
  <div class="min-h-screen bg-background py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-onSurface mb-2">{{ $t('history.title') }}</h1>
        <p class="text-onSurfaceVariant">{{ $t('history.subtitle') }}</p>

        <!-- Banner de límite diario de GENERACIÓN -->
        <div
          v-if="threadHistory.hasReachedGenerationLimit"
          class="mt-4 bg-errorContainer/30 border border-errorContainer rounded-lg p-4"
        >
          <div class="flex items-start">
            <svg
              class="w-6 h-6 text-error mr-3 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <h3 class="text-error font-semibold mb-1">Límite diario de generación alcanzado</h3>
              <p class="text-error text-sm">
                Has generado {{ threadHistory.threadsGeneratedToday }} de
                {{ threadHistory.dailyGenerationLimit }} hilos hoy. Podrás generar
                {{ threadHistory.dailyGenerationLimit }} hilos más mañana.
              </p>
            </div>
          </div>
        </div>

        <!-- Contador de hilos de GENERACIÓN -->
        <div
          v-else-if="threadHistory.threadsGeneratedToday > 0"
          class="mt-4 bg-primaryContainer/30 border border-primaryContainer rounded-lg p-4"
        >
          <div class="flex items-center justify-center space-x-6">
            <div class="text-center">
              <div class="text-2xl font-semibold text-primary">
                {{ threadHistory.threadsGeneratedToday }}
              </div>
              <div class="text-sm text-onSurfaceVariant">Hilos generados hoy</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-semibold text-primary">
                {{ threadHistory.remainingThreads }}
              </div>
              <div class="text-sm text-onSurfaceVariant">Restantes hoy</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-semibold text-primary">
                {{ threadHistory.dailyGenerationLimit }}
              </div>
              <div class="text-sm text-onSurfaceVariant">Límite diario</div>
            </div>
          </div>
        </div>

        <!-- Estadísticas del historial (ALMACENAMIENTO) -->
        <div
          v-if="sessionStore.savedThreads.length > 0"
          class="mt-4 bg-surfaceContainerHigh rounded-lg p-4"
        >
          <div class="flex items-center justify-center space-x-6">
            <div class="text-center">
              <div class="text-2xl font-semibold text-primary">
                {{ sessionStore.savedThreads.length }}
              </div>
              <div class="text-sm text-onSurfaceVariant">Hilos guardados</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-semibold text-secondary">{{ totalTweets }}</div>
              <div class="text-sm text-onSurfaceVariant">Tweets totales</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-semibold text-tertiary">{{ threadsWithImages }}</div>
              <div class="text-sm text-onSurfaceVariant">Con imágenes</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-semibold text-primaryContainer">
                {{ threadHistory.maxSavedThreads }}
              </div>
              <div class="text-sm text-onSurfaceVariant">Límite almacenamiento</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="sessionStore.savedThreads.length === 0" class="text-center py-12">
        <div class="w-24 h-24 mx-auto mb-6 text-onSurfaceVariant/30">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p class="text-onSurfaceVariant mb-4">{{ $t('history.empty') }}</p>
        <router-link
          to="/"
          class="px-6 py-2 bg-primary text-onPrimary rounded-lg shadow-md3 hover:shadow-md3-lg transition-all"
        >
          {{ $t('history.createFirst') }}
        </router-link>
      </div>

      <div v-else class="space-y-6">
        <!-- Información de almacenamiento -->
        <div class="bg-surfaceContainerHigh rounded-xl p-4 text-center">
          <p class="text-onSurfaceVariant text-sm">
            📁 Mostrando {{ sessionStore.savedThreads.length }} hilos guardados
          </p>
          <p class="text-onSurfaceVariant/60 text-xs mt-1">
            Límite de almacenamiento: {{ threadHistory.maxSavedThreads }} hilos.
            <span
              v-if="sessionStore.savedThreads.length >= threadHistory.maxSavedThreads"
              class="text-primary font-medium"
            >
              Los hilos más antiguos se eliminarán automáticamente al guardar nuevos.
            </span>
          </p>
        </div>

        <!-- Lista de todos los hilos guardados -->
        <div
          v-for="thread in sessionStore.savedThreads"
          :key="thread.id"
          class="bg-surfaceContainerHigh rounded-xl p-6 shadow-md3"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="font-semibold text-onSurface mb-1">{{ thread.title }}</h3>
              <a
                :href="thread.url"
                target="_blank"
                class="text-primary hover:text-primary text-sm break-all"
              >
                {{ thread.url }}
              </a>
              <p class="text-onSurfaceVariant text-sm mt-1">
                {{ formatDate(thread.createdAt) }}
              </p>

              <!-- Estadísticas del hilo -->
              <div class="flex items-center space-x-4 mt-2">
                <span
                  class="text-xs bg-primaryContainer text-onPrimaryContainer px-2 py-1 rounded-full"
                >
                  {{ thread.tweets.length }} tweets
                </span>
                <span
                  v-if="hasImages(thread)"
                  class="text-xs bg-secondaryContainer text-onSecondaryContainer px-2 py-1 rounded-full"
                >
                  {{ countImages(thread) }} imágenes
                </span>
                <span
                  class="text-xs bg-surfaceContainer text-onSurfaceVariant px-2 py-1 rounded-full"
                >
                  {{ formatContentLength(thread) }}
                </span>
                <span
                  v-if="getImageCoverage(thread) > 0"
                  class="text-xs bg-tertiaryContainer text-onTertiaryContainer px-2 py-1 rounded-full"
                >
                  {{ getImageCoverage(thread) }}% con imágenes
                </span>
              </div>
            </div>
            <button
              @click="deleteThread(thread.id)"
              class="p-2 text-onSurfaceVariant hover:text-error rounded-full transition-colors"
              :title="$t('history.deleteThread')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(tweet, index) in thread.tweets"
              :key="index"
              class="bg-surfaceContainer rounded-lg p-3"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center">
                  <div
                    class="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-onPrimary text-xs font-semibold mr-2"
                  >
                    {{ index + 1 }}
                  </div>
                  <div class="text-sm text-onSurfaceVariant">
                    {{ $t('summary.charCount', { count: tweet.charCount }) }}
                  </div>
                </div>
                <div
                  v-if="tweet.imageUrl && isValidImageUrl(tweet.imageUrl)"
                  class="text-xs text-primary flex items-center"
                >
                  <span class="mr-1">📸</span> Con imagen
                </div>
                <div v-else-if="!tweet.imageUrl" class="text-xs text-onSurfaceVariant/60">
                  Sin imagen
                </div>
                <div v-else class="text-xs text-error/60">⚠️ Imagen inválida</div>
              </div>
              <p class="text-onSurface text-sm leading-relaxed whitespace-pre-wrap">
                {{ tweet.content }}
              </p>

              <!-- Mostrar imagen si existe -->
              <div v-if="tweet.imageUrl && isValidImageUrl(tweet.imageUrl)" class="mt-3 relative">
                <img
                  :src="normalizeImageUrl(tweet.imageUrl)"
                  :alt="`Imagen para tweet ${index + 1}`"
                  class="rounded-lg w-full h-32 object-cover shadow-sm"
                  @error="handleImageError(thread.id, index)"
                  @load="handleImageLoad(thread.id, index)"
                />
                <div
                  class="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
                >
                  📸
                </div>
                <p class="text-xs text-onSurfaceVariant/60 mt-1 text-center">
                  Imagen {{ index + 1 }} de {{ thread.tweets.length }}
                </p>
              </div>

              <!-- Indicador de imagen inválida -->
              <div
                v-else-if="tweet.imageUrl && !isValidImageUrl(tweet.imageUrl)"
                class="mt-2 p-2 bg-errorContainer/20 rounded-lg"
              >
                <p class="text-error text-xs flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Imagen no disponible o URL inválida
                </p>
                <p class="text-error text-xs mt-1">
                  URL: {{ tweet.imageUrl.substring(0, 50)
                  }}{{ tweet.imageUrl.length > 50 ? '...' : '' }}
                </p>
              </div>

              <!-- Indicador si no hay imagen -->
              <div v-else class="mt-2 text-xs text-onSurfaceVariant/60">
                ℹ️ Este tweet no tiene imagen asignada
              </div>
            </div>
          </div>

          <!-- Acciones del hilo -->
          <div class="mt-4 pt-4 border-t border-outlineVariant/50">
            <div class="flex items-center justify-between">
              <span class="text-sm text-onSurfaceVariant">Acciones:</span>
              <div class="flex items-center space-x-2">
                <button
                  @click="copyThread(thread)"
                  class="px-3 py-1 text-sm bg-surfaceContainerHighest text-onSurfaceVariant rounded-lg hover:bg-surfaceContainerHighest hover:text-onSurface transition-colors flex items-center"
                  title="Copiar hilo"
                >
                  <svg
                    class="w-4 h-4 inline mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Copiar
                </button>
                <button
                  @click="shareThread(thread)"
                  class="px-3 py-1 text-sm bg-surfaceContainerHighest text-onSurfaceVariant rounded-lg hover:bg-surfaceContainerHighest hover:text-onSurface transition-colors flex items-center"
                  title="Compartir primer tweet"
                >
                  <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    />
                  </svg>
                  Compartir
                </button>
                <button
                  v-if="hasImages(thread)"
                  @click="exportImages(thread)"
                  class="px-3 py-1 text-sm bg-surfaceContainerHighest text-onSurfaceVariant rounded-lg hover:bg-surfaceContainerHighest hover:text-onSurface transition-colors flex items-center"
                  title="Exportar URLs de imágenes"
                >
                  <svg
                    class="w-4 h-4 inline mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Imágenes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useThreadHistory } from '@/composables/useThreadHistory'
import { useI18n } from 'vue-i18n'
import { useSEO } from '@/composables/useSEO'
import { logger } from '@/utils/logger'

// SEO para la página de historial
useSEO({
  path: '/history',
  title: 'Historial de hilos generados - Nina Note',
  description:
    'Revisa y gestiona tu historial de hilos de Twitter generados automáticamente a partir de artículos y editoriales.',
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Historial de Hilos - Nina Note',
    description: 'Gestión y revisión de hilos de Twitter generados automáticamente',
    url: window.location.href,
    isPartOf: {
      '@type': 'WebApplication',
      name: 'Nina Note',
      applicationCategory: 'UtilityApplication',
    },
  },
})

const sessionStore = useSessionStore()
const threadHistory = useThreadHistory()
const { t } = useI18n()

// Función para validar imágenes
const isValidImageUrl = (url: string): boolean => {
  if (!url) return false
  if (url.startsWith('data:image/')) return true
  if (url.startsWith('blob:')) return true

  try {
    const parsedUrl = new URL(url)
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']
    const hasImageExtension = validExtensions.some((ext) =>
      parsedUrl.pathname.toLowerCase().includes(ext),
    )

    const hasImageIndicator =
      /\.(jpg|jpeg|png|gif|webp|avif|svg)/i.test(url) ||
      /\/images?\//i.test(url) ||
      /\/media\//i.test(url) ||
      /\/img\//i.test(url)

    return hasImageExtension || hasImageIndicator
  } catch {
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(url)
  }
}

// Función para normalizar URLs de imágenes
const normalizeImageUrl = (url: string): string => {
  if (!url) return url

  if (url.startsWith('http')) return url
  if (url.startsWith('//')) return `https:${url}`

  if (url.startsWith('/')) {
    // Intentar obtener el dominio del hilo
    const thread = sessionStore.savedThreads.find((t) =>
      t.tweets.some((tweet) => tweet.imageUrl && tweet.imageUrl.includes(url)),
    )
    if (thread && thread.url) {
      try {
        const parsedUrl = new URL(thread.url)
        return `${parsedUrl.origin}${url}`
      } catch {
        return url
      }
    }
  }

  return url
}

// Computed properties para estadísticas
const totalTweets = computed(() => {
  return sessionStore.savedThreads.reduce((total, thread) => total + thread.tweets.length, 0)
})

const threadsWithImages = computed(() => {
  return sessionStore.savedThreads.filter((thread) =>
    thread.tweets.some((tweet) => tweet.imageUrl && isValidImageUrl(tweet.imageUrl)),
  ).length
})

const totalImages = computed(() => {
  return sessionStore.savedThreads.reduce((total, thread) => {
    return (
      total +
      thread.tweets.filter((tweet) => tweet.imageUrl && isValidImageUrl(tweet.imageUrl)).length
    )
  }, 0)
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const hasImages = (thread: any) => {
  return thread.tweets.some((tweet: any) => tweet.imageUrl && isValidImageUrl(tweet.imageUrl))
}

const countImages = (thread: any) => {
  return thread.tweets.filter((tweet: any) => tweet.imageUrl && isValidImageUrl(tweet.imageUrl))
    .length
}

const getImageCoverage = (thread: any) => {
  const totalTweets = thread.tweets.length
  const tweetsWithImages = thread.tweets.filter(
    (tweet: any) => tweet.imageUrl && isValidImageUrl(tweet.imageUrl),
  ).length
  return Math.round((tweetsWithImages / totalTweets) * 100)
}

const formatContentLength = (thread: any) => {
  const totalChars = thread.tweets.reduce((sum: number, tweet: any) => sum + tweet.charCount, 0)
  return `${Math.round(totalChars / 1000)}k chars`
}

const deleteThread = (threadId: string) => {
  if (confirm(t('history.deleteConfirm'))) {
    sessionStore.deleteThread(threadId)
    logger.info('Hilo eliminado del historial', {
      context: 'HistoryView',
      data: { threadId },
    })
  }
}

const copyThread = async (thread: any) => {
  try {
    const threadText = thread.tweets
      .map((tweet: any, index: number) => `${index + 1}/${thread.tweets.length}\n${tweet.content}`)
      .join('\n\n---\n\n')

    await navigator.clipboard.writeText(threadText)
    alert('Hilo copiado al portapapeles')
    logger.info('Hilo copiado al portapapeles', {
      context: 'HistoryView',
      data: { threadId: thread.id, tweetCount: thread.tweets.length },
    })
  } catch (error) {
    alert('Error al copiar el hilo')
    logger.error('Error al copiar hilo', {
      context: 'HistoryView',
      data: error,
    })
  }
}

const shareThread = (thread: any) => {
  if (thread.tweets.length > 0) {
    const firstTweet = thread.tweets[0]
    let text = firstTweet.content

    if (firstTweet.imageUrl && isValidImageUrl(firstTweet.imageUrl)) {
      text += '\n\n📸 Incluye imagen'
    }

    const encodedText = encodeURIComponent(text)
    const url = `https://twitter.com/intent/tweet?text=${encodedText}`

    window.open(
      url,
      '_blank',
      'width=550,height=420,menubar=no,toolbar=no,resizable=yes,scrollbars=yes',
    )

    logger.info('Primer tweet compartido', {
      context: 'HistoryView',
      data: { threadId: thread.id },
    })
  }
}

const exportImages = async (thread: any) => {
  try {
    const imageUrls = thread.tweets
      .filter((tweet: any) => tweet.imageUrl && isValidImageUrl(tweet.imageUrl))
      .map((tweet: any) => normalizeImageUrl(tweet.imageUrl))

    if (imageUrls.length === 0) {
      alert('No hay imágenes válidas para exportar')
      return
    }

    const imageText = imageUrls.join('\n')
    await navigator.clipboard.writeText(imageText)
    alert(`✅ ${imageUrls.length} URLs de imágenes copiadas al portapapeles`)

    logger.info('URLs de imágenes exportadas', {
      context: 'HistoryView',
      data: { threadId: thread.id, imageCount: imageUrls.length },
    })
  } catch (error) {
    alert('Error al exportar imágenes')
    logger.error('Error al exportar imágenes', {
      context: 'HistoryView',
      data: error,
    })
  }
}

const handleImageLoad = (threadId: string, tweetIndex: number) => {
  logger.debug('Imagen cargada exitosamente', {
    context: 'HistoryView',
    data: { threadId, tweetIndex },
  })
}

const handleImageError = async (threadId: string, tweetIndex: number) => {
  logger.warn('Error loading image in history view', {
    context: 'HistoryView',
    data: { threadId, tweetIndex },
  })

  // Opcional: intentar normalizar la URL
  const thread = sessionStore.savedThreads.find((t) => t.id === threadId)
  if (thread && thread.tweets[tweetIndex]) {
    const tweet = thread.tweets[tweetIndex]
    const normalizedUrl = normalizeImageUrl(tweet.imageUrl || '')

    if (normalizedUrl !== tweet.imageUrl) {
      const updatedTweets = [...thread.tweets]
      updatedTweets[tweetIndex] = {
        ...updatedTweets[tweetIndex],
        imageUrl: normalizedUrl,
      }

      // Actualizar en el store
      sessionStore.saveThread({
        url: thread.url,
        title: thread.title,
        tweets: updatedTweets,
      })
    }
  }
}
</script>
