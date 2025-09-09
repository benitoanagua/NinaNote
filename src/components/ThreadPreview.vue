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
          <p v-if="availableImages.length > 0" class="text-xs text-primary mt-1">
            📸 {{ availableImages.length }} imágenes disponibles
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

            <!-- Botón para copiar tweet individual -->
            <button
              @click="copySingleTweet(index)"
              class="p-2 text-onSurfaceVariant hover:text-primary rounded-full transition-colors"
              :title="$t('twitter.copyTweet')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
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

          <!-- Sección de imágenes -->
          <div class="mt-3 space-y-2">
            <!-- Mostrar imagen personalizada si existe -->
            <div v-if="tweet.imageUrl" class="relative">
              <img
                :src="normalizeImageUrl(tweet.imageUrl)"
                :alt="`Imagen para tweet ${index + 1}`"
                class="rounded-lg w-full h-48 object-cover shadow-sm"
                @error="handleImageError(tweet, index)"
              />
              <p class="text-xs text-onSurfaceVariant mt-1 text-center">
                Imagen {{ index + 1 }} de {{ tweets.length }}
              </p>
            </div>

            <!-- Mostrar imagen scrapeada solo si NO hay imagen personalizada -->
            <div v-else-if="scrapedImages[index]" class="relative">
              <img
                :src="normalizeImageUrl(scrapedImages[index])"
                :alt="`Imagen scrapeada para tweet ${index + 1}`"
                class="rounded-lg w-full h-48 object-cover shadow-sm"
                @error="handleScrapedImageError(index)"
              />
              <p class="text-xs text-onSurfaceVariant mt-1 text-center">
                Imagen scrapeada {{ index + 1 }} de {{ tweets.length }}
              </p>
            </div>

            <!-- Selector de imágenes disponibles -->
            <div v-if="!tweet.imageUrl && availableImages.length > 0" class="mt-2">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-onSurfaceVariant">Imágenes disponibles:</span>
                <button
                  @click="toggleImageSelector(index)"
                  class="text-xs text-primary hover:text-primary/80"
                >
                  {{ showImageSelector === index ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>

              <div
                v-if="showImageSelector === index"
                class="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto"
              >
                <div
                  v-for="(img, imgIndex) in availableImages"
                  :key="imgIndex"
                  class="cursor-pointer border-2 rounded-lg transition-all"
                  :class="{
                    'border-primary': selectedImageIndex === imgIndex,
                    'border-outlineVariant': selectedImageIndex !== imgIndex,
                  }"
                  @click="selectImage(index, img, imgIndex)"
                >
                  <img
                    :src="normalizeImageUrl(img)"
                    :alt="`Imagen ${imgIndex + 1}`"
                    class="w-full h-16 object-cover rounded-md"
                    @error="handleAvailableImageError(imgIndex)"
                  />
                </div>
              </div>

              <div v-if="showImageSelector === index" class="mt-2 flex gap-2">
                <button
                  @click="applySelectedImage(index)"
                  :disabled="selectedImageIndex === null"
                  class="px-3 py-1 text-sm bg-primary text-onPrimary rounded-lg disabled:opacity-50 transition-colors"
                >
                  Aplicar imagen
                </button>
                <button
                  @click="cancelImageSelection"
                  class="px-3 py-1 text-sm text-onSurfaceVariant rounded-lg border border-outlineVariant transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>

            <!-- Botón para agregar imagen URL personalizada -->
            <div v-if="!tweet.imageUrl" class="mt-2">
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
                {{ availableImages.length > 0 ? 'Otra imagen' : 'Agregar imagen' }}
              </button>
            </div>
          </div>

          <!-- Input para URL de imagen personalizada -->
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

    <!-- Sección de exportación del hilo completo -->
    <div v-if="tweets.length > 0" class="mt-8 bg-surfaceContainerHigh rounded-xl p-6 shadow-md3">
      <div class="flex items-center mb-6">
        <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
          <svg class="w-5 h-5 text-onPrimary" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-semibold text-onSurface">Exportar Hilo</h2>
          <p class="text-onSurfaceVariant text-sm">
            Copia todo el hilo para publicarlo donde prefieras
          </p>
          <p v-if="availableImages.length > 0" class="text-xs text-primary mt-1">
            📸 {{ availableImages.length }} imágenes disponibles para usar
          </p>
        </div>
      </div>

      <!-- Mensajes de estado -->
      <div v-if="message" class="mb-4 p-4 rounded-lg" :class="messageClass">
        <p class="text-sm">{{ message }}</p>
      </div>

      <!-- Botones de acción -->
      <div class="space-y-4">
        <!-- Copiar todo el hilo al portapapeles -->
        <button
          @click="copyFullThreadToClipboard"
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
          Copiar Hilo Completo
        </button>

        <!-- Compartir primer tweet -->
        <button
          @click="shareFirstTweet"
          :disabled="tweets.length === 0"
          class="w-full py-3 bg-primary text-onPrimary rounded-xl shadow-md3 hover:shadow-md3-lg disabled:opacity-60 disabled:pointer-events-none transition-all duration-200 font-medium flex items-center justify-center"
        >
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </svg>
          Compartir Primer Tweet
        </button>
      </div>

      <!-- Instrucciones -->
      <div class="mt-6 bg-surfaceContainer rounded-lg p-4">
        <h4 class="text-sm font-medium text-onSurface mb-2">Instrucciones:</h4>
        <ol class="text-onSurfaceVariant text-sm space-y-1 list-decimal list-inside">
          <li>
            Usa el botón de compartir (🐦) en cada tweet para publicarlo individualmente en Twitter
          </li>
          <li>Usa 'Copiar Hilo Completo' para pegar todo el hilo en otras aplicaciones</li>
          <li v-if="availableImages.length > 0">
            Selecciona imágenes de las disponibles usando el selector en cada tweet
          </li>
          <li>Agrega imágenes personalizadas usando el botón 'Agregar imagen'</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ThreadTweet } from '@/core/types'
