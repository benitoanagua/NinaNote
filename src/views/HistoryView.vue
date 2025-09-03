<template>
  <div class="min-h-screen bg-background py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-onSurface mb-2">Historial de Hilos</h1>
        <p class="text-onSurfaceVariant">Tus hilos generados recientemente</p>
      </div>

      <div v-if="sessionStore.savedThreads.length === 0" class="text-center py-12">
        <div class="w-24 h-24 mx-auto mb-6 text-onSurfaceVariant/30">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p class="text-onSurfaceVariant mb-4">No hay hilos guardados todavía</p>
        <router-link
          to="/"
          class="px-6 py-2 bg-primary text-onPrimary rounded-lg shadow-md3 hover:shadow-md3-lg"
        >
          Crear tu primer hilo
        </router-link>
      </div>

      <div v-else class="space-y-6">
        <div
          v-for="thread in sessionStore.savedThreads"
          :key="thread.id"
          class="bg-surfaceContainerHigh rounded-xl p-6 shadow-md3"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="font-semibold text-onSurface mb-1">{{ thread.title }}</h3>
              <a
                :href="thread.url"
                target="_blank"
                class="text-primary hover:text-primary text-sm break-all"
              >
                {{ thread.url }}
              </a>
              <p class="text-onSurfaceVariant text-sm mt-1">
                {{ formatDate(thread.createdAt) }}
              </p>
            </div>
            <button
              @click="deleteThread(thread.id)"
              class="p-2 text-onSurfaceVariant hover:text-error rounded-full"
              title="Eliminar hilo"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(tweet, index) in thread.tweets"
              :key="index"
              class="bg-surfaceContainer rounded-lg p-3"
            >
              <div class="flex items-start mb-2">
                <div
                  class="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-onPrimary text-xs font-semibold mr-2"
                >
                  {{ index + 1 }}
                </div>
                <div class="text-sm text-onSurfaceVariant">{{ tweet.charCount }}/280</div>
              </div>
              <p class="text-onSurface text-sm leading-relaxed">
                {{ tweet.content }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const deleteThread = (threadId: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar este hilo?')) {
    sessionStore.deleteThread(threadId)
  }
}
</script>
