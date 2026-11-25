import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  BarElement,
  ArcElement,
  PieController,
  DoughnutController,
} from 'chart.js'
import { Line, Bar, Scatter, Chart } from 'react-chartjs-2'
import Space from '@dnb/eufemia/components/space/Space.js'
import {
  createChartJsOptions,
  createChartJsDataset,
} from '../dist/chart-js/index.js'
import type { ChartTheme } from '../dist/theme.js'
import { labels, scatterX, isRadial, type Example } from './examples.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  BarElement,
  ArcElement,
  PieController,
  DoughnutController
)

export default function ChartJs({
  example,
  theme,
}: {
  example: Example
  theme: ChartTheme
}) {
  if (isRadial(example)) {
    const type = example.kind === 'donut' ? 'doughnut' : 'pie'
    return (
      <Space style={{ height: '16rem' }}>
        <Chart
          type={type}
          options={createChartJsOptions(theme, type)}
          plugins={[
            {
              id: 'share-labels',
              afterDatasetsDraw(chart) {
                const { ctx } = chart
                ctx.save()
                ctx.fillStyle = theme.backgroundColor
                ctx.font = '16px ' + theme.fontFamily
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                chart.getDatasetMeta(0).data.forEach((element, index) => {
                  const { x, y } = element.tooltipPosition(true)
                  if (x !== null && y !== null) {
                    ctx.fillText(example.series[index][0] + '%', x, y)
                  }
                })
                ctx.restore()
              },
            },
          ]}
          data={{
            labels: example.series.map((_, i) => 'Part ' + (i + 1)),
            datasets: [
              {
                data: example.series.map((series) => series[0] ?? 0),
                backgroundColor: theme.colors,
                borderColor: theme.backgroundColor,
                borderWidth: 2,
              },
            ],
          }}
        />
      </Space>
    )
  }
  if (example.kind === 'bar') {
    const options = createChartJsOptions(theme, 'bar')
    options.scales = {
      x: { ...options.scales?.x, stacked: example.stacked },
      y: {
        ...options.scales?.y,
        stacked: example.stacked,
        min: 0,
        max: 100,
      },
    }
    return (
      <Space style={{ height: '16rem' }}>
        <Bar
          options={options}
          data={{
            labels,
            datasets: example.series.map((data, i) => ({
              data,
              backgroundColor: theme.colors[i],
              borderColor: theme.backgroundColor,
              borderWidth: 2,
              borderSkipped: false,
            })),
          }}
        />
      </Space>
    )
  }
  if (example.kind === 'scatter') {
    const options = createChartJsOptions(theme, 'scatter')
    options.scales = {
      x: { ...options.scales?.x, min: 0, max: 100 },
      y: { ...options.scales?.y, min: 0, max: 100 },
    }
    return (
      <Space style={{ height: '16rem' }}>
        <Scatter
          options={options}
          data={{
            datasets: example.series.map((series, i) => ({
              data: series.map((y, j) => ({ x: scatterX[j], y: y! })),
              backgroundColor: theme.colors[i],
              pointStyle: i === 0 ? 'circle' : 'rectRot',
              pointRadius: 4,
            })),
          }}
        />
      </Space>
    )
  }
  const options = createChartJsOptions(theme)
  if (example.stacked && options.scales?.y) {
    options.scales.y.stacked = true
  }
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
            order: example.stacked ? index : -index,
            ...createChartJsDataset(theme, example.override ? 1 : index),
            ...(example.stacked
              ? {
                  fill: index === 0 ? ('origin' as const) : '-1',
                  backgroundColor: theme.colors[index],
                  borderColor: theme.backgroundColor,
                  borderWidth: 2,
                  borderDash: [],
                  pointRadius: 0,
                }
              : {}),
            ...(example.override
              ? { borderWidth: 4, pointRadius: 0, borderDash: [] }
              : {}),
          })),
        }}
      />
    </Space>
  )
}