import { logger } from '@/utils/logger'

interface Props {
  tweets: ThreadTweet[]
  originalContent: string
  scrapedImages?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  scrapedImages: () => [],
})

const emit = defineEmits<{
  tweetsUpdated: [tweets: ThreadTweet[]]
}>()

// Función para validar imágenes - DEFINIDA AL INICIO
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

    // También aceptar URLs que contengan términos comunes de imágenes
    const hasImageIndicator =
      /\.(jpg|jpeg|png|gif|webp|avif|svg)/i.test(url) ||
      /\/images?\//i.test(url) ||
      /\/media\//i.test(url) ||
      /\/img\//i.test(url)

    return hasImageExtension || hasImageIndicator
  } catch {
    // Si no es una URL válida, verificar si parece una ruta de imagen
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(url)
  }
}

// Función para normalizar URLs de imágenes
const normalizeImageUrl = (url: string): string => {
  if (!url) return url

  // Si la URL ya es absoluta, devolverla tal cual
  if (url.startsWith('http')) return url

  // Si comienza con //, agregar https:
  if (url.startsWith('//')) return `https:${url}`

  // Si es una ruta relativa, intentar construir una URL absoluta
  if (url.startsWith('/')) {
    // Intentar obtener el dominio de las imágenes scrapeadas
    const baseUrl = props.scrapedImages.find((img) => img && img.startsWith('http'))
    if (baseUrl) {
      try {
        const parsedUrl = new URL(baseUrl)
        return `${parsedUrl.origin}${url}`
      } catch {
        return url
      }
    }
  }

  return url
}

// Estado para manejar imágenes
const showImageInputIndex = ref<number | null>(null)
const showImageSelector = ref<number | null>(null)
const imageUrlInput = ref('')
const selectedImageIndex = ref<number | null>(null)
const message = ref<string>('')
const selectedImageForTweet = ref<Record<number, string>>({})

