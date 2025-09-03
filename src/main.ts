import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './assets/main.css'

// Configurar tema inicial
const savedTheme = localStorage.getItem('nina-note-theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
