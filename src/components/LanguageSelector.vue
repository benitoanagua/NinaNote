<template>
  <div class="flex bg-surfaceContainerHighest rounded-full p-1 shadow-md3">
    <button
      @click="setLanguage('es')"
      class="p-2 rounded-full transition-all duration-200 flex items-center justify-center min-w-[44px]"
      :class="{
        'bg-primary text-onPrimary shadow-sm': currentLocale === 'es',
        'text-onSurfaceVariant hover:text-onSurface': currentLocale !== 'es',
      }"
      :title="currentLocale === 'es' ? 'Español (seleccionado)' : 'Cambiar a español'"
      :aria-label="currentLocale === 'es' ? 'Español seleccionado' : 'Cambiar a español'"
      :aria-pressed="currentLocale === 'es'"
    >
      <span class="text-sm">🇪🇸</span>
      <span class="sr-only">Español</span>
    </button>

    <button
      @click="setLanguage('en')"
      class="p-2 rounded-full transition-all duration-200 flex items-center justify-center min-w-[44px]"
      :class="{
        'bg-primary text-onPrimary shadow-sm': currentLocale === 'en',
        'text-onSurfaceVariant hover:text-onSurface': currentLocale !== 'en',
      }"
      :title="currentLocale === 'en' ? 'English (selected)' : 'Change to English'"
      :aria-label="currentLocale === 'en' ? 'English selected' : 'Change to English'"
      :aria-pressed="currentLocale === 'en'"
    >
      <span class="text-sm">🇺🇸</span>
      <span class="sr-only">English</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

const setLanguage = (lang: 'es' | 'en') => {
  currentLocale.value = lang
  locale.value = lang
  localStorage.setItem('nina-note-language', lang)
}

onMounted(() => {
  const savedLanguage = localStorage.getItem('nina-note-language')
  if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
    currentLocale.value = savedLanguage
    locale.value = savedLanguage
  }
})
</script>

<style scoped>
button {
  transition: all 0.2s ease-in-out;
}

button:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Mejoras para móviles */
@media (max-width: 768px) {
  .min-w-\[44px\] {
    min-width: 36px;
  }

  .p-2 {
    padding: 0.5rem;
  }
}
</style>
