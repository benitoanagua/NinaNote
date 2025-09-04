<template>
  <div class="bg-surfaceContainerHigh rounded-xl p-6 shadow-md3">
    <!-- Estado de disponibilidad de IA -->
    <div
      v-if="!aiAvailable"
      class="mb-4 bg-primaryContainer/30 border border-primaryContainer rounded-lg p-4"
    >
      <div class="flex items-start">
        <svg
          class="w-5 h-5 text-primary mr-2 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p class="text-primary text-sm font-medium mb-2">{{ $t('ai.status.development') }}</p>
          <p class="text-primary text-sm">
            {{ $t('ai.status.developmentDescription') }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="mb-4 bg-primaryContainer/30 border border-primaryContainer rounded-lg p-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg
            class="w-4 h-4 text-primary mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span class="text-primary text-sm font-medium">{{ $t('ai.status.available') }}</span>
        </div>
        <button
          v-if="availableModels.length > 0"
          @click="showModelInfo = !showModelInfo"
          class="text-primary text-xs underline hover:no-underline"
        >
          {{ $t('ai.models.count', { count: availableModels.length }) }}
        </button>
      </div>

      <div
        v-if="showModelInfo && availableModels.length > 0"
        class="mt-2 pt-2 border-t border-primaryContainer"
      >
        <p class="text-primary text-xs mb-1">{{ $t('ai.models.title') }}:</p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="model in availableModels"
            :key="model.id"
            class="text-xs bg-primary text-onPrimary px-2 py-1 rounded"
          >
            {{ model.name }}
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <div
          class="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-md3 mr-3"
        >
          <svg class="w-6 h-6 text-onPrimary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z"
            />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-semibold text-onSurface">{{ $t('thread.title') }}</h2>
          <p class="text-onSurfaceVariant text-sm">
            {{ $t('summary.tweetsCount', { count: tweets.length }) }}
          </p>
        </div>
      </div>

      <button
        @click="regenerateAll"
        :disabled="isRegenerating"
        class="px-4 py-2 bg-secondaryContainer text-onSecondaryContainer rounded-lg hover:bg-secondaryContainer hover:text-onSecondaryContainer disabled:opacity-60"
      >
        <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {{ $t('thread.regenerateAll') }}
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="(tweet, index) in tweets"
        :key="tweet.id"
        class="bg-surfaceContainer border border-outlineVariant rounded-xl p-4 hover:shadow-md3 transition-all duration-200"
        :class="{ 'border-error bg-errorContainer/20': tweet.charCount > 280 }"
      >
        <!-- Header del tweet -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center">
            <div
              class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-onPrimary text-sm font-semibold mr-3 shadow-sm"
            >
              {{ index + 1 }}
            </div>
            <div
              class="text-sm"
              :class="{
                'text-error font-semibold': tweet.charCount > 280,
                'text-onSurfaceVariant': tweet.charCount <= 280,
              }"
            >
              {{ $t('summary.charCount', { count: tweet.charCount }) }}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="regenerateTweet(index)"
              :disabled="regeneratingIndex === index"
              class="p-2 text-onSurfaceVariant hover:text-primary rounded-full"
              :title="$t('summary.regenerateTweet')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <button
              @click="editTweet(index)"
              class="p-2 text-onSurfaceVariant hover:text-primary rounded-full"
              :title="$t('summary.editTweet')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Contenido del tweet -->
        <div class="mb-3">
          <div
            v-if="editingIndex !== index"
            class="text-onSurface leading-relaxed whitespace-pre-wrap"
          >
            {{ tweet.content }}
          </div>

          <div v-else class="space-y-2">
            <textarea
              v-model="editingContent"
              class="input-outlined w-full p-3 bg-surfaceContainerHighest border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none text-onSurface"
              :class="{
                'border-error focus:border-error focus:ring-error/20': editingContent.length > 280,
              }"
              rows="3"
              :placeholder="$t('thread.editPlaceholder')"
            />
            <div class="flex items-center justify-between">
              <span
                class="text-sm"
                :class="{
                  'text-error': editingContent.length > 280,
                  'text-onSurfaceVariant': editingContent.length <= 280,
                }"
              >
                {{ $t('summary.charCount', { count: editingContent.length }) }}
              </span>
              <div class="flex gap-2">
                <button
                  @click="cancelEdit"
                  class="px-3 py-1 text-sm text-onSurfaceVariant hover:text-onSurface rounded-lg"
                >
                  {{ $t('summary.cancelEdit') }}
                </button>
                <button
                  @click="saveEdit(index)"
                  :disabled="editingContent.length > 280"
                  class="px-3 py-1 text-sm bg-primary text-onPrimary rounded-lg hover:bg-primary disabled:opacity-60"
                >
                  {{ $t('summary.saveEdit') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerta de exceso de caracteres -->
        <div
          v-if="tweet.charCount > 280"
          class="bg-errorContainer/30 border border-errorContainer rounded-lg p-3"
        >
          <div class="flex items-start">
            <svg
              class="w-5 h-5 text-error mr-2 mt-0.5"
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
              <p class="text-error text-sm font-medium">{{ $t('summary.tweetTooLong') }}</p>
              <p class="text-error text-sm">
                {{ $t('summary.exceedsBy', { count: tweet.charCount - 280 }) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Indicador de carga -->
        <div
          v-if="regeneratingIndex === index"
          class="bg-primaryContainer/30 border border-primaryContainer rounded-lg p-3"
        >
          <div class="flex items-center">
            <div class="animate-spin rounded-full w-4 h-4 border-b-2 border-primary mr-2"></div>
            <span class="text-primary text-sm">{{ $t('thread.regenerating') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado de carga global -->
    <div
      v-if="isRegenerating"
      class="mt-6 bg-primaryContainer/30 border border-primaryContainer rounded-lg p-4"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full w-5 h-5 border-b-2 border-primary mr-3"></div>
        <span class="text-primary font-medium">{{ $t('thread.regeneratingAll') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ThreadTweet } from '@/core/types'
import type { AIModel } from '@/core/types'
import { useLLM } from '@/composables/useLLM'

interface Props {
  tweets: ThreadTweet[]
  originalContent: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  tweetsUpdated: [tweets: ThreadTweet[]]
}>()

const {
  regenerateTweet: regenerateSingleTweet,
  generateThread,
  checkPuterAvailability,
  getAvailableModels,
  isGenerating,
} = useLLM()

const isRegenerating = ref(false)
const regeneratingIndex = ref<number | null>(null)
const editingIndex = ref<number | null>(null)
const editingContent = ref('')
const aiAvailable = ref(false)
const availableModels = ref<AIModel[]>([])
const showModelInfo = ref(false)

const regenerateAll = async () => {
  isRegenerating.value = true
  try {
    const newTweets = await generateThread(props.originalContent)
    emit('tweetsUpdated', newTweets)
  } catch (error) {
    console.error('Error regenerating thread:', error)
  } finally {
    isRegenerating.value = false
  }
}

const regenerateTweet = async (index: number) => {
  regeneratingIndex.value = index
  try {
    const newContent = await regenerateSingleTweet(props.originalContent, index)
    const updatedTweets = [...props.tweets]
    updatedTweets[index] = {
      ...updatedTweets[index],
      content: newContent,
      charCount: newContent.length,
    }
    emit('tweetsUpdated', updatedTweets)
  } catch (error) {
    console.error('Error regenerating tweet:', error)
  } finally {
    regeneratingIndex.value = null
  }
}

const editTweet = (index: number) => {
  editingIndex.value = index
  editingContent.value = props.tweets[index].content
}

const cancelEdit = () => {
  editingIndex.value = null
  editingContent.value = ''
}

const saveEdit = (index: number) => {
  const updatedTweets = [...props.tweets]
  updatedTweets[index] = {
    ...updatedTweets[index],
    content: editingContent.value,
    charCount: editingContent.value.length,
  }
  emit('tweetsUpdated', updatedTweets)
  cancelEdit()
}

onMounted(async () => {
  aiAvailable.value = checkPuterAvailability()

  if (aiAvailable.value) {
    try {
      availableModels.value = await getAvailableModels()
    } catch (error) {
      console.warn('Error getting available models:', error)
    }
  }
})
</script>
