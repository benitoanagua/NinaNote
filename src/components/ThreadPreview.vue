<template>
  <div class="bg-surfaceContainerHigh rounded-xl p-6 shadow-md3">
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
            <span class="text-primary"> • {{ getThreadSizeLabel() }}</span>
          </p>
        </div>
      </div>
    </div>

    <div v-if="tweets.length > 0" class="space-y-4">
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
            <!-- Botón para compartir en Twitter -->
            <button
              @click="shareSingleTweet(index)"
              class="p-2 text-onSurfaceVariant hover:text-[#1DA1F2] rounded-full transition-colors"
              :title="$t('thread.shareTweet')"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Contenido del tweet -->
        <div class="mb-3">
          <div class="text-onSurface leading-relaxed whitespace-pre-wrap mb-3">
            {{ tweet.content }}
          </div>

          <!-- Mostrar imagen si existe -->
          <div v-if="tweet.imageUrl" class="mt-3">
            <img
              :src="tweet.imageUrl"
              :alt="`Imagen para tweet ${index + 1}`"
              class="rounded-lg w-full h-48 object-cover shadow-sm"
              @error="handleImageError(tweet, index)"
            />
            <p class="text-xs text-onSurfaceVariant mt-1 text-center">
              Imagen {{ index + 1 }} de {{ tweets.length }}
            </p>
          </div>

          <!-- Botón para agregar imagen si no hay -->
          <div v-if="!tweet.imageUrl" class="mt-3">
            <button
              @click="showImageInput(index)"
              class="px-3 py-2 text-sm bg-surfaceContainerHighest text-onSurfaceVariant rounded-lg hover:bg-surfaceContainerHighest hover:text-onSurface transition-colors flex items-center"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Agregar imagen
            </button>
          </div>

          <!-- Input para URL de imagen -->
          <div v-if="showImageInputIndex === index" class="mt-3 space-y-2">
            <input
              v-model="imageUrlInput"
              type="url"
              placeholder="Pega la URL de la imagen"
              class="input-outlined w-full p-2 text-sm bg-surfaceContainerHighest border border-outline rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-onSurface transition-colors"
            />
            <div class="flex gap-2">
              <button
                @click="cancelImageInput"
                class="px-3 py-1 text-sm text-onSurfaceVariant hover:text-onSurface rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                @click="saveImageUrl(index)"
                :disabled="!isValidImageUrl(imageUrlInput)"
                class="px-3 py-1 text-sm bg-primary text-onPrimary rounded-lg hover:bg-primary disabled:opacity-60 transition-colors"
              >
                Guardar imagen
              </button>
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
      </div>
    </div>

    <div v-else class="text-center py-8 text-onSurfaceVariant">
      <svg
        class="w-12 h-12 mx-auto mb-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p>Esperando generación de contenido...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ThreadTweet } from '@/core/types'

interface Props {
  tweets: ThreadTweet[]
  originalContent: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  tweetsUpdated: [tweets: ThreadTweet[]]
}>()

// Estado para manejar imágenes
const showImageInputIndex = ref<number | null>(null)
const imageUrlInput = ref('')

// Métodos para manejar imágenes
const showImageInput = (index: number) => {
  showImageInputIndex.value = index
  imageUrlInput.value = ''
}

const cancelImageInput = () => {
  showImageInputIndex.value = null
  imageUrlInput.value = ''
}

const saveImageUrl = (index: number) => {
  if (isValidImageUrl(imageUrlInput.value)) {
    const updatedTweets = [...props.tweets]
    updatedTweets[index] = {
      ...updatedTweets[index],
      imageUrl: imageUrlInput.value,
    }
    emit('tweetsUpdated', updatedTweets)
    showImageInputIndex.value = null
    imageUrlInput.value = ''
  }
}

const isValidImageUrl = (url: string): boolean => {
  if (!url) return false
  // Validar URL de imagen
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']
  return (
    imageExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
    url.startsWith('data:image/') ||
    url.startsWith('blob:')
  )
}

const shareSingleTweet = (index: number) => {
  const tweet = props.tweets[index]
  let text = tweet.content

  // Si hay imagen, no podemos incluirla en el intent directo de Twitter
  // pero podemos mencionar que hay imagen
  if (tweet.imageUrl) {
    text += '\n\n📸 Incluye imagen'
  }

  const encodedText = encodeURIComponent(text)
  const url = `https://twitter.com/intent/tweet?text=${encodedText}`

  window.open(
    url,
    '_blank',
    'width=550,height=420,menubar=no,toolbar=no,resizable=yes,scrollbars=yes',
  )
}

const handleImageError = async (tweet: ThreadTweet, index: number) => {
  console.warn(`Error loading image for tweet ${index + 1}`, tweet.imageUrl)
  // Simplemente quitamos la imagen si hay error
  const updatedTweets = [...props.tweets]
  updatedTweets[index] = {
    ...updatedTweets[index],
    imageUrl: '',
  }
  emit('tweetsUpdated', updatedTweets)
}

const getThreadSizeLabel = () => {
  const count = props.tweets.length
  if (count <= 3) return 'Hilo corto'
  if (count === 4) return 'Hilo medio'
  return 'Hilo extenso'
}
</script>
