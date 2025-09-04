import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { logger } from './utils/logger'

import './assets/main.css'

// Configuración inicial
const savedTheme = localStorage.getItem('nina-note-theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

// Detectar Puter.js
const detectPuterEnvironment = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).puter
}

const initializeApp = async () => {
  logger.info('🔥 Nina Note - Starting up...')

  const isPuterEnvironment = detectPuterEnvironment()
  logger.info('Environment detected', {
    data: { environment: isPuterEnvironment ? 'Puter.js' : 'Development' },
  })

  if (isPuterEnvironment) {
    await initializePuter()
  }

  const app = createApp(App)

  app.use(i18n)
  app.use(createPinia())
  app.use(router)

  app.mount('#app')

  logger.success('Application mounted successfully')
}

const initializePuter = async (): Promise<void> => {
  try {
    const puter = (window as any).puter

    // Verificar APIs críticas
    const criticalApis = ['ai', 'net', 'auth']
    const availableApis = criticalApis.filter((api) => !!puter[api])

    if (availableApis.length !== criticalApis.length) {
      logger.warn('Not all Puter.js APIs are available', {
        data: {
          available: availableApis,
          missing: criticalApis.filter((api) => !availableApis.includes(api)),
        },
      })
    }

    // Verificar autenticación
    try {
      const userInfo = await puter.auth.getUser()
      logger.success('User authenticated', { data: { username: userInfo.username } })
    } catch (authError) {
      logger.warn('User not authenticated, some features may be limited')

      // Intentar autenticación automática
      try {
        await puter.auth.signIn()
        logger.success('User authentication completed')
      } catch (signInError) {
        logger.warn('User authentication cancelled or failed')
      }
    }

    logger.success('Puter.js initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize Puter.js', { data: error })
  }
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
