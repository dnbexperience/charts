import assert from 'node:assert/strict'
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { preparePublish, buildFiles } from '../scripts/prepare-publish.ts'

test('blocks preparing a private package', async () => {
  const source = await mkdtemp(path.join(tmpdir(), 'charts-private-'))
  try {
    await writeFile(
      path.join(source, 'package.json'),
      JSON.stringify({ private: true })
    )
    await assert.rejects(
      preparePublish(source, source),
      /publishing is disabled/
    )
  } finally {
    await rm(source, { recursive: true, force: true })
  }
})

test('prepares only validated build files with trusted metadata and no lifecycle scripts', async () => {
  const source = await mkdtemp(path.join(tmpdir(), 'charts-publish-'))
  const artifact = path.join(source, 'artifact')
  try {
    await mkdir(path.join(artifact, 'chartist'), { recursive: true })
    const manifest = {
      name: '@eufemia/charts',
      private: false,
      version: '0.0.0-development',
      publishConfig: { registry: 'https://registry.npmjs.org/' },
      scripts: { prepack: 'yarn build' },
      devDependencies: { chartist: '2.3.0' },
    }
    await writeFile(
      path.join(source, 'package.json'),
      JSON.stringify(manifest)
    )
    for (const file of [
      'LICENSE',
      'README.md',
      'THIRD_PARTY_NOTICES.md',
    ]) {
      await writeFile(path.join(source, file), 'Trusted source')
    }
    for (const file of buildFiles) {
      await mkdir(path.dirname(path.join(artifact, file)), {
        recursive: true,
      })
      await writeFile(path.join(artifact, file), 'Validated build')
    }
    await writeFile(path.join(artifact, 'package.json'), '{}')
    await assert.rejects(
      preparePublish(source, artifact),
      /Unexpected build contents/
    )
    await rm(path.join(artifact, 'package.json'))
    await symlink(
      path.join(source, 'package.json'),
      path.join(artifact, 'injected')
    )
    await assert.rejects(
      preparePublish(source, artifact),
      /regular build files/
    )
    await rm(path.join(artifact, 'injected'))
    await preparePublish(source, artifact)
    const { scripts, devDependencies, ...expected } = manifest
    const prepared = path.join(source, '.release')
    assert.deepEqual(
      JSON.parse(
        await readFile(path.join(prepared, 'package.json'), 'utf8')
      ),
      expected
    )
    assert.equal(
      await readFile(
        path.join(prepared, 'dist/chartist/index.js'),
        'utf8'
      ),
      'Validated build'
    )
    assert.equal(
      await readFile(path.join(prepared, 'LICENSE'), 'utf8'),
      'Trusted source'
    )
  } finally {
    await rm(source, { recursive: true, force: true })
  }
})
