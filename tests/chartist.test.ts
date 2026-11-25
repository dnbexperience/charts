import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createLineChartOptions,
  createBarChartOptions,
  createPieChartOptions,
} from '../src/chartist/index.ts'

test('uses straight lines and keeps the value grid', () => {
  const options = createLineChartOptions()

  assert.equal(options.lineSmooth, false)
  assert.equal(options.fullWidth, true)
  assert.deepEqual(options.chartPadding, { right: 32 })
  assert.deepEqual(options.axisX, { showGrid: false })
  assert.equal(options.axisY, undefined)
})

test('preserves application formatters, series settings and overrides', () => {
  const formatter = (value: string | number) => value + ' kr'
  const input = {
    lineSmooth: true,
    fullWidth: false,
    chartPadding: 16,
    showArea: true,
    axisX: { showGrid: true, labelInterpolationFnc: formatter },
    axisY: { offset: 64, labelInterpolationFnc: formatter },
    series: { savings: { showPoint: false } },
  }
  const options = createLineChartOptions(input)

  assert.deepEqual(options, input)
  assert.notEqual(options, input)
  assert.notEqual(options.axisX, input.axisX)
  assert.equal(input.axisX.showGrid, true)
  assert.equal(createLineChartOptions().axisX?.showGrid, false)
})

test('bars start at zero and preserve application stacking and axis options', () => {
  assert.equal(createBarChartOptions().low, 0)
  assert.deepEqual(createBarChartOptions().axisX, { showGrid: false })
  const options = createBarChartOptions({
    low: -10,
    stackBars: true,
    axisX: { offset: 48 },
    axisY: { offset: 64 },
  })
  assert.equal(options.low, -10)
  assert.equal(options.stackBars, true)
  assert.deepEqual(options.axisX, { showGrid: false, offset: 48 })
  assert.deepEqual(options.axisY, { offset: 64 })
})

test('pie labels stay inside by default and donut options remain configurable', () => {
  assert.equal(createPieChartOptions().labelPosition, 'inside')
  assert.equal(createPieChartOptions().chartPadding, 16)
  const input = {
    donut: true,
    donutWidth: 48,
    labelPosition: 'outside' as const,
    chartPadding: 32,
  }
  assert.deepEqual(createPieChartOptions(input), input)
})
