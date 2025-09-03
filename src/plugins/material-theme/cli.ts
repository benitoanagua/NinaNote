import { generateThemeFiles } from './theme-generator'

const root = process.cwd()
const outputDir = 'src/assets'

console.log('🔥 Nina Note - Generating Material Design theme...\n')
generateThemeFiles(root, outputDir)
