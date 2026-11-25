import type { EChartsCoreOption } from 'echarts/core'
import type { ChartTheme } from '../theme.js'

export function createEChartsOptions(theme: ChartTheme) {
  return {
    color: theme.colors,
    backgroundColor: theme.backgroundColor,
    textStyle: {
      fontFamily: theme.fontFamily,
      fontSize: 16,
      color: theme.textColor,
    },
    animation: false,
    grid: { top: 16, left: 56, right: 24, bottom: 40 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.textColor, fontSize: 16 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.textColor, fontSize: 16 },
      splitLine: { lineStyle: { color: theme.gridColor } },
    },
  } satisfies EChartsCoreOption
}

export function createEChartsSeries(theme: ChartTheme, seriesIndex = 0) {
  const index = seriesIndex % theme.colors.length
  return {
    type: 'line' as const,
    smooth: false,
    connectNulls: false,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      width: 2,
      color: theme.colors[index],
      type: (['solid', 'dashed', 'dotted', 'dashed'] as const)[index],
    },
    itemStyle: { color: theme.colors[index] },
    emphasis: { disabled: true },
  }
}
