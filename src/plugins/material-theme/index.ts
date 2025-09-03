import type { Plugin } from 'vite'
import { generateThemeFiles } from './theme-generator'
import type { MaterialThemeOptions } from './types'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Para compatibilidad con ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function materialTheme(options: MaterialThemeOptions = {}): Plugin {
  const { outputDir = 'src/assets/css' } = options
  let root: string

  return {
    name: 'vite-plugin-material-theme',

    configResolved(config) {
      root = config.root
    },

    async buildStart() {
      generateThemeFiles(root, outputDir)
    },

    configureServer(server) {
      // Regenerar tema cuando cambien los archivos de configuración
      const themeConfigPath = resolve(root, 'src/plugins/material-theme/theme-config.ts')
      server.watcher.add(themeConfigPath)

      server.watcher.on('change', (file) => {
        if (file.includes('theme-config.ts')) {
          console.log('🔄 Theme configuration changed, regenerating...')
          generateThemeFiles(root, outputDir)
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}
