<template>
  <div class="terminal-fixed bg-surfaceContainerLow border-t border-outlineVariant shadow-lg">
    <div
      class="terminal-header bg-surfaceContainerHigh px-4 py-3 cursor-pointer"
      @click="toggleExpanded"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3 min-w-0 flex-1">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-error rounded-full"></div>
            <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div class="w-2 h-2 bg-primary rounded-full"></div>
          </div>

          <div class="min-w-0 flex-1 ml-2">
            <p class="text-sm font-medium text-onSurface truncate" :title="statusMessage">
              {{ statusMessage }}
            </p>
            <p class="text-xs text-onSurfaceVariant/60">
              {{ stats.timeElapsed }}s • {{ totalLogs }} total • {{ visibleLogs.length }} visible
              <span :class="hasUnreadLogs ? 'text-primary' : 'text-onSurfaceVariant/60'">
                {{ hasUnreadLogs ? ' • New messages' : '' }}
              </span>
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-3 ml-4">
          <button
            v-if="totalLogs > 0"
            @click.stop="clearLogs"
            class="text-xs text-onSurfaceVariant/60 hover:text-onSurfaceVariant px-2 py-1 rounded transition-colors"
            title="Clear all logs"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>

          <span class="text-xs text-onSurfaceVariant/60">
            {{ isExpanded ? 'Collapse' : 'Expand' }}
          </span>
          <svg
            class="w-4 h-4 text-onSurfaceVariant transition-transform"
            :class="{ 'rotate-180': isExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>

    <transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-300 ease-in"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-80"
      leave-from-class="opacity-100 max-h-80"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="isExpanded" class="terminal-content-wrapper" ref="contentWrapper">
        <div
          class="terminal-content bg-surfaceContainerHighest"
          :style="terminalStyle"
          ref="contentElement"
        >
          <!-- Solo mostrar logs visibles -->
          <div v-for="(log, index) in visibleLogs" :key="log.id" class="terminal-line group">
            <span class="text-onSurfaceVariant/60 text-xs whitespace-nowrap">
              [{{ formatTime(log.timestamp) }}]
            </span>
            <span :class="getLogClass(log)" class="flex-1 min-w-0">{{ log.message }}</span>
            <span
              v-if="log.data"
              class="text-onSurfaceVariant/40 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              {{ formatData(log.data) }}
            </span>
          </div>

          <!-- Línea de carga actual -->
          <div v-if="isLoading" class="terminal-line">
            <span class="text-onSurfaceVariant/60 text-xs whitespace-nowrap">
              [{{ currentTime }}]
            </span>
            <span class="text-primary flex-1">Processing</span>
            <span class="blinking-cursor text-primary">_</span>
          </div>

          <!-- Prompt de terminal cuando no hay actividad -->
          <div
            v-if="!isLoading && visibleLogs.length === 0"
            class="terminal-line text-onSurfaceVariant/40 text-xs"
          >
            nina-note@terminal:~$ System ready. Logs will stream here...
          </div>

          <!-- Línea final con cursor parpadeante (solo cuando no está cargando) -->
          <div v-if="!isLoading" class="terminal-line terminal-prompt">
            <span class="text-onSurfaceVariant/60 text-xs whitespace-nowrap">
              nina-note@terminal:~$
            </span>
            <span class="blinking-cursor text-onSurfaceVariant/80">_</span>
          </div>

          <!-- Indicador de logs truncados -->
          <div
            v-if="totalLogs > maxVisibleLogs && visibleLogs.length >= maxVisibleLogs"
            class="terminal-line text-onSurfaceVariant/40 text-xs border-t border-outlineVariant/20 pt-2 mt-2"
          >
            ... {{ totalLogs - maxVisibleLogs }} earlier messages (use clear to reset buffer)
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useTerminal } from '@/composables/useTerminal'

interface Props {
  isLoading?: boolean
  maxVisibleLogs?: number
  maxTotalLogs?: number
  autoExpand?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  maxVisibleLogs: 15,
  maxTotalLogs: 60,
  autoExpand: true,
})

// Usar el composable
const {
  // Estado reactivo
  totalLogs,
  visibleLogs,
  isExpanded,
  hasUnreadLogs,
  currentTime,
  statusMessage,
  stats,
  terminalStyle,

  // Referencias DOM
  contentWrapper,
  contentElement,

  // Métodos de utilidad
  formatTime,
  formatData,
  getLogClass,

  // Métodos de control
  toggleExpanded,
  clearLogs,
  addLog,
  getLogs,
  exportLogs,
} = useTerminal({
  maxVisibleLogs: props.maxVisibleLogs,
  maxTotalLogs: props.maxTotalLogs,
  autoExpand: props.autoExpand,
})

// Exponer métodos públicos
defineExpose({
  clearLogs,
  toggleExpanded,
  expand: () => (isExpanded.value = true),
  collapse: () => (isExpanded.value = false),
  addLog,
  getLogs,
  getLogCount: () => totalLogs.value,
  getVisibleLogCount: () => visibleLogs.value.length,
  getStats: () => stats.value,
  exportLogs,
})
</script>

<style scoped>
.terminal-fixed {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  min-height: auto;
  transition: all 0.2s ease-in-out;
}

.terminal-header {
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--color-outlineVariant);
  position: relative;
}

.terminal-header:hover {
  background-color: var(--color-surfaceContainerHighest);
}

.terminal-content-wrapper {
  max-height: 20rem; /* Fixed height like a real terminal */
  overflow: hidden;
}

.terminal-content {
  height: 100%;
  padding: 0.75rem;
  overflow-y: auto;
  scrollbar-width: thin;
  border-top: 1px solid var(--color-outlineVariant);
  display: flex;
  flex-direction: column;
}

.terminal-content::-webkit-scrollbar {
  width: 8px;
}

.terminal-content::-webkit-scrollbar-track {
  background: var(--color-surfaceContainerHigh);
  border-radius: 4px;
}

.terminal-content::-webkit-scrollbar-thumb {
  background: var(--color-outlineVariant);
  border-radius: 4px;
  border: 2px solid var(--color-surfaceContainerHigh);
}

.terminal-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-outline);
}

.terminal-line {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.125rem;
  white-space: nowrap;
  line-height: 1.4;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
  min-height: 1.2rem;
}

.terminal-line:hover {
  background-color: var(--color-surfaceContainerHigh);
}

.terminal-line:last-child {
  margin-bottom: 0;
}

.terminal-prompt {
  margin-top: 0.25rem;
  border-top: 1px solid var(--color-outlineVariant/10);
  padding-top: 0.375rem !important;
}

.blinking-cursor {
  animation: blink 1s infinite;
  font-weight: bold;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .terminal-content-wrapper {
    max-height: 16rem;
  }

  .terminal-header {
    padding: 0.75rem;
  }

  .terminal-line {
    font-size: 0.7rem;
    gap: 0.3rem;
    padding: 0.1rem 0.2rem;
  }

  .terminal-content {
    padding: 0.5rem;
  }
}

/* Accessibility improvements */
.terminal-content:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.terminal-line:focus-within {
  background-color: var(--color-surfaceContainerHigh);
  outline: 1px solid var(--color-outlineVariant);
}
</style>
