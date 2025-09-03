<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <div class="w-10 h-10 fire-gradient rounded-lg flex items-center justify-center mr-3">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z"
            />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Tu Hilo de Twitter</h2>
          <p class="text-gray-600 text-sm">{{ tweets.length }} tweets generados</p>
        </div>
      </div>

      <button @click="regenerateAll" :disabled="isRegenerating" class="btn-secondary text-sm">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Regenerar todo
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="(tweet, index) in tweets"
        :key="tweet.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
        :class="{ 'border-fire-200 bg-fire-50': tweet.charCount > 280 }"
      >
        <!-- Header del tweet -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center">
            <div
              class="w-8 h-8 fire-gradient rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3"
            >
              {{ index + 1 }}
            </div>
            <div class="text-sm text-gray-600">
              <span :class="{ 'text-red-600 font-semibold': tweet.charCount > 280 }">
                {{ tweet.charCount }}/280
              </span>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="regenerateTweet(index)"
              :disabled="regeneratingIndex === index"
              class="p-1 text-gray-400 hover:text-fire-500 transition-colors duration-200"
              title="Regenerar este tweet"
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
              class="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
              title="Editar este tweet"
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
            class="text-gray-800 leading-relaxed whitespace-pre-wrap"
          >
            {{ tweet.content }}
          </div>

          <div v-else class="space-y-2">
            <textarea
              v-model="editingContent"
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fire-500 focus:border-transparent outline-none resize-none"
              :class="{ 'border-red-300': editingContent.length > 280 }"
              rows="3"
              placeholder="Edita tu tweet..."
            />
            <div class="flex items-center justify-between">
              <span class="text-sm" :class="{ 'text-red-600': editingContent.length > 280 }">
                {{ editingContent.length }}/280 caracteres
              </span>
              <div class="space-x-2">
                <button
                  @click="cancelEdit"
                  class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  @click="saveEdit(index)"
                  :disabled="editingContent.length > 280"
                  class="px-3 py-1 text-sm bg-fire-500 text-white rounded hover:bg-fire-600 transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerta de exceso de caracteres -->
        <div v-if="tweet.charCount > 280" class="bg-red-100 border border-red-200 rounded-lg p-3">
          <div class="flex items-start">
            <svg
              class="w-5 h-5 text-red-500 mr-2 mt-0.5"
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
              <p class="text-red-800 text-sm font-medium">Tweet demasiado largo</p>
              <p class="text-red-700 text-sm">
                Excede por {{ tweet.charCount - 280 }} caracteres. Considera regenerar o editar.
              </p>
            </div>
          </div>
        </div>

        <!-- Indicador de carga para regeneración individual -->
        <div
          v-if="regeneratingIndex === index"
          class="bg-fire-50 border border-fire-200 rounded-lg p-3"
        >
          <div class="flex items-center">
            <svg class="animate-spin w-4 h-4 text-fire-500 mr-2" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span class="text-fire-700 text-sm">Regenerando tweet...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado de carga global -->
    <div v-if="isRegenerating" class="mt-6 bg-fire-50 border border-fire-200 rounded-lg p-4">
      <div class="flex items-center justify-center">
        <svg class="animate-spin w-5 h-5 text-fire-500 mr-3" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span class="text-fire-700 font-medium">Regenerando todos los tweets...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ThreadTweet } from '@/composables/useLLM'
import { useLLM } from '@/composables/useLLM'

interface Props {
  tweets: ThreadTweet[]
  originalContent: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  tweetsUpdated: [tweets: ThreadTweet[]]
}>()

const { regenerateTweet: regenerateSingleTweet, generateThread, isGenerating } = useLLM()

const isRegenerating = ref(false)
const regeneratingIndex = ref<number | null>(null)
const editingIndex = ref<number | null>(null)
const editingContent = ref('')

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
</script>
