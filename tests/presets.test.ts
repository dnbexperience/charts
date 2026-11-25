import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createChartJsDataset,
  createChartJsOptions,
} from '../src/chart-js/index.ts'
import {
  createEChartsOptions,
  createEChartsSeries,
} from '../src/echarts/index.ts'
import { createNivoConfig } from '../src/nivo/index.ts'
import { createRechartsConfig } from '../src/recharts/index.ts'
import type { ChartTheme } from '../src/theme.ts'

const theme: ChartTheme = {
  colors: ['green', 'blue', 'purple', 'orange'],
  fills: ['mintcream', 'aliceblue', 'lavender', 'seashell'],
  fontFamily: 'Example font',
  textColor: 'black',
  gridColor: 'gray',
  backgroundColor: 'white',
}

test('maps all four series to matching line and area colors', () => {
  const recharts = createRechartsConfig(theme)
  const nivo = createNivoConfig(theme)
  const echarts = createEChartsOptions(theme)

  assert.deepEqual(nivo.colors, theme.colors)
  assert.deepEqual(echarts.color, theme.colors)
  for (let index = 0; index < theme.colors.length; index++) {
    assert.equal(
      createChartJsDataset(theme, index).borderColor,
      theme.colors[index]
    )
    assert.equal(
      createChartJsDataset(theme, index).backgroundColor,
      theme.fills[index]
    )
    assert.equal(recharts.series[index].stroke, theme.colors[index])
    assert.equal(recharts.series[index].fill, theme.fills[index])
    assert.equal(
      createEChartsSeries(theme, index).lineStyle.color,
      theme.colors[index]
    )
  }
})

test('keeps observations straight, leaves gaps and avoids default animation', () => {
  const chartJs = createChartJsOptions(theme)
  const recharts = createRechartsConfig(theme)
  const nivo = createNivoConfig(theme)
  const echarts = createEChartsOptions(theme)
  const series = createEChartsSeries(theme)

  assert.equal(chartJs.animation, false)
  assert.equal(chartJs.elements?.line?.tension, 0)
  assert.equal(chartJs.elements?.line?.spanGaps, false)
  assert.equal(recharts.series[0].isAnimationActive, false)
  assert.equal(recharts.series[0].type, 'linear')
  assert.equal(recharts.series[0].connectNulls, false)
  assert.equal(nivo.animate, false)
  assert.equal(nivo.curve, 'linear')
  assert.equal(echarts.animation, false)
  assert.equal(series.smooth, false)
  assert.equal(series.connectNulls, false)
})

test('uses the resolved Eufemia font and size for axis labels', () => {
  const chartJs = createChartJsOptions(theme)
  assert.deepEqual(chartJs.scales?.x?.ticks?.font, {
    family: theme.fontFamily,
    size: 16,
  })
  assert.deepEqual(chartJs.scales?.y?.ticks?.font, {
    family: theme.fontFamily,
    size: 16,
  })
  assert.equal(
    createRechartsConfig(theme).style.fontFamily,
    theme.fontFamily
  )
  assert.equal(createRechartsConfig(theme).axis.tick.fontSize, 16)
  assert.equal(
    createNivoConfig(theme).theme.text.fontFamily,
    theme.fontFamily
  )
  assert.equal(createNivoConfig(theme).theme.axis.ticks.text.fontSize, 16)
  assert.equal(
    createEChartsOptions(theme).textStyle.fontFamily,
    theme.fontFamily
  )
  assert.equal(createEChartsOptions(theme).xAxis.axisLabel.fontSize, 16)
})
