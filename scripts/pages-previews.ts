import { execFile } from 'node:child_process'
import { cp, lstat, mkdtemp, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'

const exec = promisify(execFile)
const artifactName = 'gallery-pages'

export interface PullRequest {
  number: number
  head: { sha: string; repo: { full_name: string } | null }
}

export interface PreviewRun {
  id: number
  head_sha: string
  event: string
  conclusion: string | null
  head_repository: { full_name: string }
}

export interface Preview {
  number: number
  sha: string
  runId: number
}

export function selectPreview(
  repository: string,
  pullRequest: PullRequest,
  runs: PreviewRun[]
): Preview | undefined {
  if (pullRequest.head.repo?.full_name !== repository) {
    return
  }
  const run = runs.find(
    (run) =>
      run.head_sha === pullRequest.head.sha &&
      run.head_repository.full_name === repository &&
      run.event === 'pull_request' &&
      run.conclusion === 'success'
  )
  if (run) {
    return {
      number: pullRequest.number,
      sha: pullRequest.head.sha,
      runId: run.id,
    }
  }
}

async function validateFiles(directory: string): Promise<void> {
  for (const name of await readdir(directory)) {
    const file = path.join(directory, name)
    const stat = await lstat(file)
    if (name.startsWith('.') || (!stat.isFile() && !stat.isDirectory())) {
      throw new Error(
        'Preview artifacts must contain regular static files'
      )
    }
    if (stat.isDirectory()) {
      await validateFiles(file)
    }
  }
}

export async function assemblePreviews(
  directory: string,
  previews: Preview[],
  download: (preview: Preview, destination: string) => Promise<void>
): Promise<void> {
  const previewDirectory = path.join(directory, 'previews')
  await rm(previewDirectory, { recursive: true, force: true })
  for (const preview of previews) {
    if (!Number.isSafeInteger(preview.number) || preview.number < 1) {
      throw new Error('Invalid preview pull request number')
    }
    const temporaryDirectory = await mkdtemp(
      path.join(os.tmpdir(), 'gallery-')
    )
    try {
      await download(preview, temporaryDirectory)
      await validateFiles(temporaryDirectory)
      if (
        !(
          await lstat(path.join(temporaryDirectory, 'index.html'))
        ).isFile()
      ) {
        throw new Error('Preview artifact has no index.html')
      }
      await cp(
        temporaryDirectory,
        path.join(previewDirectory, `pr-${preview.number}`),
        {
          recursive: true,
        }
      )
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true })
    }
  }
}

async function gh<T>(args: string[], body?: unknown): Promise<T> {
  const command = exec('gh', args, { maxBuffer: 10 * 1024 * 1024 })
  if (body !== undefined) {
    command.child.stdin?.end(JSON.stringify(body))
  }
  const { stdout } = await command
  return JSON.parse(stdout) as T
}

async function api<T>(endpoint: string, body?: unknown): Promise<T> {
  return gh<T>(
    [
      'api',
      endpoint,
      ...(body === undefined ? [] : ['--method', 'POST', '--input', '-']),
    ],
    body
  )
}

async function list<T>(endpoint: string): Promise<T[]> {
  return (
    await gh<T[][]>(['api', endpoint, '--paginate', '--slurp'])
  ).flat()
}

export interface GitHub {
  request<T>(endpoint: string, body?: unknown): Promise<T>
  list<T>(endpoint: string): Promise<T[]>
}

const githubApi: GitHub = { request: api, list }

export async function collectPreviews(
  repository: string,
  github: GitHub = githubApi
): Promise<Preview[]> {
  const previews: Preview[] = []
  const pullRequests = await github.list<PullRequest>(
    `repos/${repository}/pulls?state=open&per_page=100`
  )
  for (const pullRequest of pullRequests) {
    if (pullRequest.head.repo?.full_name !== repository) {
      continue
    }
    const { workflow_runs: runs } = await github.request<{
      workflow_runs: PreviewRun[]
    }>(
      `repos/${repository}/actions/workflows/ci.yml/runs?event=pull_request&status=success&head_sha=${pullRequest.head.sha}&per_page=10`
    )
    const preview = selectPreview(repository, pullRequest, runs)
    if (!preview) {
      continue
    }
    const { artifacts } = await github.request<{
      artifacts: { name: string; expired: boolean }[]
    }>(
      `repos/${repository}/actions/runs/${preview.runId}/artifacts?per_page=100`
    )
    if (
      artifacts.some(
        (artifact) => artifact.name === artifactName && !artifact.expired
      )
    ) {
      previews.push(preview)
    }
  }
  return previews
}

export async function reportPreviews(
  repository: string,
  previews: Preview[],
  baseUrl: string | undefined,
  github: GitHub = githubApi
): Promise<void> {
  if (!baseUrl || new URL(baseUrl).protocol !== 'https:') {
    throw new Error('PAGES_URL must be an HTTPS URL')
  }
  const deployments = await github.list<{
    id: number
    environment: string
  }>(`repos/${repository}/deployments?per_page=100`)
  for (const preview of previews) {
    const { id } = await github.request<{ id: number }>(
      `repos/${repository}/deployments`,
      {
        ref: preview.sha,
        environment: `preview-pr-${preview.number}`,
        auto_merge: false,
        required_contexts: [],
        transient_environment: true,
        production_environment: false,
        description: `Gallery preview for PR #${preview.number}`,
      }
    )
    await github.request(
      `repos/${repository}/deployments/${id}/statuses`,
      {
        state: 'success',
        environment_url: new URL(
          `previews/pr-${preview.number}/`,
          `${baseUrl.replace(/\/$/, '')}/`
        ).href,
        auto_inactive: true,
      }
    )
  }
  for (const deployment of deployments) {
    if (/^preview-pr-\d+$/.test(deployment.environment)) {
      const statuses = await github.request<{ state: string }[]>(
        `repos/${repository}/deployments/${deployment.id}/statuses?per_page=1`
      )
      if (statuses[0]?.state === 'success') {
        await github.request(
          `repos/${repository}/deployments/${deployment.id}/statuses`,
          {
            state: 'inactive',
          }
        )
      }
    }
  }
}

async function main(): Promise<void> {
  const repository = process.env.GITHUB_REPOSITORY
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY is required')
  }
  if (process.argv[2] === 'report') {
    await reportPreviews(
      repository,
      JSON.parse(process.env.PREVIEWS ?? '[]') as Preview[],
      process.env.PAGES_URL
    )
    return
  }
  const previews = await collectPreviews(repository)
  await assemblePreviews(
    '.pages',
    previews,
    async (preview, destination) => {
      await exec('gh', [
        'run',
        'download',
        String(preview.runId),
        '--repo',
        repository,
        '--name',
        artifactName,
        '--dir',
        destination,
      ])
    }
  )
  console.log(JSON.stringify(previews))
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main()
}
