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
              {{ stats.timeElapsed }}s • {{ logs.length }} logs •
              {{ hasUnreadLogs ? 'New messages' : 'No new messages' }}
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-3 ml-4">
          <button
            v-if="logs.length > 0"
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
      enter-to-class="opacity-100 max-h-96"
      leave-from-class="opacity-100 max-h-96"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="shouldShowContent" class="terminal-content-wrapper">
        <div class="terminal-content bg-surfaceContainerHighest" :style="terminalStyle">
          <div v-for="(log, index) in visibleLogs" :key="index" class="terminal-line group">
            <span class="text-onSurfaceVariant/60 text-xs">[{{ formatTime(log.timestamp) }}]</span>
            <span :class="getLogClass(log)">{{ log.message }}</span>
            <span
              v-if="log.data"
              class="text-onSurfaceVariant/40 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {{ formatData(log.data) }}
            </span>
          </div>

          <div v-if="isLoading" class="terminal-line">
            <span class="text-onSurfaceVariant/60 text-xs">[{{ currentTime }}]</span>
            <span class="text-primary">Processing</span>
            <span class="blinking-cursor text-primary">_</span>
          </div>

          <div v-if="logs.length === 0" class="terminal-line text-onSurfaceVariant/40 text-xs">
            System terminal ready. Logs will appear here as processes run.
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { logger, type LogEntry, LogLevel } from '@/utils/logger'

interface Props {
  isLoading?: boolean
  autoCollapse?: boolean
  collapseDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  autoCollapse: true,
  collapseDelay: 5000, // 5 segundos por defecto
})

const logs = ref<LogEntry[]>([])
const startTime = ref<number>(Date.now())
const currentTime = ref<string>('')
const isExpanded = ref(false)
const hasUnreadLogs = ref(false)
const lastLogTimestamp = ref<number>(0)
const collapseTimeout = ref<number | null>(null)

const maxVisibleLines = 15

const terminalStyle = computed(() => ({
  backgroundColor: 'var(--color-surfaceContainerHighest)',
  color: 'var(--color-onSurfaceVariant)',
  fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
  fontSize: '0.75rem',
  lineHeight: '1.25',
}))

const statusMessage = computed(() => {
  if (logs.value.length === 0) return 'System Terminal - Ready'
  const lastLog = logs.value[logs.value.length - 1]
  return `${lastLog.context}: ${lastLog.message}`
})

const visibleLogs = computed(() => {
  return logs.value.slice(-maxVisibleLines)
})

const shouldShowContent = computed(() => {
  return isExpanded.value && logs.value.length > 0
})

