import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import config from '../release.config.mjs'

const require = createRequire(import.meta.url)
const cli = path.join(
  path.dirname(require.resolve('semantic-release')),
  'bin/semantic-release.js'
)
const temporary = await mkdtemp(path.join(tmpdir(), 'charts-release-'))
const chartPlugins = config.plugins.map((entry) => {
  const [name, options] = Array.isArray(entry) ? entry : [entry]
  return [
    (name as string).startsWith('.')
      ? fileURLToPath(new URL('../' + name, import.meta.url))
      : require.resolve(name as string),
    options ?? {},
  ]
})
const cases = [
  {
    name: 'first',
    messages: ['feat: chart feature'],
    version: '1.0.0',
    initial: false,
  },
  {
    name: 'no-release',
    messages: ['chore: update gallery'],
    version: null,
  },
  { name: 'patch', messages: ['fix: chart fix'], version: '1.2.4' },
  { name: 'minor', messages: ['feat: chart feature'], version: '1.3.0' },
  { name: 'breaking', messages: ['feat!: chart break'], version: '2.0.0' },
  {
    name: 'breaking-footer',
    messages: ['fix: chart break\n\nBREAKING CHANGE: chart API'],
    version: '2.0.0',
  },
  {
    name: 'revert',
    messages: [],
    reverted: 'feat: chart feature',
    released: true,
    version: '1.2.4',
    note: 'chart feature',
  },
  {
    name: 'revert-unreleased',
    messages: [],
    reverted: 'feat: chart feature',
    released: false,
    version: null,
  },
]

try {
  for (const scenario of cases) {
    const cwd = path.join(temporary, scenario.name)
    const remote = path.join(temporary, scenario.name + '.git')
    await mkdir(cwd)
    const git = (...args: string[]) =>
      execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim()
    git('init', '--bare', '--initial-branch=main', remote)
    git('init', '--initial-branch=main')
    git('config', 'user.name', 'Release check')
    git('config', 'user.email', 'release-check@example.com')
    git('config', 'commit.gpgsign', 'false')
    git('config', 'tag.gpgsign', 'false')
    const tagFormat = config.tagFormat
    await writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify({
        name: 'charts-release-check',
        version: '1.2.3',
        release: {
          ...config,
          tagFormat,
          plugins: chartPlugins,
          repositoryUrl: pathToFileURL(remote).href,
        },
      })
    )
    git('add', 'package.json')
    git('commit', '-m', 'chore: initial commit')
    if (scenario.reverted && scenario.released) {
      git('commit', '--allow-empty', '-m', scenario.reverted)
    }
    if (scenario.initial !== false) {
      git('tag', tagFormat.replace('$' + '{version}', '1.2.3'))
    }
    git('tag', 'other-v99.0.0')
    if (scenario.reverted) {
      if (!scenario.released) {
        git('commit', '--allow-empty', '-m', scenario.reverted)
      }
      git(
        'commit',
        '--allow-empty',
        '-m',
        `Revert "${scenario.reverted}"\n\nThis reverts commit ${git('rev-parse', 'HEAD')}.`
      )
    }
    for (const message of scenario.messages) {
      git('commit', '--allow-empty', '-m', message)
    }
    git('remote', 'add', 'origin', remote)
    git('push', 'origin', 'main', '--tags')
    const tags = git('tag', '--list')
    const output = execFileSync(
      process.execPath,
      [cli, '--dry-run', '--no-ci', '--verify-conditions', 'false'],
      {
        cwd,
        env: { PATH: process.env.PATH, HOME: temporary },
        encoding: 'utf8',
        stdio: 'pipe',
      }
    )
    if (scenario.version) {
      assert.ok(
        output
          .toLowerCase()
          .includes('next release version is ' + scenario.version),
        output
      )
      const marker = output.indexOf('Release note for version')
      assert.ok(marker >= 0, output)
      const notes = output.slice(marker)
      assert.ok(
        notes.includes(
          scenario.note ??
            scenario.messages[0].split(': ')[1].split('\n')[0]
        ),
        notes
      )
    } else {
      assert.match(output, /There are no relevant changes/, output)
    }
    assert.equal(git('tag', '--list'), tags)
    assert.equal(git('status', '--porcelain'), '')
    console.log('Verified release scenario: ' + scenario.name)
  }
  assert.equal(config.branches.join(','), 'main')
  assert.equal(
    config.repositoryUrl,
    'https://github.com/dnbexperience/charts.git'
  )
  console.log(
    'Verified independent release versions, tags and notes without publishing.'
  )
} finally {
  await rm(temporary, { recursive: true, force: true })
}
