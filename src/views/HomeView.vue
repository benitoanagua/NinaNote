<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <UrlInput @scraped="handleScraped" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import UrlInput from '@/components/UrlInput.vue'

const router = useRouter()
const sessionStore = useSessionStore()

const handleScraped = (url: string, content: string) => {
  sessionStore.setLastProcessedUrl(url)
  router.push({
    path: '/summary',
    query: { url: encodeURIComponent(url) },
  })
}
</script>
