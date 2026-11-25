import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createLineChartOptions } from '../src/chartist/index.ts'

test('uses straight lines and keeps the value grid', () => {
  const options = createLineChartOptions()

  assert.equal(options.lineSmooth, false)
  assert.deepEqual(options.axisX, { showGrid: false })
  assert.equal(options.axisY, undefined)
})

test('preserves application formatters, series settings and overrides', () => {
  const formatter = (value: string | number) => value + ' kr'
  const input = {
    lineSmooth: true,
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
