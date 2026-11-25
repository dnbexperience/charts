import path from 'node:path'
import react from '@vitejs/plugin-react'
import { eufemiaCssOptimizer } from '@dnb/eufemia/style/vite-plugin.js'
import { defineConfig } from 'vite'

const root = import.meta.dirname
const themeFile = process.env.CHARTS_THEME_FILE

export default defineConfig({
  base: './',
  root: path.join(root, 'site'),
  plugins: [
    react(),
    eufemiaCssOptimizer({
      components: undefined,
      extensions: ['ts', 'tsx'],
      sources: [path.join(root, 'site')],
    }),
    {
      name: 'charts-preview-theme',
      resolveId(id) {
        if (id === 'virtual:charts-preview-theme') {
          return '\0' + id
        }
      },
      load(id) {
        if (id === '\0virtual:charts-preview-theme') {
          return themeFile
            ? `import ${JSON.stringify(path.resolve(themeFile))};`
            : ''
        }
      },
    },
  ],
  build: { emptyOutDir: true, outDir: path.join(root, '.pages') },
})
