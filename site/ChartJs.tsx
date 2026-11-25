import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import Space from '@dnb/eufemia/components/space/Space.js'
import {
  createChartJsOptions,
  createChartJsDataset,
} from '../dist/chart-js/index.js'
import type { ChartTheme } from '../dist/theme.js'
import { labels, type Example } from './examples.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler
)

export default function ChartJs({
  example,
  theme,
}: {
  example: Example
  theme: ChartTheme
}) {
  const options = createChartJsOptions(theme)
  const axis = options.scales?.y
  if (axis) {
    axis.min = 0
    axis.max = 100
    if (example.override) {
      axis.ticks = { ...axis.ticks, callback: (value) => value + '%' }
    }
  }
  return (
    <Space style={{ height: '16rem' }}>
      <Line
        options={options}
        data={{
          labels,
          datasets: example.series.map((data, index) => ({
            label: 'Series ' + (index + 1),
            data,
            fill: example.area,
            order: -index,
            ...createChartJsDataset(theme, example.override ? 1 : index),
            ...(example.override
              ? { borderWidth: 4, pointRadius: 0, borderDash: [] }
              : {}),
          })),
        }}
      />
    </Space>
  )
}
