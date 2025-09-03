<template>
  <div class="card mt-6">
    <div class="flex items-center mb-6">
      <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800">Publicar en Twitter</h2>
        <p class="text-gray-600 text-sm">Comparte tu hilo directamente o cópialo al portapapeles</p>
      </div>
    </div>

    <!-- Configuración de Token -->
    <div v-if="!sessionStore.hasTwitterToken() || showTokenConfig" class="mb-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div class="flex items-start">
          <svg
            class="w-5 h-5 text-blue-500 mr-2 mt-0.5"
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
            <p class="text-blue-800 text-sm font-medium mb-2">Configuración de Twitter API</p>
            <p class="text-blue-700 text-sm mb-3">
              Para publicar directamente, necesitas un Bearer Token de la API de Twitter.
              <a
                href="https://developer.twitter.com/en/docs/twitter-api/getting-started/getting-access-to-the-twitter-api"
                target="_blank"
                class="underline hover:no-underline"
              >
                Aprende cómo obtenerlo aquí
              </a>
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label for="token" class="block text-sm font-medium text-gray-700 mb-2">
            Bearer Token de Twitter
          </label>
          <div class="relative">
            <input
              id="token"
              v-model="tokenInput"
              :type="showToken ? 'text' : 'password'"
              placeholder="AAAA..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-24"
              :class="{ 'border-red-300': tokenError }"
            />
            <div class="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
              <button
                type="button"
                @click="showToken = !showToken"
                class="p-1 text-gray-400 hover:text-gray-600"
                title="Mostrar/Ocultar token"
              >
                <svg
                  v-if="!showToken"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3.122-3.122l1.5-1.5"
                  />
                </svg>
              </button>
            </div>
          </div>
          <p v-if="tokenError" class="mt-2 text-sm text-red-600">
            {{ tokenError }}
          </p>
          <p class="mt-2 text-xs text-gray-500">
            Tu token se guarda solo durante esta sesión y nunca se envía a nuestros servidores
          </p>
        </div>

        <div class="flex space-x-3">
          <button @click="saveToken" :disabled="!tokenInput.trim()" class="btn-primary">
            Guardar Token
          </button>
          <button v-if="sessionStore.hasTwitterToken()" @click="clearToken" class="btn-secondary">
            Limpiar Token
          </button>
        </div>
      </div>
    </div>

    <!-- Botones de acción -->
    <div v-else class="space-y-4">
      <!-- Información del token configurado -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <svg
              class="w-4 h-4 text-green-500 mr-2"
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
            <span class="text-green-800 text-sm font-medium">Token de Twitter configurado</span>
          </div>
          <button
            @click="showTokenConfig = true"
            class="text-green-700 hover:text-green-800 text-sm underline"
          >
            Cambiar
          </button>
        </div>
      </div>

      <!-- Botones principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button @click="publishThread" :disabled="!canPublish || isPosting" class="btn-primary">
          <span v-if="!isPosting" class="flex items-center justify-center">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              />
            </svg>
            Publicar Hilo
          </span>
          <span v-else class="flex items-center justify-center">
            <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
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
            Publicando...
          </span>
        </button>

        <button @click="copyToClipboard" class="btn-secondary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          Copiar al Portapapeles
        </button>
      </div>
    </div>

    <!-- Alertas de validación -->
    <div
      v-if="validationErrors.length > 0"
      class="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4"
    >
      <div class="flex items-start">
        <svg
          class="w-5 h-5 text-yellow-500 mr-2 mt-0.5"
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
          <p class="text-yellow-800 text-sm font-medium mb-2">
            Antes de publicar, revisa lo siguiente:
          </p>
          <ul class="text-yellow-700 text-sm space-y-1">
            <li v-for="error in validationErrors" :key="error" class="flex items-center">
              <span class="w-1 h-1 bg-yellow-500 rounded-full mr-2"></span>
              {{ error }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Mensajes de éxito/error -->
    <div v-if="successMessage" class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
      <div class="flex items-start">
        <svg
          class="w-5 h-5 text-green-500 mr-2 mt-0.5"
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
        <p class="text-green-800 text-sm">{{ successMessage }}</p>
      </div>
    </div>

    <div v-if="error" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
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
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-red-800 text-sm">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTwitter } from '@/composables/useTwitter'
import { useSessionStore } from '@/stores/session'
import type { ThreadTweet } from '@/composables/useLLM'

interface Props {
  tweets: ThreadTweet[]
}

const props = defineProps<Props>()

const sessionStore = useSessionStore()
const { postThread, copyThreadToClipboard, validateToken, isPosting, error, successMessage } =
  useTwitter()

const tokenInput = ref('')
const tokenError = ref<string | null>(null)
const showToken = ref(false)
const showTokenConfig = ref(false)

const validationErrors = computed(() => {
  const errors: string[] = []

  if (props.tweets.length === 0) {
    errors.push('No hay tweets para publicar')
  }

  const longTweets = props.tweets.filter((t) => t.charCount > 280)
  if (longTweets.length > 0) {
    errors.push(`${longTweets.length} tweet(s) exceden los 280 caracteres`)
  }

  return errors
})

const canPublish = computed(() => {
  return (
    sessionStore.hasTwitterToken() &&
    sessionStore.isValidToken() &&
    validationErrors.value.length === 0
  )
})

const saveToken = () => {
  tokenError.value = null

  if (!tokenInput.value.trim()) {
    tokenError.value = 'Por favor ingresa un token'
    return
  }

  if (!validateToken(tokenInput.value)) {
    tokenError.value = 'Token inválido. Debe comenzar con "AAAA" y tener más de 50 caracteres.'
    return
  }

  sessionStore.setTwitterToken(tokenInput.value)
  showTokenConfig.value = false
  tokenInput.value = ''
}

const clearToken = () => {
  sessionStore.clearTwitterToken()
  showTokenConfig.value = true
}

const publishThread = async () => {
  if (!canPublish.value) return

  try {
    await postThread(props.tweets, {
      bearerToken: sessionStore.twitterToken,
    })
  } catch (error) {
    console.error('Error publishing thread:', error)
  }
}

const copyToClipboard = async () => {
  try {
    await copyThreadToClipboard(props.tweets)
  } catch (error) {
    console.error('Error copying to clipboard:', error)
  }
}

// Cargar token guardado al montar el componente
sessionStore.loadTwitterToken()
</script>
