import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import { createRechartsConfig } from '../dist/recharts/index.js'
import type { ChartTheme } from '../dist/theme.js'
import { labels, type Example } from './examples.js'

export default function Recharts({
  example,
  theme,
}: {
  example: Example
  theme: ChartTheme
}) {
  const config = createRechartsConfig(theme)
  const Chart = example.area ? AreaChart : LineChart
  const Series = example.area ? Area : Line
  return (
    <ResponsiveContainer width="100%" height={256}>
      <Chart
        data={labels.map((month, index) => ({
          month,
          ...Object.fromEntries(
            example.series.map((series, i) => [
              'series' + i,
              series[index],
            ])
          ),
        }))}
        style={config.style}
        margin={{ top: 16, right: 24, bottom: 8, left: 0 }}
      >
        <CartesianGrid {...config.grid} />
        <XAxis dataKey="month" {...config.axis} />
        <YAxis
          domain={[0, 100]}
          width={56}
          {...config.axis}
          tickFormatter={
            example.override ? (value) => value + '%' : undefined
          }
        />
        {example.series.map((_, index) => (
          <Series
            key={index}
            dataKey={'series' + index}
            {...config.series[example.override ? 1 : index]}
            {...(example.override
              ? { strokeWidth: 4, dot: false, strokeDasharray: '' }
              : {})}
          />
        ))}
      </Chart>
    </ResponsiveContainer>
  )
}
