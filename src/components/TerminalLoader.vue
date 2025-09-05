<template>
  <div class="terminal-loader bg-surfaceContainerHigh rounded-xl p-6 shadow-md3">
    <div
      class="terminal-header bg-surfaceContainerHighest rounded-t-lg p-3 border-b border-outline"
    >
      <div class="flex items-center">
        <div class="flex space-x-2 mr-3">
          <div class="w-3 h-3 bg-error rounded-full"></div>
          <div class="w-3 h-3 bg-warning rounded-full"></div>
          <div class="w-3 h-3 bg-success rounded-full"></div>
        </div>
        <span class="text-onSurfaceVariant text-sm font-mono">nina-note-terminal</span>
        <span class="ml-auto text-onSurfaceVariant text-xs">
          {{ logs.length }} lines • {{ stats.timeElapsed }}s
        </span>
      </div>
    </div>

    <div class="terminal-body bg-surfaceContainerHighest rounded-b-lg p-4 font-mono text-sm">
      <div class="terminal-content h-64 overflow-y-auto rounded-lg p-4" :style="terminalStyle">
        <div v-for="(log, index) in logs" :key="index" class="terminal-line">
          <span class="text-blue-400">[{{ formatTime(log.timestamp) }}] </span>
          <span :class="getLogClass(log)">{{ log.message }}</span>
          <span v-if="log.data" class="text-gray-400 ml-2">
            {{ formatData(log.data) }}
          </span>
        </div>

        <div v-if="isLoading" class="terminal-line">
          <span class="text-blue-400">[{{ currentTime }}] </span>
          <span class="text-green-400">Processing...</span>
          <span class="blinking-cursor">_</span>
        </div>
      </div>

      <div class="terminal-stats mt-3 grid grid-cols-4 gap-2 text-xs">
        <div class="bg-primaryContainer/20 rounded p-2 text-center border border-outlineVariant">
          <div class="text-primary font-semibold">{{ stats.infoCount }}</div>
          <div class="text-onSurfaceVariant">Info</div>
        </div>
        <div class="bg-successContainer/20 rounded p-2 text-center border border-outlineVariant">
          <div class="text-success font-semibold">{{ stats.successCount }}</div>
          <div class="text-onSurfaceVariant">Success</div>
        </div>
        <div class="bg-warningContainer/20 rounded p-2 text-center border border-outlineVariant">
          <div class="text-warning font-semibold">{{ stats.warningCount }}</div>
          <div class="text-onSurfaceVariant">Warnings</div>
        </div>
        <div class="bg-errorContainer/20 rounded p-2 text-center border border-outlineVariant">
          <div class="text-error font-semibold">{{ stats.errorCount }}</div>
          <div class="text-onSurfaceVariant">Errors</div>
        </div>
      </div>

      <div class="terminal-actions mt-3 flex justify-between items-center">
        <div class="text-onSurfaceVariant text-xs">Log level: {{ logLevel }}</div>
        <div class="flex space-x-2">
          <button
            @click="clearLogs"
            class="px-3 py-1 text-xs bg-secondaryContainer text-onSecondaryContainer rounded border border-outlineVariant hover:bg-secondaryContainer/80"
            title="Clear terminal"
          >
            Clear
          </button>
          <button
            @click="toggleAutoScroll"
            class="px-3 py-1 text-xs bg-tertiaryContainer text-onTertiaryContainer rounded border border-outlineVariant hover:bg-tertiaryContainer/80"
            :title="autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'"
          >
            {{ autoScroll ? 'Auto: ON' : 'Auto: OFF' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { logger, type LogEntry, LogLevel } from '@/utils/logger'

interface Props {
  isLoading: boolean
}

const props = defineProps<Props>()

const logs = ref<LogEntry[]>([])
const startTime = ref<number>(Date.now())
const currentTime = ref<string>('')
const autoScroll = ref<boolean>(true)
const logLevel = ref<string>('INFO+')

const terminalStyle = computed(() => ({
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: '#4ade80',
  fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
  border: '1px solid var(--color-outlineVariant)',
}))

const stats = computed(() => {
  const totalTime = ((Date.now() - startTime.value) / 1000).toFixed(1)

  return {
    infoCount: logs.value.filter((log) => log.level === LogLevel.INFO).length,
    successCount: logs.value.filter((log) => log.level === LogLevel.SUCCESS).length,
    warningCount: logs.value.filter((log) => log.level === LogLevel.WARN).length,
    errorCount: logs.value.filter((log) => log.level === LogLevel.ERROR).length,
    timeElapsed: totalTime,
  }
})

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const formatData = (data: any) => {
  if (typeof data === 'object') {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }
  return String(data)
}

const getLogClass = (log: LogEntry) => {
  const classes = {
    [LogLevel.INFO]: 'text-blue-400',
    [LogLevel.SUCCESS]: 'text-green-400',
    [LogLevel.WARN]: 'text-yellow-400',
    [LogLevel.ERROR]: 'text-red-400',
    [LogLevel.DEBUG]: 'text-purple-400',
  }
  return classes[log.level] || 'text-gray-400'
}

let removeListener: (() => void) | null = null
let timeInterval: number | null = null

const scrollToBottom = () => {
  if (!autoScroll.value) return

  setTimeout(() => {
    const terminalContent = document.querySelector('.terminal-content')
    if (terminalContent) {
      terminalContent.scrollTop = terminalContent.scrollHeight
    }
  }, 50)
}

const clearLogs = () => {
  logs.value = []
  startTime.value = Date.now()
  logger.info('Terminal cleared', { context: 'Terminal' })
}

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
  if (autoScroll.value) {
    scrollToBottom()
  }
}

onMounted(() => {
  // Actualizar hora actual cada segundo
  const updateTime = () => {
    currentTime.value = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  updateTime()
  timeInterval = window.setInterval(updateTime, 1000)

  // Escuchar logs del sistema
  removeListener = logger.addListener((logEntry: LogEntry) => {
    logs.value.push(logEntry)

    // Mantener máximo 200 líneas en el log
    if (logs.value.length > 200) {
      logs.value = logs.value.slice(-200)
    }

    scrollToBottom()
  })

  // Log inicial
  logger.info('Terminal initialized - Ready to process logs', { context: 'Terminal' })
  logger.info('Listening for system events...', { context: 'Terminal' })
})

// Auto-scroll cuando se añaden nuevos logs
watch(
  logs,
  () => {
    scrollToBottom()
  },
  { deep: true },
)

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (removeListener) {
    removeListener()
  }

  logger.info('Terminal disconnected', { context: 'Terminal' })
})

// Expose methods for external control
defineExpose({
  clearLogs,
  toggleAutoScroll,
  getLogCount: () => logs.value.length,
  getStats: () => stats.value,
})
</script>

<style scoped>
.terminal-content {
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary) #000000;
}

.terminal-content::-webkit-scrollbar {
  width: 6px;
}

.terminal-content::-webkit-scrollbar-track {
  background: #000000;
  border-radius: 3px;
}

.terminal-content::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: 3px;
}

.terminal-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-primaryContainer);
}

.blinking-cursor {
  animation: blink 1s infinite;
  color: var(--color-primary);
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

.terminal-line {
  line-height: 1.4;
  margin-bottom: 2px;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.9em;
}

.terminal-stats {
  border-top: 1px solid var(--color-outlineVariant);
  padding-top: 0.75rem;
}

.terminal-actions {
  border-top: 1px solid var(--color-outlineVariant);
  padding-top: 0.75rem;
}

/* Mejoras de accesibilidad */
button:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

button:hover {
  transform: translateY(-1px);
  transition: transform 0.1s ease;
}

/* Responsividad */
@media (max-width: 640px) {
  .terminal-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .terminal-actions {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .terminal-content {
    height: 48vh;
  }
}
</style>
