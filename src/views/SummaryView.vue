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

      <ThreadPreview
        :tweets="tweets"
        :original-content="articleContent"
        @tweets-updated="handleTweetsUpdated"
      />

      <TwitterPublish :tweets="tweets" class="mt-8" />

      <div class="mt-8 text-center">
        <button
          @click="$router.push('/')"
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
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useScraper } from '@/composables/useScraper'
import { useLLM } from '@/composables/useLLM'
import ThreadPreview from '@/components/ThreadPreview.vue'
import TwitterPublish from '@/components/TwitterPublish.vue'
import type { ThreadTweet } from '@/composables/useLLM'

const route = useRoute()
const { scrapeText } = useScraper()
const { generateThread } = useLLM()

const tweets = ref<ThreadTweet[]>([])
const articleContent = ref('')

const decodedUrl = computed(() => {
  return route.query.url ? decodeURIComponent(route.query.url as string) : ''
})

onMounted(async () => {
  if (!route.query.url) {
    return
  }

  try {
    const url = decodeURIComponent(route.query.url as string)
    console.log('📄 Processing article from URL:', url)

    const content = await scrapeText(url)
    articleContent.value = content
    console.log('📝 Article content length:', content.length)

    const generatedTweets = await generateThread(content)
    tweets.value = generatedTweets
    console.log('🐦 Tweets generated:', generatedTweets.length)
  } catch (error) {
    console.error('❌ Error processing article:', error)

    // Fallback: usar contenido de ejemplo
    console.log('🔄 Using fallback content due to error')
    articleContent.value = `
Editorial: La Transformación Digital en América Latina

La transformación digital ha llegado para quedarse en América Latina. 
Las empresas que no se adapten a las nuevas tecnologías se quedarán atrás.

Los datos revelan que el 85% de las compañías latinoamericanas han acelerado 
sus procesos de digitalización desde 2020. Esta tendencia no es casualidad, 
sino una necesidad imperante para sobrevivir en la nueva economía digital.
    `.trim()

    try {
      const fallbackTweets = await generateThread(articleContent.value)
      tweets.value = fallbackTweets
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError)
      // Último recurso: tweets mock
      tweets.value = [
        {
          id: 'fallback-1',
          content: '🔥 La transformación digital en América Latina es imparable...',
          charCount: 50,
        },
        {
          id: 'fallback-2',
          content: '💡 Pero hay desafíos importantes que superar...',
          charCount: 45,
        },
      ]
    }
  }
})

const handleTweetsUpdated = (updatedTweets: ThreadTweet[]) => {
  tweets.value = updatedTweets
}
</script>
