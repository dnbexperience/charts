import type {
  LineChartPresetOptions,
  BarChartPresetOptions,
  PieChartPresetOptions,
} from 'chartist'

/** Straight lines preserve gaps and avoid implying unobserved values. */
export function createLineChartOptions(
  options: LineChartPresetOptions = {}
): LineChartPresetOptions {
  return {
    lineSmooth: false,
    fullWidth: true,
    chartPadding: { right: 32 },
    ...options,
    axisX: { showGrid: false, ...options.axisX },
  }
}

/** Keep bar comparisons on a zero baseline with horizontal gridlines. */
export function createBarChartOptions(
  options: BarChartPresetOptions = {}
): BarChartPresetOptions {
  return {
    low: 0,
    ...options,
    axisX: { showGrid: false, ...options.axisX },
  }
}

/** Put numeric labels inside slices; supply the label formatter for your units. */
export function createPieChartOptions(
  options: PieChartPresetOptions = {}
): PieChartPresetOptions {
  return { chartPadding: 16, labelPosition: 'inside', ...options }
}
