import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { chromium, expect } from '@playwright/test'

const root = path.resolve('.pages')
const html = await readFile(path.join(root, 'index.html'), 'utf8')
assert.match(html, /Eufemia charts/)
assert.match(html, /(?:src|href)="\.\/assets\//)

const types: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
}
const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost')
  const relative = decodeURIComponent(url.pathname).replace(
    /^\/charts\//,
    ''
  )
  const file = path.resolve(root, relative || 'index.html')
  try {
    assert.ok(file.startsWith(root + path.sep))
    const body = await readFile(file)
    response.setHeader(
      'content-type',
      types[path.extname(file)] ?? 'application/octet-stream'
    )
    response.end(body)
  } catch {
    response.writeHead(404).end()
  }
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
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('requestfailed', (request) => errors.push(request.url()))
  page.on('response', (response) => {
    if (response.status() >= 400) {
      errors.push(response.url() + ': ' + response.status())
    }
  })
  const url = 'http://127.0.0.1:' + address.port + '/charts/'
  const checkChartTypes = async (library: string) => {
    // Measure rendered data so category and numeric scale regressions are visible.
    const shapes = (example: string) =>
      page.locator('[data-example="' + example + '"]').evaluate((plot) => {
        const colors = [
          'rgb(0, 123, 94)',
          'rgb(25, 85, 169)',
          'rgb(60, 60, 170)',
        ]
        const canvas = plot.querySelector('canvas')
        if (canvas) {
          const context = canvas.getContext('2d')!
          const { width, height } = canvas
          const pixels = context.getImageData(0, 0, width, height).data
          return [
            [0, 123, 94],
            [25, 85, 169],
            [60, 60, 170],
          ].flatMap((rgb, series) => {
            const columns: { x: number; top: number; bottom: number }[] =
              []
            for (let x = 0; x < width; x++) {
              let top = height
              let bottom = -1
              for (let y = 0; y < height; y++) {
                const i = (y * width + x) * 4
                if (rgb.every((channel, j) => pixels[i + j] === channel)) {
                  top = Math.min(top, y)
                  bottom = y
                }
              }
              if (bottom >= 0) {
                columns.push({ x, top, bottom })
              }
            }
            const runs: {
              series: number
              x: number
              y: number
              width: number
              height: number
            }[] = []
            for (const column of columns) {
              const previous = runs.at(-1)
              if (previous && column.x === previous.x + previous.width) {
                const bottom = Math.max(
                  previous.y + previous.height,
                  column.bottom + 1
                )
                previous.width++
                previous.y = Math.min(previous.y, column.top)
                previous.height = bottom - previous.y
              } else {
                runs.push({
                  series,
                  x: column.x,
                  y: column.top,
                  width: 1,
                  height: column.bottom - column.top + 1,
                })
              }
            }
            return runs.map((run) => ({
              ...run,
              x: run.x + run.width / 2,
            }))
          })
        }
        return [
          ...plot.querySelectorAll<SVGGraphicsElement>(
            'path,line,rect,circle'
          ),
        ]
          .filter((element) => !element.closest('defs'))
          .flatMap((element) => {
            const style = getComputedStyle(element)
            const series = colors.findIndex(
              (color) => style.fill === color || style.stroke === color
            )
            if (series < 0) {
              return []
            }
            const bounds = element.getBoundingClientRect()
            return [
              {
                series,
                x: bounds.x + bounds.width / 2,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
              },
            ]
          })
      })
    for (const id of ['bars', 'stacked-bars']) {
      const bars = await shapes(id)
      const series = [0, 1, 2].map((index) =>
        bars
          .filter((bar) => bar.series === index)
          .sort((a, b) => a.x - b.x)
      )
      assert.deepEqual(
        series.map((bars) => bars.length),
        [6, 6, 6],
        library + ' draws all bar values'
      )
      const [green, blue, purple] = series
      assert.ok(
        Math.abs(green[5].height / green[0].height - 2) < 0.15,
        library + ' preserves bar proportions'
      )
      if (id === 'bars') {
        assert.ok(
          green[0].x < blue[0].x && blue[0].x < purple[0].x,
          library + ' groups series side by side'
        )
      } else {
        assert.ok(
          Math.abs(green[0].x - blue[0].x) < 1 &&
            Math.abs(blue[0].x - purple[0].x) < 1,
          library + ' stacks series at the same category'
        )
        assert.ok(
          purple[0].y < blue[0].y && blue[0].y < green[0].y,
          library + ' accumulates positive values'
        )
        assert.ok(
          Math.abs(
            (purple[0].y - purple[5].y) /
              (green[5].height - green[0].height) -
              45 / 20
          ) < 0.1,
          library + ' preserves stack totals'
        )
      }
    }
    if (library !== 'chartist') {
      const scatter = await shapes('scatter')
      for (const index of [0, 1]) {
        const points = scatter
          .filter((point) => point.series === index)
          .sort((a, b) => a.x - b.x)
        assert.equal(
          points.length,
          6,
          library + ' draws six observations per scatter series'
        )
        const ratio =
          (points[2].x - points[1].x) / (points[1].x - points[0].x)
        assert.ok(
          Math.abs(ratio - 16 / 7) < 0.1,
          library + ' uses unequal numeric scatter intervals'
        )
      }
      const data = page.locator('.dnb-chart-gallery__example').filter({
        has: page.getByRole('heading', {
          name: 'Scatter plot',
          exact: true,
        }),
      })
      await data
        .getByRole('button', { name: 'View data', exact: true })
        .click()
      await expect(
        data.getByRole('columnheader', { name: 'Effort (hours)' })
      ).toBeVisible()
      await expect(
        data.getByText('Scatter plot – output in units', { exact: true })
      ).toBeVisible()
      await data
        .getByRole('button', { name: 'View data', exact: true })
        .click()
    }
    for (const id of ['pie', 'donut']) {
      const segments = await shapes(id)
      assert.deepEqual(
        [...new Set(segments.map((segment) => segment.series))].sort(),
        [0, 1, 2],
        library + ' renders all share colors'
      )
      if (library !== 'chart-js') {
        const labels = await page
          .locator('[data-example="' + id + '"] text')
          .allTextContents()
        assert.deepEqual(
          labels.sort(),
          ['15%', '30%', '55%'],
          library + ' labels all shares'
        )
        assert.equal(segments.length, 3, library + ' draws three slices')
      }
    }
  }
  await page.goto(url + '#chartist')
  await expect(
    page
      .locator('aside')
      .getByRole('link', { name: 'Chartist', exact: true })
  ).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('.dnb-chartist svg')).toHaveCount(10)
  const chartColors = await page
    .locator('.dnb-chart-gallery__plot')
    .first()
    .evaluate((element) => {
      const style = getComputedStyle(element)
      return [
        '--chart-color-tertiary-solid',
        '--chart-color-blue-700',
        '--chart-color-purple-700',
        '--chart-color-orange-700',
      ].map((property) => style.getPropertyValue(property).trim())
    })
  assert.ok(
    chartColors.every(Boolean),
    'The Eufemia PR theme supplies chart color properties'
  )
  await checkChartTypes('chartist')
  const usage = page.getByRole('button', {
    name: 'Installation and usage',
  })
  const readme = page.locator('.dnb-chart-gallery__readme')
  await expect(usage).toHaveAttribute('aria-expanded', 'false')
  await usage.focus()
  await usage.press('Enter')
  await expect(usage).toHaveAttribute('aria-expanded', 'true')
  await expect(
    readme.getByRole('heading', { name: 'Use Chartist', exact: true })
  ).toBeVisible()
  await expect(
    readme.locator('pre').filter({
      hasText: 'npm install @eufemia/charts @dnb/eufemia chartist',
    })
  ).toBeVisible()
  await expect(readme.getByRole('table')).toBeVisible()
  await expect(
    readme.getByRole('link', { name: 'third-party notices' })
  ).toHaveAttribute(
    'href',
    'https://github.com/dnbexperience/charts/blob/main/THIRD_PARTY_NOTICES.md'
  )
  await usage.click()
  await expect(readme).not.toBeVisible()
  const icons = page.locator('aside .dnb-sidebar-menu__item__icon img')
  await expect(icons).toHaveCount(5)
  await expect
    .poll(() =>
      icons.evaluateAll((images) =>
        images.every(
          (image) =>
            image instanceof HTMLImageElement && image.naturalWidth > 0
        )
      )
    )
    .toBe(true)
  const checkStickyHeader = async () => {
    await page.evaluate(() => window.scrollTo(0, 600))
    await expect
      .poll(() =>
        page.locator('header').evaluate((header) => {
          const bounds = header.getBoundingClientRect()
          return (
            window.scrollY > 0 &&
            bounds.top === 0 &&
            header.contains(
              document.elementFromPoint(bounds.right - 20, 20)
            )
          )
        })
      )
      .toBe(true)
  }
  await checkStickyHeader()
  await page.evaluate(() => window.scrollTo(0, 0))
  const noticeGap = await page
    .getByRole('heading', { name: 'Preview colors', exact: true })
    .evaluate((heading) => {
      const notice = heading.closest('.dnb-card')
      const previous = notice?.previousElementSibling
      return notice && previous
        ? notice.getBoundingClientRect().top -
            previous.getBoundingClientRect().bottom
        : 0
    })
  assert.ok(noticeGap >= 16, 'Preview colors has space above it')
  const chartsFit = () =>
    page.locator('.dnb-chartist').evaluateAll((charts) =>
      charts.every((chart) => {
        const svg = chart.querySelector('svg')
        if (!svg) {
          return false
        }
        const bounds = svg.getBoundingClientRect()
        return (
          [...svg.querySelectorAll('.ct-point')].every((point) => {
            const x = Number(point.getAttribute('x1'))
            return x >= 0 && x <= bounds.width
          }) &&
          [...svg.querySelectorAll('.ct-label.ct-horizontal')].every(
            (label) => {
              const range = document.createRange()
              range.selectNodeContents(label)
              const text = range.getBoundingClientRect()
              return text.left >= bounds.left && text.right <= bounds.right
            }
          )
        )
      })
    )
  await expect.poll(chartsFit).toBe(true)
  await expect(
    page.locator('[data-example="gaps"] .ct-point')
  ).toHaveCount(5)
  const viewData = page
    .locator('.dnb-chart-gallery__example')
    .filter({
      has: page.getByRole('heading', { name: 'Missing observations' }),
    })
    .getByRole('button', { name: 'View data', exact: true })
  await expect(viewData).toHaveAttribute('aria-expanded', 'false')
  await viewData.focus()
  await viewData.press('Enter')
  await expect(viewData).toHaveAttribute('aria-expanded', 'true')
  await expect(
    page.getByRole('cell', { name: 'No observation', exact: true })
  ).toBeVisible()
  await viewData.click()
  await expect(viewData).toHaveAttribute('aria-expanded', 'false')
  await expect(
    page.getByRole('cell', { name: 'No observation', exact: true })
  ).not.toBeVisible()
  const theme = page.locator('.dnb-chart-gallery-theme')
  const lightBackground = await theme.evaluate(
    (element) => getComputedStyle(element).backgroundColor
  )
  await page.getByRole('switch', { name: 'Dark appearance' }).check()
  await expect(
    page.locator('body.eufemia-theme__color-scheme--dark')
  ).toBeVisible()
  await expect(theme).not.toHaveCSS('background-color', lightBackground)
  await page.getByRole('switch', { name: 'Dark appearance' }).uncheck()
  await page.evaluate(() => document.fonts.ready)
  if (process.env.CHARTS_GALLERY_SCREENSHOT) {
    await page.screenshot({
      path: process.env.CHARTS_GALLERY_SCREENSHOT,
      fullPage: true,
    })
  }
  for (const [key, name] of [
    ['recharts', 'Recharts'],
    ['chart-js', 'Chart.js'],
    ['nivo', 'Nivo'],
    ['echarts', 'Apache ECharts'],
  ]) {
    await page
      .locator('aside')
      .getByRole('link', { name, exact: true })
      .click()
    await expect(page).toHaveURL(url + '#' + key)
    await expect(
      page.getByRole('heading', { name, exact: true, level: 1 })
    ).toBeVisible()
    await expect(
      page.locator(
        '.dnb-chart-gallery__plot svg, .dnb-chart-gallery__plot canvas'
      )
    ).toHaveCount(12)
    await expect(page.locator('.dnb-chartist')).toHaveCount(0)
    await checkChartTypes(key)
    const plot = page.locator('[data-example="gaps"]')
    if (key === 'chart-js') {
      const image = await plot.locator('canvas').evaluate((canvas) => {
        if (!(canvas instanceof HTMLCanvasElement)) {
          return false
        }
        const context = canvas.getContext('2d')
        if (!context) {
          return false
        }
        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        ).data
        return pixels.some(
          (channel, index) => index % 4 === 3 && channel > 0
        )
      })
      assert.ok(image, 'Chart.js paints data on its canvas')
    } else {
      assert.ok(
        (await plot.locator('svg path').count()) > 0,
        name + ' renders chart paths'
      )
    }
    if (key === 'nivo') {
      const ids = await page
        .locator('.dnb-chart-gallery__plot linearGradient')
        .evaluateAll((gradients) =>
          gradients.map((gradient) => gradient.id)
        )
      assert.ok(ids.length > 0)
      assert.equal(
        new Set(ids).size,
        ids.length,
        'Nivo fill IDs are unique'
      )
      const areas = await page
        .locator('[data-example="areas"] path[fill^="url("]')
        .evaluateAll((paths) =>
          paths.map((path) => (path as SVGGraphicsElement).getBBox().y)
        )
      assert.equal(areas.length, 4)
      assert.ok(
        areas.every((top, index) => index === 0 || top > areas[index - 1]),
        'Nivo draws smaller area fills above larger fills'
      )
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      )
      .toBe(true)
    await page.setViewportSize({ width: 1440, height: 1000 })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await checkStickyHeader()
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: 'Chart libraries' })
  await expect(drawer).toBeVisible()
  await expect(
    drawer.locator('.dnb-sidebar-menu__item__icon img')
  ).toHaveCount(5)
  await drawer.getByRole('link', { name: 'Chartist', exact: true }).click()
  await expect(drawer).not.toBeVisible()
  await expect(page.locator('.dnb-chartist svg')).toHaveCount(10)
  await expect.poll(chartsFit).toBe(true)
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    'Gallery fits a narrow viewport'
  )
  await usage.click()
  const codeExample = readme.locator('pre').first()
  await expect(codeExample).toBeVisible()
  await codeExample.focus()
  await codeExample.press('ArrowRight')
  await expect
    .poll(() => codeExample.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0)
  const comparison = readme.getByLabel('Chart library integrations')
  await expect(comparison).toHaveAttribute('tabindex', '0')
  await comparison.focus()
  await comparison.press('ArrowRight')
  await expect
    .poll(() => comparison.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0)
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    'README code and tables scroll within the narrow page'
  )
  await usage.click()
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Chart libraries' })
    .getByRole('link', { name: 'Overview', exact: true })
    .click()
  await expect(page.locator('.dnb-chart-gallery__plot')).toHaveCount(0)
  await page.goBack()
  await expect(
    page.getByRole('heading', { name: 'Chartist', exact: true, level: 1 })
  ).toBeVisible()
  await expect(page.locator('.dnb-chartist svg')).toHaveCount(10)
  await expect(
    page.getByRole('heading', { name: 'Preview colors', exact: true })
  ).toBeVisible()
  assert.deepEqual(errors, [])
  console.log(
    'Verified five chart integrations, local library icons, sticky headers, nested assets, sidebar history, chart cleanup, keyboard-operated data accordions, themes and mobile navigation.'
  )
} finally {
  await browser?.close()
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  )
}
