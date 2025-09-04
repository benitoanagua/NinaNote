import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SavedThread, ThreadTweet } from '@/core/types'

export const useSessionStore = defineStore('session', () => {
  // Estado
  const twitterToken = ref<string>('')
  const lastProcessedUrl = ref<string>('')
  const savedThreads = ref<SavedThread[]>([])

  // Getters
  const hasTwitterToken = () => twitterToken.value.length > 0
  const isValidToken = () => twitterToken.value.length > 50 && twitterToken.value.startsWith('AAAA')

  // Actions
  const setTwitterToken = (token: string) => {
    twitterToken.value = token.trim()
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nina-note-token', token.trim())
    }
  }

  const loadTwitterToken = () => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('nina-note-token')
      if (stored) {
        twitterToken.value = stored
      }
    }
  }

  const clearTwitterToken = () => {
    twitterToken.value = ''
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nina-note-token')
    }
  }

  const setLastProcessedUrl = (url: string) => {
    lastProcessedUrl.value = url
  }

  const saveThread = (thread: { url: string; title: string; tweets: ThreadTweet[] }) => {
    const savedThread: SavedThread = {
      id: Date.now().toString(),
      ...thread,
      createdAt: new Date().toISOString(),
    }

    savedThreads.value.unshift(savedThread)

    // Mantener solo los últimos 10 hilos
    if (savedThreads.value.length > 10) {
      savedThreads.value = savedThreads.value.slice(0, 10)
    }

    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('nina-note-threads', JSON.stringify(savedThreads.value))
    }
  }

  const loadSavedThreads = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nina-note-threads')
      if (stored) {
        try {
          savedThreads.value = JSON.parse(stored)
        } catch (e) {
          console.error('Error loading saved threads:', e)
        }
      }
    }
  }

  const deleteThread = (threadId: string) => {
    savedThreads.value = savedThreads.value.filter((t) => t.id !== threadId)

    if (typeof window !== 'undefined') {
      localStorage.setItem('nina-note-threads', JSON.stringify(savedThreads.value))
    }
  }

  return {
    // Estado
    twitterToken,
    lastProcessedUrl,
    savedThreads,

    // Getters
    hasTwitterToken,
    isValidToken,

    // Actions
    setTwitterToken,
    loadTwitterToken,
    clearTwitterToken,
    setLastProcessedUrl,
    saveThread,
    loadSavedThreads,
    deleteThread,
  }
})
