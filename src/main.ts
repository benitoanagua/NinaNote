import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './assets/main.css'

// Función para detectar Puter.js
const detectPuterEnvironment = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).puter
}

// Configurar tema inicial
const savedTheme = localStorage.getItem('nina-note-theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

// Log del entorno detectado
const isPuterEnvironment = detectPuterEnvironment()
console.log('🔥 Nina Note - Starting up...')
console.log('Environment:', isPuterEnvironment ? 'Puter.js' : 'Development')

// Verificar que puter.js esté completamente cargado
const checkPuterReady = async (): Promise<boolean> => {
  const puter = (window as any).puter
  if (!puter) return false

  // Esperar a que las APIs críticas estén disponibles
  const criticalApis = ['ai', 'net', 'auth']
  for (const api of criticalApis) {
    if (!puter[api]) {
      console.warn(`Puter.js API ${api} not available`)
      return false
    }
  }

  return true
}

// Usar esta verificación en tu app
const isPuterReady = isPuterEnvironment ? await checkPuterReady() : false

console.log('Puter.js ready:', isPuterReady)

// Después de detectar Puter.js, verificar autenticación
if (isPuterEnvironment) {
  console.log('✅ Puter.js detected - Full functionality available')

  // Verificar autenticación
  try {
    const userInfo = await (window as any).puter.auth.getUser()
    console.log('👤 User authenticated:', userInfo.username)
  } catch (authError) {
    console.warn('⚠️ User not authenticated. Some features may be limited.')
    console.log('💡 Prompting user to sign in...')

    // Opcional: iniciar autenticación automáticamente
    try {
      await (window as any).puter.auth.signIn()
    } catch (signInError) {
      console.log('User cancelled authentication or error occurred')
    }
  }
}

const app = createApp(App)

// Añadir propiedad global para acceso fácil al estado de Puter
app.config.globalProperties.$puterAvailable = isPuterEnvironment

app.use(createPinia())
app.use(router)

app.mount('#app')

// Verificar disponibilidad de APIs específicas después del montaje
app.use(() => {
  if (isPuterEnvironment) {
    const puter = (window as any).puter

    // Verificar APIs específicas
    const apis = {
      'AI Chat': !!puter?.ai?.chat,
      'Network Fetch': !!puter?.net?.fetch,
      'File System': !!puter?.fs,
      'UI Components': !!puter?.ui,
    }

    console.log('📋 Puter.js API Status:')
    Object.entries(apis).forEach(([name, available]) => {
      console.log(`  ${available ? '✅' : '❌'} ${name}`)
    })

    // Advertencias si faltan APIs críticas
    if (!apis['AI Chat']) {
      console.warn('⚠️ puter.ai.chat not available - AI features will use fallbacks')
    }
    if (!apis['Network Fetch']) {
      console.warn('⚠️ puter.net.fetch not available - Web scraping will use fallbacks')
    }
  }
})

// Error handler global para problemas de Puter.js
window.addEventListener('error', (event) => {
  if (event.message?.includes('puter')) {
    console.error('🚨 Puter.js Error:', event.message)
    console.log('💡 Tip: Ensure you are running Nina Note in the Puter.js environment')
  }
})

// Handler para errores de promesas no capturadas
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('puter')) {
    console.error('🚨 Puter.js Promise Rejection:', event.reason)
    event.preventDefault() // Evita que aparezca en consola como error no manejado
  }
})

export { isPuterEnvironment }
