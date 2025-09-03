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

if (isPuterEnvironment) {
  console.log('✅ Puter.js detected - Full functionality available')
  console.log('🤖 AI Models:', (window as any).puter?.ai ? 'Available' : 'Not Available')
  console.log('🌐 Network:', (window as any).puter?.net ? 'Available' : 'Not Available')
} else {
  console.log('⚠️ Development mode - Using mock data and examples')
  console.log('💡 For full functionality, run in Puter.js environment')
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
