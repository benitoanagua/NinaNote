import { writeFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import {
  argbFromHex,
  hexFromArgb,
  MaterialDynamicColors,
  Hct,
  SchemeTonalSpot,
  SchemeNeutral,
  SchemeVibrant,
  SchemeExpressive,
  SchemeMonochrome,
  SchemeContent,
  SchemeFidelity,
} from '@material/material-color-utilities'
import { themeConfig, getVariantName } from './theme-config'

export function getThemeConfig() {
  return themeConfig
}

// Mapeo de nombres de variante a constructores de esquema
const SCHEME_CONSTRUCTORS: Record<string, any> = {
  MONOCHROME: SchemeMonochrome,
  NEUTRAL: SchemeNeutral,
  TONAL_SPOT: SchemeTonalSpot,
  VIBRANT: SchemeVibrant,
  EXPRESSIVE: SchemeExpressive,
  FIDELITY: SchemeFidelity,
  CONTENT: SchemeContent,
}

function createScheme(isDark: boolean) {
  const config = getThemeConfig()
  const sourceColor = argbFromHex(config.seedColor)
  const sourceHct = Hct.fromInt(sourceColor)

  // Convertir número de variante a nombre
  const variantName = getVariantName(config.variant)
  const SchemeConstructor = SCHEME_CONSTRUCTORS[variantName] || SchemeTonalSpot

  return new SchemeConstructor(sourceHct, isDark, config.contrastLevel)
}

function extractColors(scheme: any) {
  const props = [
    'primary',
    'onPrimary',
    'primaryContainer',
    'onPrimaryContainer',
    'secondary',
    'onSecondary',
    'secondaryContainer',
    'onSecondaryContainer',
    'tertiary',
    'onTertiary',
    'tertiaryContainer',
    'onTertiaryContainer',
    'error',
    'onError',
    'errorContainer',
    'onErrorContainer',
    'background',
    'onBackground',
    'surface',
    'surfaceDim',
    'surfaceBright',
    'surfaceContainerLowest',
    'surfaceContainerLow',
    'surfaceContainer',
    'surfaceContainerHigh',
    'surfaceContainerHighest',
    'onSurface',
    'surfaceVariant',
    'onSurfaceVariant',
    'outline',
    'outlineVariant',
    'shadow',
    'scrim',
    'inverseSurface',
    'inverseOnSurface',
    'inversePrimary',
  ]

  const colors: Record<string, string> = {}
  for (const prop of props) {
    try {
      const color = (MaterialDynamicColors as any)[prop]?.getArgb(scheme)
      colors[prop] = hexFromArgb(color)
    } catch {
      colors[prop] = '#FF00FF' // fallback
      console.warn(`Could not extract color property: ${prop}`)
    }
  }
  return colors
}

export function generateThemeFiles(root: string, outputDir: string): void {
  try {
    const config = getThemeConfig()
    const variantName = getVariantName(config.variant)

    console.log(`🎨 Generating Material Design theme:`)
    console.log(`   • Seed Color: ${config.seedColor}`)
    console.log(`   • Variant: ${variantName} (${config.variant})`)
    console.log(`   • Contrast Level: ${config.contrastLevel}`)

    const lightScheme = createScheme(false)
    const darkScheme = createScheme(true)

    const lightColors = extractColors(lightScheme)
    const darkColors = extractColors(darkScheme)

    const cssContent = `@theme {
${Object.entries(lightColors)
  .map(([k, v]) => `  --color-${k}: ${v};`)
  .join('\n')}
}

[data-theme="dark"] {
${Object.entries(darkColors)
  .map(([k, v]) => `  --color-${k}: ${v};`)
  .join('\n')}
}`

    // Crear directorio si no existe
    const fullPath = resolve(root, outputDir)
    mkdirSync(dirname(fullPath), { recursive: true })

    // Escribir archivo CSS
    writeFileSync(resolve(fullPath, 'material-theme.css'), cssContent)

    console.log('✅ Theme generated successfully at:', `${outputDir}/material-theme.css`)
  } catch (error) {
    console.error('❌ Error generating themes:', error)
    throw error
  }
}
