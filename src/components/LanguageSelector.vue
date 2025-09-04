<template>
  <div class="flex bg-surfaceContainerHighest rounded-full p-1 shadow-md3">
    <button
      @click="setLanguage('es')"
      class="p-2 rounded-full transition-all duration-200 flex items-center justify-center min-w-[44px]"
      :class="{
        'bg-primary text-onPrimary shadow-sm': currentLocale === 'es',
        'text-onSurfaceVariant hover:text-onSurface': currentLocale !== 'es',
      }"
      title="Español"
      aria-label="Cambiar a español"
    >
      <span class="text-sm">🇪🇸</span>
    </button>

    <button
      @click="setLanguage('en')"
      class="p-2 rounded-full transition-all duration-200 flex items-center justify-center min-w-[44px]"
      :class="{
        'bg-primary text-onPrimary shadow-sm': currentLocale === 'en',
        'text-onSurfaceVariant hover:text-onSurface': currentLocale !== 'en',
      }"
      title="English"
      aria-label="Change to English"
    >
      <span class="text-sm">🇺🇸</span>
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
</style>
