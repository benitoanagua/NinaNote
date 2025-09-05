<template>
  <div class="min-h-screen bg-background py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-onSurface mb-2">{{ $t('summary.title') }}</h1>
        <p class="text-onSurfaceVariant">{{ $t('summary.subtitle') }}</p>
        <a
          :href="decodedUrl"
          target="_blank"
          class="text-primary hover:text-primary text-sm break-all inline-block mt-2"
        >
          {{ decodedUrl }}
        </a>
      </div>

      <!-- Mostrar error si existe -->
      <div
        v-if="errorMessage"
        class="mb-8 bg-errorContainer/30 border border-errorContainer rounded-lg p-6"
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
          <div class="flex-1">
            <h3 class="text-error font-semibold mb-2">Error al procesar el artículo</h3>
            <p class="text-error mb-4">{{ errorMessage }}</p>
            <button
              @click="retry"
              class="px-4 py-2 bg-error text-onError rounded-lg hover:bg-error/90"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>

      <ThreadPreview
        v-else
        :tweets="tweets"
        :original-content="articleContent"
        @tweets-updated="handleTweetsUpdated"
      />

      <TwitterPublish v-if="!errorMessage" :tweets="tweets" class="mt-8" />

      <div class="mt-8 text-center">
        <router-link
          to="/"
          class="px-6 py-2 bg-secondaryContainer text-onSecondaryContainer rounded-lg hover:bg-secondaryContainer hover:text-onSecondaryContainer"
        >
          <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {{ $t('summary.backButton') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGoogleGenAI } from '@/composables/useGoogleGenAI'
import { useScraper } from '@/composables/useScraper'
import ThreadPreview from '@/components/ThreadPreview.vue'
import TwitterPublish from '@/components/TwitterPublish.vue'
import type { ThreadTweet } from '@/core/types'
import { handleError, translateError } from '@/utils/errorHandler'

const route = useRoute()
const { scrapeContent } = useScraper()
const { generateThread } = useGoogleGenAI()

const tweets = ref<ThreadTweet[]>([])
const articleContent = ref('')
const articleImages = ref<string[]>([])
const errorMessage = ref<string>('')

const decodedUrl = computed(() => {
  return route.query.url ? decodeURIComponent(route.query.url as string) : ''
})

const loadArticle = async () => {
  errorMessage.value = ''

  if (!route.query.url) {
    errorMessage.value = 'No URL provided'
    return
  }

  try {
    const url = decodeURIComponent(route.query.url as string)
    console.log('📄 Processing article from URL:', url)

    // 1. Scraping del contenido
    const contentResult = await scrapeContent(url)
    articleContent.value = contentResult.content
    articleImages.value = contentResult.images || []

    console.log('📝 Article content length:', contentResult.content.length)
    console.log('🖼️ Extracted images:', articleImages.value.length)

    // 2. Generar hilo con Google IA
    const generatedTweets = await generateThread(contentResult.content, articleImages.value)
    tweets.value = generatedTweets
    console.log('🐦 Tweets generated with images:', generatedTweets.length)
  } catch (error) {
    console.error('❌ Error processing article:', error)
    const appError = handleError(error, 'SummaryView')
    errorMessage.value = translateError(appError)
    throw appError // Propagar el error
  }
}

onMounted(() => {
  loadArticle()
})

const handleTweetsUpdated = (updatedTweets: ThreadTweet[]) => {
  tweets.value = updatedTweets
}

const retry = () => {
  loadArticle()
}
</script>
