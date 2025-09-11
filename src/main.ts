import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { logger } from './utils/logger'

import './assets/main.css'

// Configuración inicial
const savedTheme = localStorage.getItem('nina-note-theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

const initializeApp = async () => {
  logger.info('🔥 Nina Note - Starting up...')

  const app = createApp(App)
  const head = createHead()

  // Usar todos los plugins en el orden correcto
  app.use(head)
  app.use(i18n)
  app.use(createPinia())
  app.use(router)

  app.mount('#app')

  logger.success('Application mounted successfully')
}

// Manejo global de errores
window.addEventListener('error', (event) => {
  logger.error('Global error occurred', { data: event.error })
})

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', { data: event.reason })
  event.preventDefault()
})

// Inicializar la aplicación
initializeApp().catch((error) => {
  logger.error('Failed to initialize application', { data: error })
})
