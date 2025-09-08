<template>
  <div class="bg-surfaceContainerHigh rounded-xl p-6 shadow-md3 mt-6">
    <div class="flex items-center mb-6">
      <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
        <svg class="w-5 h-5 text-onPrimary" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      </div>
      <div>
        <h2 class="text-xl font-semibold text-onSurface">{{ $t('twitter.title') }}</h2>
        <p class="text-onSurfaceVariant text-sm">
          {{ $t('twitter.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Mensajes -->
    <div v-if="message" class="mb-4 p-4 rounded-lg" :class="messageClass">
      <p class="text-sm">{{ message }}</p>
    </div>

    <!-- Botones de acción -->
    <div class="space-y-4">
      <!-- Copiar al portapapeles -->
      <button
        @click="copyToClipboard"
        :disabled="tweets.length === 0"
        class="w-full py-3 bg-secondaryContainer text-onSecondaryContainer rounded-xl shadow-md3 hover:shadow-md3-lg disabled:opacity-60 disabled:pointer-events-none transition-all duration-200 font-medium flex items-center justify-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
          />
        </svg>
        {{ $t('twitter.copy') }}
      </button>
    </div>

    <!-- Instrucciones -->
    <div class="mt-6 bg-surfaceContainer rounded-lg p-4">
      <h4 class="text-sm font-medium text-onSurface mb-2">
        {{ $t('twitter.instructions.title') }}
      </h4>
      <ol class="text-onSurfaceVariant text-sm space-y-1 list-decimal list-inside">
        <li>{{ $t('twitter.instructions.step1') }}</li>
        <li>{{ $t('twitter.instructions.step2') }}</li>
        <li>{{ $t('twitter.instructions.step3') }}</li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ThreadTweet } from '@/core/types'
import { useI18n } from 'vue-i18n'

interface Props {
  tweets: ThreadTweet[]
}

const props = defineProps<Props>()
const { t } = useI18n()
const message = ref<string>('')

const messageClass = computed(() => {
  return message.value.includes('✅')
    ? 'bg-primaryContainer/30 text-primary border border-primaryContainer'
    : 'bg-errorContainer/30 text-error border border-errorContainer'
})

// Copiar al portapapeles
const copyToClipboard = async () => {
  if (props.tweets.length === 0) return

  try {
    const threadText = props.tweets
      .map((tweet, index) => `${index + 1}/${props.tweets.length}\n${tweet.content}`)
      .join('\n\n---\n\n')

    await navigator.clipboard.writeText(threadText)
    message.value = '✅ ' + t('twitter.success.copied')
    clearMessageAfterDelay()
  } catch (error) {
    message.value = '❌ ' + t('twitter.copyFailed')
    clearMessageAfterDelay()
  }
}

const clearMessageAfterDelay = () => {
  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>
