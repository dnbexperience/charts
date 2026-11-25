import type { ChartTheme } from '../theme.js'

/** Spread these props onto Recharts axes, grid, and Line or Area. */
export function createRechartsConfig(theme: ChartTheme) {
  return {
    style: { fontFamily: theme.fontFamily, fontSize: 16 },
    axis: {
      tick: { fill: theme.textColor, fontSize: 16 },
      axisLine: false,
      tickLine: false,
    },
    grid: { stroke: theme.gridColor, vertical: false },
    series: theme.colors.map((stroke, index) => ({
      stroke,
      fill: theme.fills[index],
      strokeWidth: 2,
      fillOpacity: 1,
      strokeDasharray: ['', '8 4', '2 4', '8 4 2 4'][index],
      dot: { r: 3, fill: stroke },
      activeDot: false as const,
      connectNulls: false,
      isAnimationActive: false,
      type: 'linear' as const,
    })),
  }
}
