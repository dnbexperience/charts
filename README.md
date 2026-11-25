# Eufemia charts

Chart-library defaults for Eufemia, published independently as `@eufemia/charts`.

[Preview the five integrations](https://dnbexperience.github.io/charts/) · [Report an issue](https://github.com/dnbexperience/charts/issues)

Five integrations provide Eufemia defaults for line and area charts. The package has no JavaScript runtime dependencies or root entry point. Each chart library is an optional peer: install only the library your application uses. These presets do not configure every chart type or provide a React wrapper.

| Library        | Import                     | Helpers                                        | React integration               |
| -------------- | -------------------------- | ---------------------------------------------- | ------------------------------- |
| Chartist       | `@eufemia/charts/chartist` | `createLineChartOptions`                       | Create and destroy in an effect |
| Recharts       | `@eufemia/charts/recharts` | `createRechartsConfig`                         | React components                |
| Chart.js       | `@eufemia/charts/chart-js` | `createChartJsOptions`, `createChartJsDataset` | `react-chartjs-2`               |
| Nivo           | `@eufemia/charts/nivo`     | `createNivoConfig`                             | `@nivo/line` React components   |
| Apache ECharts | `@eufemia/charts/echarts`  | `createEChartsOptions`, `createEChartsSeries`  | Create and dispose in an effect |

Recharts offers composition through React components. Chart.js offers canvas rendering. Nivo offers declarative React charts built on D3. ECharts covers a broad range of visualizations with selectively imported modules. Chartist provides a small SVG integration styled through CSS. Choose according to the chart types, interactions, data volume, accessibility and bundle constraints of your application.

All integrations use four Eufemia series colors, straight lines, point markers, horizontal gridlines and no animation. Chartist, Recharts, Chart.js and ECharts also distinguish series with line patterns. Nivo's default line layer uses solid lines, so its gallery legend reflects that. Presets disable built-in tooltips where applicable; applications must provide any required interaction and accessible equivalents.

## Resolve theme values

Load your application's Eufemia theme first. The integrations include the alpha chart palette as overridable defaults, so they work with the published Eufemia theme. Chart CSS custom properties take precedence when present. The palette follows [Eufemia's chart colors](https://github.com/dnbexperience/eufemia/pull/11069) and may change as the chart guidelines develop.

Chartist consumes CSS custom properties directly. The other integrations accept resolved values, so canvas and SVG libraries use the same palette:

```ts
import { readChartTheme } from '@eufemia/charts/theme'
import { createRechartsConfig } from '@eufemia/charts/recharts'

const theme = readChartTheme(container)
const config = createRechartsConfig(theme)
```

Call `readChartTheme` with a mounted element that inherits the Eufemia font and chart colors. It returns a snapshot. Read it again and update the chart when your application changes those properties. Keep the plot on a light surface, including in dark themes. Helpers can be imported on the server; theme resolution and chart rendering happen in the browser.

Spread `config.style` on the Recharts chart, `config.axis` on each axis, `config.grid` on `CartesianGrid`, and `config.series[index]` on each `Line` or `Area`. For Chart.js, pass `createChartJsOptions(theme)` as options and merge `createChartJsDataset(theme, index)` into each dataset. Spread `createNivoConfig(theme)` onto Nivo's `ResponsiveLine`. Merge `createEChartsOptions(theme)` with your axes and data, and `createEChartsSeries(theme, index)` into each ECharts line series. Configure dimensions, ranges, locale-specific units, data and area fills in your application. The gallery source contains complete React examples for each integration.

## Use Chartist

```sh
npm install @eufemia/charts @dnb/eufemia chartist
```

Load your application's Eufemia theme before the integration CSS.

```ts
import { lineChart } from 'chartist'
import { createLineChartOptions } from '@eufemia/charts/chartist'
import '@eufemia/charts/chartist/styles.css'

const container = document.querySelector<HTMLElement>('#savings-chart')!
const chart = lineChart(
  container,
  {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    series: [[100, 120, null, 150]],
  },
  createLineChartOptions({
    height: 320,
    axisY: { labelInterpolationFnc: (value) => `${value} kr` },
  })
)

// On unmount, release Chartist's observers and event listeners.
chart.destroy()
```

Use a container with `id="savings-chart"` and `class="dnb-chartist"`. Create the chart after mounting in the browser. The options helper can be imported on the server; DOM rendering and hydration are application responsibilities. In React, create the chart in an effect and return a cleanup function that calls `destroy()`.

The helper defaults to straight lines and hides X-axis gridlines. It preserves Chartist's handling of missing observations and allows every option to be overridden. Supply units and locale-specific formatters for your data. Chartist does not animate by default; any animation plugins added by the application must respect reduced motion.

Four series are mapped to Eufemia green, blue, purple, and orange properties, with pale area fills. More series require explicit application styles and distinguishable labels or line patterns. Keep the chart on its light surface, including in dark themes. Custom properties such as `--ct-line-width` and `--ct-series-a` can be overridden on an individual chart.

Give each chart a visible title, a concise summary, and an equivalent HTML data table with units and headers. Keep them synchronized with filters. If the graphic repeats the table, it can be hidden from assistive technology. The package does not provide an accessible chart experience on its own. Validate contrast, long labels, zoom, keyboard and touch interactions in the consuming application.

Direct Chartist integration keeps the imported chart type explicit. `react-chartist` 1.0.1 supports React 18/19 but imports line, bar, and pie implementations through one runtime switch. It is not required here. `pack:check` measures a production line-chart bundle and verifies that bar and pie implementations, React, and Eufemia JavaScript are absent from that fixture. Results apply to that build and import pattern.

## Develop

From the repository root:

```sh
corepack enable
yarn install --immutable
yarn exec playwright install chromium
yarn ci
```

The package check prepares and packs the release artifact in a temporary directory, installs it in a temporary consumer with the pinned published Eufemia package, checks all integration exports and TypeScript declarations, builds a selected Chartist chart, and runs a Chromium smoke test. The browser test checks alpha palette defaults, CSS overrides, missing observations, scoped styles, and destruction. Set `CHARTS_SCREENSHOT` to an absolute PNG path to save the smoke fixture for visual inspection.

## Preview gallery

The standalone Vite gallery follows the logos and illustrations deployment pattern and uses the application starter's responsive Eufemia SidebarMenu shell. Each library loads on navigation and shows the same six examples: line, area, four series, four area fills, missing observations, and local overrides. Every example includes a data table in a tertiary Accordion.

```sh
yarn build
yarn site
```

Open the printed local URL with `#overview`, `#chartist`, `#recharts`, `#chart-js`, `#nivo`, or `#echarts`. Run `site:build` to create `.pages`, or `site:check` to build and check nested asset paths, sidebar navigation, browser history, chart cleanup, data tables, themes, and mobile layout in Chromium. Set `CHARTS_GALLERY_SCREENSHOT` to an absolute PNG path to save the gallery. Build the package first when running these commands separately.

The gallery uses the published Eufemia UI and the package's alpha palette defaults. To review a palette from another checkout locally, set `CHARTS_THEME_FILE` to that checkout's absolute theme SCSS path when running `site` or `site:build`.

PR previews follow the logos and illustrations setup: CI uploads the validated static gallery, and the trusted Pages workflow assembles successful previews for open pull requests at their current revision. Preview URLs use `/charts/previews/pr-N/#overview` and appear as GitHub deployments. Closing a pull request removes its preview on the next deployment. Relative asset paths support both production and nested preview URLs.

The initial setup must be merged into `main` before GitHub can run the trusted Pages workflow. The bootstrap PR still builds and validates the gallery in CI.

Development dependencies are pinned to the latest compatible versions. Development and CI use Node 24.22.2 and Yarn 4.18.1. TypeScript 6 and ESLint 9 are the newest versions supported by the lint plugins; semantic-release 25 supports the Node 24 runtime.

## Releases

Releases run independently from Eufemia on `main`, use `v${version}` tags, and publish to the public npm registry. Conventional Commit PR titles determine versions: `fix: preserve axis options` produces a patch and `feat: add chart defaults` a minor release. Use `!` or a `BREAKING CHANGE:` footer for breaking changes. The first release is 1.0.0.

`yarn release:check` exercises the configured semantic-release CLI against temporary local remotes, covering first, patch, minor, breaking, no-release and revert scenarios without publishing.

Before enabling releases:

1. Establish `@eufemia/charts` under the `eufemia` npm organization. For a new package, `npm stage publish` creates npm's public `0.0.0-stage` placeholder while keeping the submitted version unpublished until approval. Use a separate prerelease version and the `stage` dist-tag for a reservation; `0.0.0-stage` cannot be published directly.
2. Configure npm trusted publishing for owner `dnbexperience`, repository `charts`, workflow `release.yml`, and environment `npm-release`.
3. Create the GitHub environment `npm-release` and restrict it to `main`. Confirm the workflow token may create tags and GitHub releases.
4. After the reviewed setup is merged and npm trusted publishing is verified, set the repository variable `RELEASE_ENABLED` to `true`.

The release workflow validates the revision before publishing. It restores the validated build artifact by ID and prepares `.release/` from an allowlist of build files and checked-out metadata. Published packages contain no development dependencies or lifecycle scripts. Publishing uses npm OIDC trusted publishing and provenance, with no npm token. Concurrent releases are queued. Enable GitHub Pages with the GitHub Actions source for the production gallery and PR previews.

## License

The source is public and contributions are welcome. Use is governed by the [Eufemia DNB Project License](LICENSE), which permits DNB Projects and contributions to Eufemia. Public availability does not grant unrestricted reuse. Chartist's included CSS retains its MIT license; see [third-party notices](THIRD_PARTY_NOTICES.md).
