import type { LineChartPresetOptions } from 'chartist'

/** Straight lines preserve gaps and avoid implying unobserved values. */
export function createLineChartOptions(
  options: LineChartPresetOptions = {}
): LineChartPresetOptions {
  return {
    lineSmooth: false,
    ...options,
    axisX: { showGrid: false, ...options.axisX },
  }
}
