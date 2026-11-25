import { mkdir, writeFile } from 'node:fs/promises'
import { compile, NodePackageImporter } from 'sass'

const result = compile('src/chartist/styles.scss', {
  importers: [new NodePackageImporter()],
  style: 'compressed',
})
await mkdir('dist/chartist', { recursive: true })
await writeFile('dist/chartist/styles.css', result.css + '\n')
