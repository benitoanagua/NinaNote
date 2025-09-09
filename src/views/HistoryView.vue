<template>
  <div class="min-h-screen bg-background py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-onSurface mb-2">{{ $t('history.title') }}</h1>
        <p class="text-onSurfaceVariant">{{ $t('history.subtitle') }}</p>

        <!-- Estadísticas del historial -->
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
                <div v-if="tweet.imageUrl" class="text-xs text-primary">📸 Con imagen</div>
              </div>
              <p class="text-onSurface text-sm leading-relaxed whitespace-pre-wrap">
                {{ tweet.content }}
              </p>

              <!-- Mostrar imagen si existe -->
              <div v-if="tweet.imageUrl" class="mt-3">
                <img
                  :src="tweet.imageUrl"
                  :alt="`Imagen para tweet ${index + 1}`"
                  class="rounded-lg w-full h-32 object-cover shadow-sm"
                  @error="handleImageError(thread.id, index)"
                />
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
                  class="px-3 py-1 text-sm bg-surfaceContainerHighest text-onSurfaceVariant rounded-lg hover:bg-surfaceContainerHighest hover:text-onSurface transition-colors"
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
                  class="px-3 py-1 text-sm bg-surfaceContainerHighest text-onSurfaceVariant rounded-lg hover:bg-surfaceContainerHighest hover:text-onSurface transition-colors"
                  title="Compartir primer tweet"
                >
                  <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                    />
                  </svg>
                  Compartir
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
import { useI18n } from 'vue-i18n'
import { logger } from '@/utils/logger'

const sessionStore = useSessionStore()
const { t } = useI18n()

// Computed properties para estadísticas
const totalTweets = computed(() => {
  return sessionStore.savedThreads.reduce((total, thread) => total + thread.tweets.length, 0)
})

const threadsWithImages = computed(() => {
  return sessionStore.savedThreads.filter((thread) => thread.tweets.some((tweet) => tweet.imageUrl))
    .length
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
  return thread.tweets.some((tweet: any) => tweet.imageUrl)
}

const countImages = (thread: any) => {
  return thread.tweets.filter((tweet: any) => tweet.imageUrl).length
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

    if (firstTweet.imageUrl) {
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

const handleImageError = (threadId: string, tweetIndex: number) => {
  logger.warn(`Error loading image in history view`, {
    context: 'HistoryView',
    data: { threadId, tweetIndex },
  })
}
</script>
