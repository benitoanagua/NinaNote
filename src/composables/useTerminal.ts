import { ref, computed, onMounted, onUnmounted, nextTick, readonly } from 'vue'
import { logger, type LogEntry, LogLevel } from '@/utils/logger'

interface TerminalOptions {
  maxVisibleLogs?: number
  maxTotalLogs?: number
  autoExpand?: boolean
}

export function useTerminal(options: TerminalOptions = {}) {
  const { maxVisibleLogs = 15, maxTotalLogs = 60, autoExpand = true } = options

  // Estado reactivo
  const allLogs = ref<(LogEntry & { id: number })[]>([])
  const startTime = ref<number>(Date.now())
  const currentTime = ref<string>('')
  const isExpanded = ref(true)
  const hasUnreadLogs = ref(false)
  const lastLogTimestamp = ref<number>(0)
  const logIdCounter = ref(0)

  // Referencias DOM
  const contentWrapper = ref<HTMLElement | null>(null)
  const contentElement = ref<HTMLElement | null>(null)

  // Variables internas
  let removeListener: (() => void) | null = null
  let timeInterval: number | null = null

  // Computadas
  const totalLogs = computed(() => allLogs.value.length)

  const visibleLogs = computed(() => {
    const logs = allLogs.value
    if (logs.length <= maxVisibleLogs) {
      return logs
    }
    return logs.slice(-maxVisibleLogs)
  })

  const statusMessage = computed(() => {
    if (allLogs.value.length === 0) return 'System Terminal - Ready'
    const lastLog = allLogs.value[allLogs.value.length - 1]
    return `${lastLog.context}: ${lastLog.message}`
  })

  const stats = computed(() => {
    const totalTime = ((Date.now() - startTime.value) / 1000).toFixed(1)
    const logs = allLogs.value
    const infoCount = logs.filter((log) => log.level === LogLevel.INFO).length
    const successCount = logs.filter((log) => log.level === LogLevel.SUCCESS).length
    const warningCount = logs.filter((log) => log.level === LogLevel.WARN).length
    const errorCount = logs.filter((log) => log.level === LogLevel.ERROR).length

    return {
      infoCount,
      successCount,
      warningCount,
      errorCount,
      timeElapsed: totalTime,
    }
  })

  const terminalStyle = computed(() => ({
    backgroundColor: 'var(--color-surfaceContainerHighest)',
    color: 'var(--color-onSurfaceVariant)',
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    fontSize: '0.75rem',
    lineHeight: '1.25',
  }))

  // Métodos de utilidad
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
        if (data.contentLength) return `${data.contentLength}c`
        if (data.tweetCount) return `${data.tweetCount}t`
        if (data.imageCount) return `${data.imageCount}i`
        if (data.url) return `${data.url.substring(0, 15)}...`
        if (data.error) return `err: ${data.error.message || 'Unknown'}`

        const str = JSON.stringify(data)
        return str.length > 20 ? str.substring(0, 17) + '...' : str
      } catch {
        return 'data'
      }
    }
    const str = String(data)
    return str.length > 20 ? str.substring(0, 17) + '...' : str
  }

  const getLogClass = (log: LogEntry) => {
    const baseClasses = 'text-sm truncate'
    const levelClasses = {
      [LogLevel.INFO]: 'text-onSurfaceVariant',
      [LogLevel.SUCCESS]: 'text-primary font-medium',
      [LogLevel.WARN]: 'text-yellow-500',
      [LogLevel.ERROR]: 'text-error font-medium',
      [LogLevel.DEBUG]: 'text-onSurfaceVariant/60',
    }
    return `${baseClasses} ${levelClasses[log.level] || 'text-onSurfaceVariant'}`
  }

  // Métodos de scroll
  const scrollToBottom = () => {
    nextTick(() => {
      if (contentElement.value) {
        contentElement.value.scrollTo({
          top: contentElement.value.scrollHeight,
          behavior: 'smooth',
        })
      }
    })
  }

  const shouldAutoScroll = () => {
    const element = contentElement.value
    if (!element) return true
    return element.scrollHeight - element.scrollTop - element.clientHeight < 50
  }

  // Métodos de control
  const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
    if (isExpanded.value) {
      hasUnreadLogs.value = false
      scrollToBottom()
    }
  }

  const clearLogs = () => {
    allLogs.value = []
    logIdCounter.value = 0
    startTime.value = Date.now()
    hasUnreadLogs.value = false
    logger.info('Terminal buffer cleared', { context: 'Terminal' })
  }

  const expand = () => {
    if (!isExpanded.value) {
      isExpanded.value = true
      hasUnreadLogs.value = false
      scrollToBottom()
    }
  }

  const collapse = () => {
    isExpanded.value = false
  }

  // Manejo de logs
  const handleNewLog = (logEntry: LogEntry) => {
    const logWithId = { ...logEntry, id: logIdCounter.value++ }

    allLogs.value.push(logWithId)
    lastLogTimestamp.value = Date.now()

    // Mantener buffer total controlado
    if (allLogs.value.length > maxTotalLogs) {
      allLogs.value = allLogs.value.slice(-maxTotalLogs)
    }

    // Auto-expandir si está configurado
    if (autoExpand && !isExpanded.value) {
      isExpanded.value = true
      hasUnreadLogs.value = false
    } else if (!isExpanded.value) {
      hasUnreadLogs.value = true
    }

    // Auto-scroll inteligente
    if (isExpanded.value && shouldAutoScroll()) {
      scrollToBottom()
    }
  }

  const addLog = (
    message: string,
    level: LogLevel = LogLevel.INFO,
    context: string = 'Terminal',
    data?: any,
  ) => {
    const logEntry: LogEntry = {
      message,
      level,
      context,
      timestamp: Date.now(),
      data,
    }
    handleNewLog(logEntry)
  }

  // Tiempo actual
  const updateTime = () => {
    currentTime.value = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // Lifecycle
  const initialize = () => {
    updateTime()
    timeInterval = window.setInterval(updateTime, 1000)
    removeListener = logger.addListener(handleNewLog)

    logger.info('Terminal initialized with buffer limit', {
      context: 'Terminal',
      data: {
        maxVisible: maxVisibleLogs,
        maxTotal: maxTotalLogs,
        autoExpand,
      },
    })

    scrollToBottom()
  }

  const cleanup = () => {
    if (timeInterval) {
      clearInterval(timeInterval)
    }
    if (removeListener) {
      removeListener()
    }
  }

  // Auto-inicializar en mount
  onMounted(() => {
    initialize()
  })

  onUnmounted(() => {
    cleanup()
  })

  // Métodos públicos avanzados
  const getLogs = (count?: number) => {
    if (count) {
      return allLogs.value.slice(-count)
    }
    return [...allLogs.value]
  }

  const getLogsByLevel = (level: LogLevel) => {
    return allLogs.value.filter((log) => log.level === level)
  }

  const getLogsByContext = (context: string) => {
    return allLogs.value.filter((log) => log.context === context)
  }

  const exportLogs = (format: 'json' | 'text' = 'text') => {
    if (format === 'json') {
      return JSON.stringify(allLogs.value, null, 2)
    }

    return allLogs.value
      .map(
        (log) =>
          `[${formatTime(log.timestamp)}] ${log.context}: ${log.message}${log.data ? ` - ${formatData(log.data)}` : ''}`,
      )
      .join('\n')
  }

  // Retornar API del composable
  return {
    // Estado reactivo
    allLogs: readonly(allLogs),
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
    expand,
    collapse,
    clearLogs,
    scrollToBottom,

    // Métodos de logs
    addLog,
    getLogs,
    getLogsByLevel,
    getLogsByContext,
    exportLogs,

    // Lifecycle
    initialize,
    cleanup,
  }
}

// Composable específico para readonly access
export function useTerminalReader() {
  const terminal = useTerminal({ autoExpand: false })

  return {
    totalLogs: terminal.totalLogs,
    visibleLogs: terminal.visibleLogs,
    statusMessage: terminal.statusMessage,
    stats: terminal.stats,
    isExpanded: terminal.isExpanded,
    hasUnreadLogs: terminal.hasUnreadLogs,
    getLogs: terminal.getLogs,
    getLogsByLevel: terminal.getLogsByLevel,
    getLogsByContext: terminal.getLogsByContext,
    exportLogs: terminal.exportLogs,
  }
}
