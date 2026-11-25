import type { LineSvgProps, LineSeries } from '@nivo/line'
import type { ChartTheme } from '../theme.js'

export function createNivoConfig(theme: ChartTheme) {
  return {
    theme: {
      background: theme.backgroundColor,
      text: {
        fontFamily: theme.fontFamily,
        fontSize: 16,
        fill: theme.textColor,
      },
      axis: {
        ticks: {
          text: { fill: theme.textColor, fontSize: 16 },
          line: { strokeWidth: 0 },
        },
        domain: { line: { strokeWidth: 0 } },
      },
      grid: { line: { stroke: theme.gridColor } },
    },
    colors: theme.colors,
    curve: 'linear',
    lineWidth: 2,
    pointSize: 6,
    enableGridX: false,
    animate: false,
    isInteractive: false,
  } satisfies Partial<LineSvgProps<LineSeries>>
}
