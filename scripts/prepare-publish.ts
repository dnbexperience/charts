import assert from 'node:assert/strict'
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const buildFiles = [
  'chart-js/index.d.ts',
  'chart-js/index.js',
  'chartist/index.d.ts',
  'chartist/index.js',
  'chartist/styles.css',
  'echarts/index.d.ts',
  'echarts/index.js',
  'nivo/index.d.ts',
  'nivo/index.js',
  'recharts/index.d.ts',
  'recharts/index.js',
  'theme.d.ts',
  'theme.js',
]

export async function preparePublish(source: string, artifact: string) {
  const manifest = JSON.parse(
    await readFile(path.join(source, 'package.json'), 'utf8')
  )
  assert.notEqual(
    manifest.private,
    true,
    'Chart publishing is disabled while the package is private'
  )
  assert.ok(
    (await lstat(artifact)).isDirectory(),
    'Expected a build directory'
  )
  const entries = await readdir(artifact, {
    recursive: true,
    withFileTypes: true,
  })
  assert.ok(
    entries.every((entry) => entry.isFile() || entry.isDirectory()),
    'Expected regular build files and directories'
  )
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path
        .relative(artifact, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join('/')
    )
    .sort()
  assert.deepEqual(files, buildFiles, 'Unexpected build contents')

  const destination = path.join(source, '.release')
  await rm(destination, { recursive: true, force: true })
  for (const file of buildFiles) {
    await mkdir(path.dirname(path.join(destination, 'dist', file)), {
      recursive: true,
    })
    await copyFile(
      path.join(artifact, file),
      path.join(destination, 'dist', file)
    )
  }
  for (const file of ['LICENSE', 'README.md', 'THIRD_PARTY_NOTICES.md']) {
    await copyFile(path.join(source, file), path.join(destination, file))
  }
  delete manifest.scripts
  delete manifest.devDependencies
  await writeFile(
    path.join(destination, 'package.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  )
}

if (process.argv[2]) {
  await preparePublish(
    fileURLToPath(new URL('../', import.meta.url)),
    path.resolve(process.argv[2])
  )
}
