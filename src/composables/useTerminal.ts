import { ref, computed, onMounted, onUnmounted, nextTick, readonly } from 'vue'
import { logger, type LogEntry, LogLevel } from '@/utils/logger'

interface TerminalOptions {
  maxVisibleLogs?: number
  maxTotalLogs?: number
  autoExpand?: boolean
  scrollStep?: number
}

export function useTerminal(options: TerminalOptions = {}) {
  // Configuración con valores por defecto
  const { maxVisibleLogs = 50, maxTotalLogs = 200, autoExpand = true, scrollStep = 100 } = options

  const allLogs = ref<(LogEntry & { id: number })[]>([])
  const startTime = ref<number>(Date.now())
  const currentTime = ref<string>('')
  const isExpanded = ref(autoExpand)
  const hasUnreadLogs = ref(false)
  const lastLogTimestamp = ref<number>(0)
  const logIdCounter = ref(0)
  const userHasScrolled = ref(false)
  const scrollPosition = ref(0)
  const showNeofetch = ref(true)
  const maxHistoryLines = ref(1000)
  const historyOffset = ref(0)

  // Referencias DOM
  const contentElement = ref<HTMLElement | null>(null)

  // Variables internas
  let removeListener: (() => void) | null = null
  let timeInterval: number | null = null

  const totalLogs = computed(() => allLogs.value.length)

  const visibleLogs = computed(() => {
    if (allLogs.value.length === 0) return []

    // Modo histórico (usuario ha hecho scroll)
    if (userHasScrolled.value && historyOffset.value > 0) {
      const start = Math.max(0, allLogs.value.length - maxHistoryLines.value - historyOffset.value)
      const end = Math.min(allLogs.value.length, start + maxVisibleLogs)
      return allLogs.value.slice(start, end)
    }

    // Modo normal: últimos logs
    return allLogs.value.slice(-maxVisibleLogs)
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

  const scrollToBottom = () => {
    nextTick(() => {
      if (contentElement.value) {
        contentElement.value.scrollTo({
          top: contentElement.value.scrollHeight,
          behavior: 'smooth',
        })
        userHasScrolled.value = false
        scrollPosition.value = contentElement.value.scrollHeight
      }
    })
  }

  const scrollUp = () => {
    if (contentElement.value) {
      contentElement.value.scrollBy({
        top: -scrollStep,
        behavior: 'smooth',
      })
      userHasScrolled.value = true
      updateScrollPosition()
    }
  }

  const scrollDown = () => {
    if (contentElement.value) {
      contentElement.value.scrollBy({
        top: scrollStep,
        behavior: 'smooth',
      })
      updateScrollPosition()
      checkIfAtBottom()
    }
  }

  const scrollToTop = () => {
    if (contentElement.value) {
      contentElement.value.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
      userHasScrolled.value = true
      scrollPosition.value = 0
    }
  }

  const scrollToHistory = (lines: number) => {
    historyOffset.value = Math.max(0, Math.min(allLogs.value.length - maxVisibleLogs, lines))
    userHasScrolled.value = historyOffset.value > 0

    if (contentElement.value) {
      contentElement.value.scrollTop = 0 // Ir al inicio del viewport histórico
    }
  }

  const scrollToRecent = () => {
    historyOffset.value = 0
    userHasScrolled.value = false
    scrollToBottom()
  }

  const updateScrollPosition = () => {
    if (contentElement.value) {
      scrollPosition.value = contentElement.value.scrollTop
    }
  }

  const checkIfAtBottom = () => {
    if (contentElement.value) {
      const { scrollTop, scrollHeight, clientHeight } = contentElement.value
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
      userHasScrolled.value = !isAtBottom
    }
  }

  const handleScroll = (event: Event) => {
    if (!contentElement.value) return

    const { scrollTop, scrollHeight, clientHeight } = contentElement.value
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50

    userHasScrolled.value = !isAtBottom
    scrollPosition.value = scrollTop

    // Si el usuario hace scroll manual, entrar en modo histórico
    if (userHasScrolled.value && historyOffset.value === 0) {
      historyOffset.value = Math.max(0, allLogs.value.length - maxVisibleLogs)
    }
  }

  const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
    if (isExpanded.value) {
      hasUnreadLogs.value = false
      nextTick(() => scrollToBottom())
    }
  }

  const clearLogs = () => {
    allLogs.value = []
    logIdCounter.value = 0
    startTime.value = Date.now()
    hasUnreadLogs.value = false
    showNeofetch.value = true
    logger.info('Terminal buffer cleared', { context: 'Terminal' })
  }

  const hideNeofetch = () => {
    showNeofetch.value = false
  }

  const showNeofetchBanner = () => {
    showNeofetch.value = true
  }

  const handleNewLog = (logEntry: LogEntry) => {
    const logWithId = { ...logEntry, id: logIdCounter.value++ }

    allLogs.value.push(logWithId)
    lastLogTimestamp.value = Date.now()

    // Si hay nuevos logs, resetear la navegación histórica
    if (userHasScrolled.value) {
      historyOffset.value = 0
      userHasScrolled.value = false
    }

    // Mantener buffer total controlado
    if (allLogs.value.length > maxTotalLogs) {
      allLogs.value = allLogs.value.slice(-maxTotalLogs)
    }

    // Auto-scroll inteligente
    if (isExpanded.value && !userHasScrolled.value) {
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
          `[${formatTime(log.timestamp)}] ${log.context}: ${log.message}${
            log.data ? ` - ${formatData(log.data)}` : ''
          }`,
      )
      .join('\n')
  }

  const updateTime = () => {
    currentTime.value = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const initialize = () => {
    updateTime()
    timeInterval = window.setInterval(updateTime, 1000)
    removeListener = logger.addListener(handleNewLog)

    logger.info('Terminal initialized with enhanced features', {
      context: 'Terminal',
      data: {
        maxVisible: maxVisibleLogs,
        maxTotal: maxTotalLogs,
        scrollStep,
        autoExpand,
      },
    })

    // Agregar logs iniciales
    addLog('Terminal system ready', LogLevel.INFO, 'System')
    addLog('Type "help" for available commands', LogLevel.INFO, 'System')
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
    showNeofetch,
    userHasScrolled,
    scrollPosition,
    historyOffset,

    // Referencias DOM
    contentElement,

    // Métodos de utilidad
    formatTime,
    formatData,
    getLogClass,

    // Métodos de control
    toggleExpanded,
    scrollToBottom,
    scrollUp,
    scrollDown,
    scrollToTop,
    scrollToHistory,
    scrollToRecent,
    clearLogs,
    hideNeofetch,
    showNeofetchBanner,
    handleScroll,

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