const availableImages = computed(() => {
  return props.scrapedImages
    .filter((img) => img && isValidImageUrl(img))
    .map((img) => normalizeImageUrl(img))
})

const messageClass = computed(() => {
  return message.value.includes('✅')
    ? 'bg-primaryContainer/30 text-primary border border-primaryContainer'
    : 'bg-errorContainer/30 text-error border border-errorContainer'
})

// Log de imágenes disponibles
watch(
  availableImages,
  (newImages) => {
    if (newImages.length > 0) {
      console.log('📸 Imágenes disponibles para tweets:', newImages)
      logger.info('Imágenes scrapeadas disponibles para asignar', {
        context: 'ThreadPreview',
        data: {
          count: newImages.length,
          images: newImages.slice(0, 5).map((img, index) => ({
            index,
            url: img.substring(0, 40) + (img.length > 40 ? '...' : ''),
            valid: isValidImageUrl(img),
          })),
        },
      })
    }
  },
  { immediate: true },
)

// Métodos para manejar imágenes
const toggleImageSelector = (index: number) => {
  showImageSelector.value = showImageSelector.value === index ? null : index
  selectedImageIndex.value = null
}

const selectImage = (tweetIndex: number, imageUrl: string, imgIndex: number) => {
  selectedImageForTweet.value[tweetIndex] = imageUrl
  selectedImageIndex.value = imgIndex
}

const applySelectedImage = (index: number) => {
  if (selectedImageForTweet.value[index]) {
    const normalizedUrl = normalizeImageUrl(selectedImageForTweet.value[index])
    const updatedTweets = [...props.tweets]
    updatedTweets[index] = {
      ...updatedTweets[index],
      imageUrl: normalizedUrl,
    }
    emit('tweetsUpdated', updatedTweets)
    showImageSelector.value = null
    selectedImageIndex.value = null
    delete selectedImageForTweet.value[index]
    message.value = '✅ Imagen aplicada correctamente'
    clearMessageAfterDelay()

    logger.info('Imagen aplicada a tweet', {
      context: 'ThreadPreview',
      data: {
        tweetIndex: index,
        imageUrl: normalizedUrl.substring(0, 40) + '...',
      },
    })
  }
}

const cancelImageSelection = () => {
  showImageSelector.value = null
  selectedImageIndex.value = null
  selectedImageForTweet.value = {}
}

const showImageInput = (index: number) => {
  showImageInputIndex.value = index
  imageUrlInput.value = ''
  showImageSelector.value = null
}

const cancelImageInput = () => {
  showImageInputIndex.value = null
  imageUrlInput.value = ''
}

const saveImageUrl = (index: number) => {
  const normalizedUrl = normalizeImageUrl(imageUrlInput.value)
  if (isValidImageUrl(normalizedUrl)) {
    const updatedTweets = [...props.tweets]
    updatedTweets[index] = {
      ...updatedTweets[index],
      imageUrl: normalizedUrl,
    }
    emit('tweetsUpdated', updatedTweets)
    showImageInputIndex.value = null
    imageUrlInput.value = ''
    message.value = '✅ Imagen agregada correctamente'
    clearMessageAfterDelay()

    logger.info('Imagen personalizada agregada', {
      context: 'ThreadPreview',
      data: {
        tweetIndex: index,
        imageUrl: normalizedUrl.substring(0, 40) + '...',
      },
    })
  }
}

const shareSingleTweet = (index: number) => {
  const tweet = props.tweets[index]
  let text = tweet.content

  // Si hay imagen, mencionar que hay imagen
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

  logger.info('Tweet compartido en Twitter', {
    context: 'ThreadPreview',
    data: {
      tweetIndex: index,
      hasImage: !!tweet.imageUrl,
    },
  })
}

