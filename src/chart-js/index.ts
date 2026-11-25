import type { ChartOptions } from 'chart.js'
import type { ChartTheme } from '../theme.js'

export function createChartJsOptions(
  theme: ChartTheme
): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    color: theme.textColor,
    font: { family: theme.fontFamily, size: 16 },
    elements: {
      line: { borderWidth: 2, tension: 0, spanGaps: false },
      point: { radius: 3, hoverRadius: 5 },
    },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: theme.textColor,
          font: { family: theme.fontFamily, size: 16 },
        },
        border: { display: false },
      },
      y: {
        grid: { color: theme.gridColor },
        ticks: {
          color: theme.textColor,
          font: { family: theme.fontFamily, size: 16 },
        },
        border: { display: false },
      },
    },
  }
}

export function createChartJsDataset(theme: ChartTheme, seriesIndex = 0) {
  const index = seriesIndex % theme.colors.length
  return {
    borderColor: theme.colors[index],
    backgroundColor: theme.fills[index],
    pointBackgroundColor: theme.colors[index],
    borderDash: [[], [8, 4], [2, 4], [8, 4, 2, 4]][index],
  }
}
