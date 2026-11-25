import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  copyFile,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire, findPackageJSON } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { chromium } from '@playwright/test'
import { build } from 'esbuild'
import { preparePublish, buildFiles } from './prepare-publish.ts'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../', import.meta.url))
const temporary = await mkdtemp(path.join(tmpdir(), 'charts-package-'))
try {
  const source = path.join(temporary, 'source')
  await mkdir(source)
  const manifest = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8')
  )
  await writeFile(
    path.join(source, 'package.json'),
    JSON.stringify({ ...manifest, private: false })
  )
  for (const file of ['LICENSE', 'README.md', 'THIRD_PARTY_NOTICES.md']) {
    await copyFile(path.join(root, file), path.join(source, file))
  }
  await preparePublish(source, path.join(root, 'dist'))
  const [pack] = JSON.parse(
    execFileSync(
      'npm',
      [
        'pack',
        '--ignore-scripts',
        '--json',
        '--pack-destination',
        temporary,
      ],
      { cwd: path.join(source, '.release'), encoding: 'utf8' }
    )
  ) as {
    filename: string
    files: { path: string }[]
  }[]
  const paths = pack.files.map(({ path: file }) => file).sort()
  assert.deepEqual(
    paths,
    [
      'LICENSE',
      'README.md',
      'THIRD_PARTY_NOTICES.md',
      ...buildFiles.map((file) => 'dist/' + file),
      'package.json',
    ].sort()
  )
  const consumer = path.join(temporary, 'consumer')
  await mkdir(consumer)
  await writeFile(
    path.join(consumer, 'package.json'),
    JSON.stringify({
      private: true,
      type: 'module',
      dependencies: {
        '@eufemia/charts': 'file:' + path.join(temporary, pack.filename),
        '@dnb/eufemia': manifest.devDependencies['@dnb/eufemia'],
      },
    })
  )
  execFileSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
    ],
    {
      cwd: consumer,
      stdio: 'pipe',
    }
  )
  const installed = createRequire(path.join(consumer, 'package.json'))
  const { scripts, devDependencies, ...publishedManifest } = manifest
  assert.deepEqual(installed('@eufemia/charts/package.json'), {
    ...publishedManifest,
    private: false,
  })
  for (const peer of [
    'chartist',
    'recharts',
    'chart.js',
    '@nivo/line',
    'echarts',
  ]) {
    assert.throws(() => installed.resolve(peer), {
      code: 'MODULE_NOT_FOUND',
    })
  }
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      'import {createLineChartOptions} from "@eufemia/charts/chartist"; if(createLineChartOptions().lineSmooth !== false) process.exit(1);',
    ],
    { cwd: consumer, stdio: 'inherit' }
  )
  for (const integration of [
    'recharts',
    'chart-js',
    'nivo',
    'echarts',
    'theme',
  ]) {
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        'await import("@eufemia/charts/' + integration + '")',
      ],
      { cwd: consumer, stdio: 'inherit' }
    )
  }
  assert.throws(() => installed.resolve('@eufemia/charts'), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
  })
  // Use the installed, pinned peers without fetching another copy.
  for (const peer of [
    'chartist',
    'chart.js',
    'recharts',
    '@nivo/line',
    'echarts',
  ]) {
    const packageFile = findPackageJSON(peer, import.meta.url)
    assert.ok(packageFile, 'Installed peer has a package manifest')
    const directory = path.dirname(packageFile)
    const destination = path.join(consumer, 'node_modules', peer)
    await mkdir(path.dirname(destination), { recursive: true })
    await symlink(directory, destination, 'dir')
  }
  await writeFile(
    path.join(consumer, 'types.ts'),
    [
      'import { lineChart, type LineChartPresetOptions } from "chartist";',
      'import type { ChartOptions } from "chart.js";',
      'import type { LineSvgProps, LineSeries } from "@nivo/line";',
      'import type { EChartsCoreOption } from "echarts/core";',
      'import { createChartJsOptions } from "@eufemia/charts/chart-js";',
      'import { createRechartsConfig } from "@eufemia/charts/recharts";',
      'import { createNivoConfig } from "@eufemia/charts/nivo";',
      'import { createEChartsOptions } from "@eufemia/charts/echarts";',
      'import { readChartTheme } from "@eufemia/charts/theme";',
      'const theme = readChartTheme(document.body);',
      'const chartJs: ChartOptions<"line"> = createChartJsOptions(theme);',
      'const nivo: Partial<LineSvgProps<LineSeries>> = createNivoConfig(theme);',
      'const echarts: EChartsCoreOption = createEChartsOptions(theme);',
      'const recharts = createRechartsConfig(theme);',
      'import { createLineChartOptions } from "@eufemia/charts/chartist";',
      'const options: LineChartPresetOptions = createLineChartOptions({axisY: {labelInterpolationFnc: value => String(value)}});',
      'lineChart(document.createElement("div"), {series: [[1, null, 2]]}, options).destroy();',
    ].join('\n')
  )
  execFileSync(
    process.execPath,
    [
      path.join(
        path.dirname(require.resolve('typescript/package.json')),
        'bin/tsc'
      ),
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--module',
      'nodenext',
      '--target',
      'es2022',
      'types.ts',
    ],
    { cwd: consumer, stdio: 'inherit' }
  )
  const entry = path.join(consumer, 'entry.js')
  await writeFile(
    entry,
    [
      'import {lineChart} from "chartist";',
      'import {readChartTheme} from "@eufemia/charts/theme";',
      'globalThis.readChartTheme = readChartTheme;',
      'import {createLineChartOptions} from "@eufemia/charts/chartist";',
      'import "@eufemia/charts/chartist/styles.css";',
      'globalThis.chart = lineChart("#chart", {labels:["Jan","Feb","Mar","Apr","May"],series:[[1,2,null,4,5]]}, createLineChartOptions({height:240}));',
    ].join('\n')
  )
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    metafile: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    outfile: path.join(consumer, 'bundle.js'),
  })
  const js = result.outputFiles.find(({ path: file }) =>
    file.endsWith('.js')
  )
  const css = result.outputFiles.find(({ path: file }) =>
    file.endsWith('.css')
  )
  assert.ok(js, 'The chart must produce JavaScript')
  assert.ok(css, 'A side-effect CSS import must be retained')
  assert.ok(
    !Object.keys(result.metafile.inputs).some((file) =>
      /node_modules\/(react|react-dom|@dnb\/eufemia)\//.test(file)
    ),
    'No React or Eufemia runtime'
  )
  const analysis = await build({
    entryPoints: [entry],
    bundle: true,
    minify: false,
    write: false,
    format: 'esm',
    platform: 'browser',
    outfile: path.join(consumer, 'analysis.js'),
  })
  const analysisJs = analysis.outputFiles.find(({ path: file }) =>
    file.endsWith('.js')
  )
  assert.ok(analysisJs, 'The analysis build must produce JavaScript')
  assert.doesNotMatch(
    analysisJs.text,
    /function (barChart|pieChart|bar|pie)\(/,
    'Unused chart implementations must be removed from this production fixture'
  )
  console.log(
    'Line chart bundle: ' +
      js.contents.length +
      ' bytes JS (' +
      gzipSync(js.contents).length +
      ' gzip), ' +
      css.contents.length +
      ' bytes CSS (' +
      gzipSync(css.contents).length +
      ' gzip)'
  )
  const eufemiaCss = await readFile(
    installed.resolve(
      '@dnb/eufemia/style/themes/ui/ui-theme-properties.min.css'
    )
  )
  const html =
    '<!doctype html><html lang="en"><title>Chart integration smoke test</title><link rel="stylesheet" href="/eufemia.css"><link rel="stylesheet" href="/bundle.css"><style>' +
    'body { margin:2rem; }' +
    '</style><h1>Chart integration</h1><p>Four observations with a missing March value.</p><div id="chart" style="--chart-color-tertiary-solid:#007272" class="dnb-chartist" aria-hidden="true"></div><table><caption>Test values</caption><tr><th>Month</th><th>Value</th></tr><tr><th>Jan</th><td>1</td></tr><tr><th>Feb</th><td>2</td></tr><tr><th>Mar</th><td>Missing</td></tr><tr><th>Apr</th><td>4</td></tr><tr><th>May</th><td>5</td></tr></table><span class="ct-label" id="outside">Outside chart</span><script type="module" src="/bundle.js"></script></html>'
  const server = createServer((request, response) => {
    response.setHeader(
      'content-type',
      request.url === '/bundle.js'
        ? 'text/javascript'
        : request.url === '/bundle.css' || request.url === '/eufemia.css'
          ? 'text/css'
          : 'text/html'
    )
    response.end(
      request.url === '/bundle.js'
        ? js.contents
        : request.url === '/bundle.css'
          ? css.contents
          : request.url === '/eufemia.css'
            ? eufemiaCss
            : html
    )
  })
  await new Promise<void>((resolve) =>
    server.listen(0, '127.0.0.1', resolve)
  )
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  let browser
  try {
    browser = await chromium.launch()
    const page = await browser.newPage({
      viewport: { width: 800, height: 600 },
      reducedMotion: 'reduce',
    })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const url = 'http://127.0.0.1:' + address.port
    console.log('Browser smoke fixture: ' + url)
    await page.goto(url)
    await page.locator('#chart .ct-line').waitFor()
    assert.equal(await page.locator('#chart .ct-point').count(), 4)
    const endpoints = await page.locator('#chart').evaluate((chart) => {
      const points = chart.querySelectorAll('.ct-point')
      const grid = chart.querySelector('.ct-grid')!
      return {
        first: Number(points[0].getAttribute('x1')),
        last: Number(points[points.length - 1].getAttribute('x1')),
        left: Number(grid.getAttribute('x1')),
        right: Number(grid.getAttribute('x2')),
      }
    })
    assert.equal(endpoints.first, endpoints.left)
    assert.equal(
      endpoints.last,
      endpoints.right,
      'The last observation reaches the right edge of the plot'
    )
    const resolved = await page.locator('#chart').evaluate((chart) => {
      const readTheme = (
        globalThis as unknown as {
          readChartTheme: (element: Element) => {
            colors: string[]
            fills: string[]
            fontFamily: string
          }
        }
      ).readChartTheme
      const before = chart.childElementCount
      const theme = readTheme(chart)
      return { theme, before, after: chart.childElementCount }
    })
    assert.equal(resolved.theme.colors[0], 'rgb(0, 114, 114)')
    assert.deepEqual(
      resolved.theme.colors.slice(1),
      ['rgb(25, 85, 169)', 'rgb(60, 60, 170)', 'rgb(204, 67, 0)'],
      'Unpublished chart properties use the Eufemia alpha palette'
    )
    assert.deepEqual(resolved.theme.fills, [
      'rgb(235, 244, 242)',
      'rgb(225, 233, 249)',
      'rgb(228, 228, 241)',
      'rgb(255, 234, 224)',
    ])
    await page
      .locator('#chart')
      .evaluate((chart) =>
        chart.style.removeProperty('--chart-color-tertiary-solid')
      )
    assert.equal(
      await page
        .locator('#chart .ct-line')
        .first()
        .evaluate((line) => getComputedStyle(line).stroke),
      'rgb(0, 123, 94)',
      'Published Chartist CSS supplies the same default palette'
    )
    await page
      .locator('#chart')
      .evaluate((chart) =>
        chart.style.setProperty('--chart-color-tertiary-solid', '#007272')
      )
    assert.equal(
      resolved.before,
      resolved.after,
      'Theme resolution removes its temporary element'
    )
    const geometry = await page
      .locator('#chart .ct-line')
      .evaluateAll((lines) =>
        lines.map((line) => line.getAttribute('d')).join(' ')
      )
    assert.equal(
      (geometry.match(/M/g) ?? []).length,
      2,
      'Missing values leave a gap'
    )
    assert.doesNotMatch(
      geometry,
      /C/,
      'Default lines must not be smoothed'
    )
    assert.equal(
      await page
        .locator('#chart .ct-line')
        .first()
        .evaluate((line) => getComputedStyle(line).stroke),
      'rgb(0, 114, 114)'
    )
    await page
      .locator('#chart')
      .evaluate((chart) =>
        chart.style.setProperty(
          '--chart-color-tertiary-solid',
          'rgb(80, 40, 120)'
        )
      )
    assert.equal(
      await page
        .locator('#chart .ct-line')
        .first()
        .evaluate((line) => getComputedStyle(line).stroke),
      'rgb(80, 40, 120)',
      'Eufemia variable overrides update without recreating the chart'
    )
    assert.equal(
      await page
        .locator('#outside')
        .evaluate((label) => getComputedStyle(label).display),
      'inline',
      'Chartist styles stay inside the scope'
    )
    if (process.env.CHARTS_SCREENSHOT) {
      await page.screenshot({
        path: process.env.CHARTS_SCREENSHOT,
        fullPage: true,
      })
    }
    await page.evaluate('globalThis.chart.destroy()')
    assert.equal(await page.locator('#chart svg').count(), 0)
    assert.deepEqual(errors, [])
  } finally {
    await browser?.close()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    )
  }
  console.log(
    'Verified packed imports, optional peers, types, selective bundling and browser behavior.'
  )
} finally {
  await rm(temporary, { recursive: true, force: true })
}
