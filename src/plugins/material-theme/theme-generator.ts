import {
  DynamicScheme,
  themeFromSourceColor,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { themeConfig, getVariantName } from './theme-config'

export function getThemeConfig() {
  return themeConfig
}

function getAllDynamicColors(scheme: DynamicScheme): Record<string, string> {
  const colors: Record<string, string> = {}

  const colorProperties = [
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
    'inverseSurface',
    'inverseOnSurface',
    'outline',
    'outlineVariant',
    'shadow',
    'scrim',
    'surfaceTint',
    'inversePrimary',
    'primaryFixed',
    'primaryFixedDim',
    'onPrimaryFixed',
    'onPrimaryFixedVariant',
    'secondaryFixed',
    'secondaryFixedDim',
    'onSecondaryFixed',
    'onSecondaryFixedVariant',
    'tertiaryFixed',
    'tertiaryFixedDim',
    'onTertiaryFixed',
    'onTertiaryFixedVariant',
  ]

  colorProperties.forEach((property) => {
    try {
      const colorValue = (scheme as any)[property]
      if (typeof colorValue === 'number') {
        colors[property] = hexFromArgb(colorValue)
      }
    } catch (error) {
      console.warn(`Could not get color property: ${property}`, error)
    }
  })

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

    const sourceColorArgb = argbFromHex(config.seedColor)
    const theme = themeFromSourceColor(sourceColorArgb)

    // Usar el número de variante directamente
    const options = {
      sourceColorArgb,
      variant: config.variant,
      contrastLevel: config.contrastLevel,
      primaryPalette: theme.palettes.primary,
      secondaryPalette: theme.palettes.secondary,
      tertiaryPalette: theme.palettes.tertiary,
      neutralPalette: theme.palettes.neutral,
      neutralVariantPalette: theme.palettes.neutralVariant,
    }

    const lightScheme = new DynamicScheme({ ...options, isDark: false })
    const darkScheme = new DynamicScheme({ ...options, isDark: true })

    const lightColors = getAllDynamicColors(lightScheme)
    const darkColors = getAllDynamicColors(darkScheme)

    // Generar SOLO CSS para Tailwind (sin JSON)
    const cssContent = `@theme {
${Object.entries(lightColors)
  .map(([key, value]) => `  --color-${key}: ${value};`)
  .join('\n')}
}

[data-theme="dark"] {
${Object.entries(darkColors)
  .map(([key, value]) => `  --color-${key}: ${value};`)
  .join('\n')}
}
`

    // Crear directorio si no existe
    const fullPath = resolve(root, outputDir)
    mkdirSync(dirname(fullPath), { recursive: true })

    // Escribir SOLO archivo CSS (sin JSON)
    writeFileSync(resolve(fullPath, 'material-theme.css'), cssContent)

    console.log('✅ Theme generated successfully at:', `${outputDir}/material-theme.css`)
  } catch (error) {
    console.error('❌ Error generating themes:', error)
    throw error
  }
}