const stats = computed(() => {
  const totalTime = ((Date.now() - startTime.value) / 1000).toFixed(1)
  const infoCount = logs.value.filter((log) => log.level === LogLevel.INFO).length
  const successCount = logs.value.filter((log) => log.level === LogLevel.SUCCESS).length
  const warningCount = logs.value.filter((log) => log.level === LogLevel.WARN).length
  const errorCount = logs.value.filter((log) => log.level === LogLevel.ERROR).length

  return {
    infoCount,
    successCount,
    warningCount,
    errorCount,
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

const formatData = (data: any): string => {
  if (typeof data === 'object') {
    try {
      if (data.contentLength) return `${data.contentLength} chars`
      if (data.tweetCount) return `${data.tweetCount} tweets`
      if (data.imageCount) return `${data.imageCount} images`
      if (data.url) return `url: ${data.url.substring(0, 20)}...`
      if (data.error) return `error: ${data.error.message || 'Unknown'}`

      const str = JSON.stringify(data)
      return str.length > 30 ? str.substring(0, 30) + '...' : str
    } catch {
      return 'data'
    }
  }
  return String(data).substring(0, 30) + (String(data).length > 30 ? '...' : '')
}

const getLogClass = (log: LogEntry) => {
  const baseClasses = 'text-sm'
  const levelClasses = {
    [LogLevel.INFO]: 'text-onSurfaceVariant',
    [LogLevel.SUCCESS]: 'text-primary font-medium',
    [LogLevel.WARN]: 'text-yellow-500',
    [LogLevel.ERROR]: 'text-error font-medium',
    [LogLevel.DEBUG]: 'text-onSurfaceVariant/60',
  }
  return `${baseClasses} ${levelClasses[log.level] || 'text-onSurfaceVariant'}`
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    hasUnreadLogs.value = false
    resetCollapseTimeout()
  }
}

const clearLogs = () => {
  logs.value = []
  startTime.value = Date.now()
  hasUnreadLogs.value = false
  logger.info('Terminal logs cleared', { context: 'Terminal' })
}

const resetCollapseTimeout = () => {
  if (collapseTimeout.value) {
    clearTimeout(collapseTimeout.value)
    collapseTimeout.value = null
  }

  if (props.autoCollapse && isExpanded.value) {
    collapseTimeout.value = window.setTimeout(() => {
      isExpanded.value = false
      collapseTimeout.value = null
    }, props.collapseDelay)
  }
}

const handleNewLog = (logEntry: LogEntry) => {
  logs.value.push(logEntry)
  lastLogTimestamp.value = Date.now()
  hasUnreadLogs.value = !isExpanded.value

  if (logs.value.length > 200) {
    logs.value = logs.value.slice(-200)
  }

  // Auto-expand cuando hay nuevos logs importantes
  if (
    !isExpanded.value &&
    (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.WARN)
  ) {
    isExpanded.value = true
    hasUnreadLogs.value = false
  }

  resetCollapseTimeout()
}

let removeListener: (() => void) | null = null
let timeInterval: number | null = null

onMounted(() => {
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

  removeListener = logger.addListener(handleNewLog)

  logger.info('Fixed terminal initialized', { context: 'Terminal' })
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (removeListener) {
    removeListener()
  }
  if (collapseTimeout.value) {
    clearTimeout(collapseTimeout.value)
  }
})

// Watch for expansion changes to manage timeout
watch(isExpanded, (newValue) => {
  if (newValue) {
    hasUnreadLogs.value = false
    resetCollapseTimeout()
  }
})

defineExpose({
  clearLogs,
  toggleExpanded,
  getLogCount: () => logs.value.length,
  getStats: () => stats.value,
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
}

.terminal-header:hover {
  background-color: var(--color-surfaceContainerHighest);
}

.terminal-content-wrapper {
  max-height: 384px; /* 96 * 4 = 384px para 4 líneas de 96px cada una */
  overflow: hidden;
}

.terminal-content {
  height: 100%;
  padding: 0.75rem;
  overflow-y: auto;
  scrollbar-width: thin;
  border-top: 1px solid var(--color-outlineVariant);
}

.terminal-content::-webkit-scrollbar {
  width: 6px;
}

.terminal-content::-webkit-scrollbar-track {
  background: var(--color-surfaceContainerHigh);
  border-radius: 3px;
}

.terminal-content::-webkit-scrollbar-thumb {
  background: var(--color-outlineVariant);
  border-radius: 3px;
}

.terminal-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-outline);
}

.terminal-line {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  padding: 0.1rem 0.25rem;
  border-radius: 0.25rem;
}

.terminal-line:hover {
  background-color: var(--color-surfaceContainerHigh);
}

.terminal-line:last-child {
  margin-bottom: 0;
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

/* Indicador de mensajes no leídos */
.terminal-header::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background-color: var(--color-primary);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.terminal-header:has(+ .has-unread)::after {
  opacity: 1;
}

/* Responsive design */
@media (max-width: 768px) {
  .terminal-content-wrapper {
    max-height: 256px;
  }

  .terminal-header {
    padding: 0.75rem;
  }

  .terminal-line {
    font-size: 0.7rem;
    gap: 0.3rem;
  }
}
</style>
