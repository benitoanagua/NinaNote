<template>
  <div class="min-h-screen py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Resumen Generado</h1>
        <p class="text-gray-600">Hilo de Twitter creado a partir del artículo</p>
        <a
          :href="decodedUrl"
          target="_blank"
          class="text-fire-600 hover:text-fire-700 text-sm break-all"
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
        <button @click="$router.push('/')" class="btn-secondary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Procesar otro artículo
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
    const content = await scrapeText(url)
    articleContent.value = content

    const generatedTweets = await generateThread(content)
    tweets.value = generatedTweets
  } catch (error) {
    console.error('Error processing article:', error)
  }
})

const handleTweetsUpdated = (updatedTweets: ThreadTweet[]) => {
  tweets.value = updatedTweets
}
</script>
