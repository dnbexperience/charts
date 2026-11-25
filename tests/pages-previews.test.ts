import assert from 'node:assert/strict'
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import {
  assemblePreviews,
  collectPreviews,
  reportPreviews,
  selectPreview,
  type GitHub,
  type PreviewRun,
  type PullRequest,
} from '../scripts/pages-previews.ts'

const repository = 'dnbexperience/charts'
const pullRequest: PullRequest = {
  number: 44,
  head: { sha: 'current', repo: { full_name: repository } },
}
const run: PreviewRun = {
  id: 100,
  head_sha: 'current',
  event: 'pull_request',
  conclusion: 'success',
  head_repository: { full_name: repository },
}
const preview = { number: 44, sha: 'current', runId: 100 }

function mockGitHub(responses: Record<string, unknown>) {
  const calls: { endpoint: string; body?: unknown }[] = []
  function request<T>(endpoint: string, body?: unknown): Promise<T> {
    calls.push({ endpoint, body })
    assert.ok(Object.hasOwn(responses, endpoint), endpoint)
    return Promise.resolve(responses[endpoint] as T)
  }
  const github: GitHub = {
    request,
    list: <T>(endpoint: string) => request<T[]>(endpoint),
  }
  return { github, calls }
}

describe('Pages previews', () => {
  it('collects only open internal PRs with a current unexpired build', async () => {
    const { github, calls } = mockGitHub({
      [`repos/${repository}/pulls?state=open&per_page=100`]: [
        pullRequest,
        {
          ...pullRequest,
          number: 45,
          head: { ...pullRequest.head, sha: 'expired' },
        },
        {
          ...pullRequest,
          number: 46,
          head: { ...pullRequest.head, sha: 'unbuilt' },
        },
        {
          ...pullRequest,
          number: 47,
          head: { ...pullRequest.head, repo: null },
        },
      ],
      [`repos/${repository}/actions/workflows/ci.yml/runs?event=pull_request&status=success&head_sha=current&per_page=10`]:
        { workflow_runs: [run] },
      [`repos/${repository}/actions/workflows/ci.yml/runs?event=pull_request&status=success&head_sha=expired&per_page=10`]:
        { workflow_runs: [{ ...run, id: 101, head_sha: 'expired' }] },
      [`repos/${repository}/actions/workflows/ci.yml/runs?event=pull_request&status=success&head_sha=unbuilt&per_page=10`]:
        { workflow_runs: [] },
      [`repos/${repository}/actions/runs/100/artifacts?per_page=100`]: {
        artifacts: [{ name: 'gallery-pages', expired: false }],
      },
      [`repos/${repository}/actions/runs/101/artifacts?per_page=100`]: {
        artifacts: [{ name: 'gallery-pages', expired: true }],
      },
    })
    assert.deepEqual(await collectPreviews(repository, github), [preview])
    assert.equal(calls.length, 6)
  })

  it('publishes a preview link and inactivates superseded and closed deployments', async () => {
    const deployments = `repos/${repository}/deployments`
    const { github, calls } = mockGitHub({
      [`${deployments}?per_page=100`]: [
        { id: 1, environment: 'github-pages' },
        { id: 2, environment: 'preview-pr-43' },
        { id: 3, environment: 'preview-pr-44' },
        { id: 4, environment: 'preview-pr-42' },
      ],
      [deployments]: { id: 5 },
      [`${deployments}/5/statuses`]: {},
      [`${deployments}/2/statuses?per_page=1`]: [{ state: 'success' }],
      [`${deployments}/3/statuses?per_page=1`]: [{ state: 'success' }],
      [`${deployments}/4/statuses?per_page=1`]: [{ state: 'inactive' }],
      [`${deployments}/2/statuses`]: {},
      [`${deployments}/3/statuses`]: {},
    })
    await reportPreviews(
      repository,
      [preview],
      'https://gallery.example/',
      github
    )
    assert.deepEqual(
      calls.find((call) => call.endpoint === deployments)?.body,
      {
        ref: 'current',
        environment: 'preview-pr-44',
        auto_merge: false,
        required_contexts: [],
        transient_environment: true,
        production_environment: false,
        description: 'Gallery preview for PR #44',
      }
    )
    assert.deepEqual(
      calls.find((call) => call.endpoint === `${deployments}/5/statuses`)
        ?.body,
      {
        state: 'success',
        environment_url: 'https://gallery.example/previews/pr-44/',
        auto_inactive: true,
      }
    )
    assert.deepEqual(
      calls.filter(
        (call) =>
          call.endpoint.endsWith('/statuses') &&
          call.endpoint !== `${deployments}/5/statuses`
      ),
      [
        {
          endpoint: `${deployments}/2/statuses`,
          body: { state: 'inactive' },
        },
        {
          endpoint: `${deployments}/3/statuses`,
          body: { state: 'inactive' },
        },
      ]
    )
  })

  it('removes every preview deployment when no previews remain', async () => {
    const deployments = `repos/${repository}/deployments`
    const { github, calls } = mockGitHub({
      [`${deployments}?per_page=100`]: [
        { id: 1, environment: 'preview-pr-44' },
      ],
      [`${deployments}/1/statuses?per_page=1`]: [{ state: 'success' }],
      [`${deployments}/1/statuses`]: {},
    })
    await reportPreviews(
      repository,
      [],
      'https://gallery.example/',
      github
    )
    assert.deepEqual(calls.at(-1), {
      endpoint: `${deployments}/1/statuses`,
      body: { state: 'inactive' },
    })
    await assert.rejects(
      reportPreviews(repository, [], 'http://gallery.example/', github),
      /HTTPS URL/
    )
  })

  it('uses only a successful PR build for the current internal revision', () => {
    assert.deepEqual(
      selectPreview(repository, pullRequest, [run]),
      preview
    )
    for (const invalid of [
      { ...run, head_sha: 'old' },
      { ...run, conclusion: 'failure' },
      { ...run, event: 'push' },
      { ...run, head_repository: { full_name: 'other/logos' } },
    ]) {
      assert.equal(
        selectPreview(repository, pullRequest, [invalid]),
        undefined
      )
    }
    for (const repo of [null, { full_name: 'other/logos' }]) {
      assert.equal(
        selectPreview(
          repository,
          { ...pullRequest, head: { ...pullRequest.head, repo } },
          [run]
        ),
        undefined
      )
    }
  })

  it('preserves production, replaces previews, and removes closed PRs', async (context) => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'gallery-test-')
    )
    context.after(() => rm(directory, { recursive: true, force: true }))
    await mkdir(path.join(directory, 'previews/pr-43'), {
      recursive: true,
    })
    await mkdir(path.join(directory, 'assets'))
    await writeFile(path.join(directory, 'index.html'), 'production')
    await writeFile(
      path.join(directory, 'assets/main.js'),
      'production script'
    )
    await assemblePreviews(
      directory,
      [preview],
      async (selected, destination) => {
        assert.deepEqual(selected, preview)
        await mkdir(path.join(destination, 'assets'))
        await writeFile(
          path.join(destination, 'index.html'),
          '<script src="./assets/main.js"></script>'
        )
        await writeFile(
          path.join(destination, 'assets/main.js'),
          'preview script'
        )
      }
    )
    assert.deepEqual(await readdir(path.join(directory, 'previews')), [
      'pr-44',
    ])
    assert.equal(
      await readFile(path.join(directory, 'index.html'), 'utf8'),
      'production'
    )
    assert.equal(
      await readFile(path.join(directory, 'assets/main.js'), 'utf8'),
      'production script'
    )
    assert.equal(
      await readFile(
        path.join(directory, 'previews/pr-44/assets/main.js'),
        'utf8'
      ),
      'preview script'
    )
    await assemblePreviews(directory, [], () =>
      assert.fail('No preview expected')
    )
    await assert.rejects(access(path.join(directory, 'previews')))
    await access(path.join(directory, 'index.html'))
  })

  it('stops deployment for missing or unsafe artifacts', async (context) => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'gallery-test-')
    )
    context.after(() => rm(directory, { recursive: true, force: true }))
    await assert.rejects(
      assemblePreviews(directory, [preview], () =>
        Promise.reject(new Error('Download failed'))
      ),
      /Download failed/
    )
    await assert.rejects(
      assemblePreviews(directory, [preview], () => Promise.resolve()),
      /ENOENT/
    )
    await assert.rejects(
      assemblePreviews(directory, [preview], async (_, destination) => {
        await writeFile(path.join(destination, '.env'), 'hidden')
      }),
      /regular static files/
    )
    await assert.rejects(
      assemblePreviews(directory, [preview], async (_, destination) => {
        await symlink(directory, path.join(destination, 'assets'))
      }),
      /regular static files/
    )
    await assert.rejects(
      assemblePreviews(directory, [{ ...preview, number: -1 }], () =>
        Promise.resolve()
      ),
      /Invalid preview/
    )
  })
})