const shareFirstTweet = () => {
  if (props.tweets.length > 0) {
    shareSingleTweet(0)
  }
}

const copySingleTweet = async (index: number) => {
  if (props.tweets.length === 0) return

  try {
    const tweet = props.tweets[index]
    await navigator.clipboard.writeText(tweet.content)
    message.value = '✅ Tweet copiado al portapapeles'
    clearMessageAfterDelay()

    logger.info('Tweet copiado al portapapeles', {
      context: 'ThreadPreview',
      data: { tweetIndex: index },
    })
  } catch (error) {
    message.value = '❌ Error al copiar el tweet'
    clearMessageAfterDelay()

    logger.error('Error al copiar tweet', {
      context: 'ThreadPreview',
      data: error,
    })
  }
}

const copyFullThreadToClipboard = async () => {
  if (props.tweets.length === 0) return

  try {
    const threadText = props.tweets
      .map((tweet, index) => `${index + 1}/${props.tweets.length}\n${tweet.content}`)
      .join('\n\n---\n\n')

    await navigator.clipboard.writeText(threadText)
    message.value = '✅ Hilo completo copiado al portapapeles'
    clearMessageAfterDelay()

    logger.info('Hilo completo copiado', {
      context: 'ThreadPreview',
      data: { tweetCount: props.tweets.length },
    })
  } catch (error) {
    message.value = '❌ Error al copiar el hilo'
    clearMessageAfterDelay()

    logger.error('Error al copiar hilo completo', {
      context: 'ThreadPreview',
      data: error,
    })
  }
}

const handleImageError = async (tweet: ThreadTweet, index: number) => {
  console.warn(`Error loading image for tweet ${index + 1}`, tweet.imageUrl)
  logger.warn('Error cargando imagen de tweet', {
    context: 'ThreadPreview',
    data: {
      tweetIndex: index,
      imageUrl: tweet.imageUrl,
      normalizedUrl: normalizeImageUrl(tweet.imageUrl || ''),
    },
  })

  // Intentar con la URL normalizada si es diferente
  const normalizedUrl = normalizeImageUrl(tweet.imageUrl || '')
  if (normalizedUrl !== tweet.imageUrl) {
    logger.info('Intentando con URL normalizada', {
      context: 'ThreadPreview',
      data: { original: tweet.imageUrl, normalized: normalizedUrl },
    })

    const updatedTweets = [...props.tweets]
    updatedTweets[index] = {
      ...updatedTweets[index],
      imageUrl: normalizedUrl,
    }
    emit('tweetsUpdated', updatedTweets)
  } else {
    // Si ya está normalizada y falla, quitar la imagen
    const updatedTweets = [...props.tweets]
    updatedTweets[index] = {
      ...updatedTweets[index],
      imageUrl: '',
    }
    emit('tweetsUpdated', updatedTweets)
  }
}

const handleScrapedImageError = (index: number) => {
  console.warn(`Error loading scraped image for tweet ${index + 1}`)
  logger.warn('Error cargando imagen scrapeada', {
    context: 'ThreadPreview',
    data: {
      imageIndex: index,
      imageUrl: props.scrapedImages[index],
      normalizedUrl: normalizeImageUrl(props.scrapedImages[index]),
    },
  })
}

const handleAvailableImageError = (imgIndex: number) => {
  console.warn(`Error loading available image ${imgIndex + 1}`)
  logger.warn('Error cargando imagen disponible', {
    context: 'ThreadPreview',
    data: {
      imageIndex: imgIndex,
      imageUrl: availableImages.value[imgIndex],
      normalizedUrl: normalizeImageUrl(availableImages.value[imgIndex]),
    },
  })
}

const getThreadSizeLabel = () => {
  const count = props.tweets.length
  if (count <= 3) return 'Hilo corto'
  if (count === 4) return 'Hilo medio'
  return 'Hilo extenso'
}

const clearMessageAfterDelay = () => {
  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>
