import {
  ResponsiveContainer,
  LineChart,
  AreaChart,
  BarChart,
  ScatterChart,
  PieChart,
  Line,
  Area,
  Bar,
  Scatter,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import { createRechartsConfig } from '../dist/recharts/index.js'
import type { ChartTheme } from '../dist/theme.js'
import { labels, scatterX, isRadial, type Example } from './examples.js'

export default function Recharts({
  example,
  theme,
}: {
  example: Example
  theme: ChartTheme
}) {
  const config = createRechartsConfig(theme)
  const margin = { top: 16, right: 24, bottom: 8, left: 0 }
  if (isRadial(example)) {
    return (
      <ResponsiveContainer width="100%" height={256}>
        <PieChart style={config.style}>
          <Pie
            data={example.series.map((series, i) => ({
              name: 'Part ' + (i + 1),
              value: series[0],
            }))}
            dataKey="value"
            outerRadius={100}
            innerRadius={example.kind === 'donut' ? 50 : 0}
            stroke={theme.backgroundColor}
            strokeWidth={2}
            isAnimationActive={false}
            labelLine={false}
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              value,
            }) => {
              const angle = (-(midAngle ?? 0) * Math.PI) / 180
              const radius =
                Number(innerRadius) +
                (Number(outerRadius) - Number(innerRadius)) * 0.6
              return (
                <text
                  x={Number(cx) + radius * Math.cos(angle)}
                  y={Number(cy) + radius * Math.sin(angle)}
                  fill={theme.backgroundColor}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {value}%
                </text>
              )
            }}
          >
            {example.series.map((_, i) => (
              <Cell key={i} fill={theme.colors[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    )
  }
  if (example.kind === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height={256}>
        <ScatterChart style={config.style} margin={margin}>
          <CartesianGrid {...config.grid} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            {...config.axis}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            width={56}
            {...config.axis}
          />
          {example.series.map((series, i) => (
            <Scatter
              key={i}
              fill={theme.colors[i]}
              shape={i === 0 ? 'circle' : 'diamond'}
              isAnimationActive={false}
              data={series.map((y, j) => ({ x: scatterX[j], y }))}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    )
  }
  const data = labels.map((month, index) => ({
    month,
    ...Object.fromEntries(
      example.series.map((series, i) => ['series' + i, series[index]])
    ),
  }))
  const Chart =
    example.kind === 'bar'
      ? BarChart
      : example.area
        ? AreaChart
        : LineChart
  return (
    <ResponsiveContainer width="100%" height={256}>
      <Chart data={data} style={config.style} margin={margin}>
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
        {example.series.map((_, index) =>
          example.kind === 'bar' ? (
            <Bar
              key={index}
              dataKey={'series' + index}
              fill={theme.colors[index]}
              stroke={theme.backgroundColor}
              strokeWidth={2}
              stackId={example.stacked ? 'total' : undefined}
              isAnimationActive={false}
            />
          ) : example.area ? (
            <Area
              key={index}
              dataKey={'series' + index}
              {...config.series[index]}
              stackId={example.stacked ? 'total' : undefined}
              {...(example.stacked
                ? {
                    fill: theme.colors[index],
                    stroke: theme.backgroundColor,
                    strokeDasharray: '',
                    dot: false,
                  }
                : {})}
            />
          ) : (
            <Line
              key={index}
              dataKey={'series' + index}
              {...config.series[example.override ? 1 : index]}
              {...(example.override
                ? { strokeWidth: 4, dot: false, strokeDasharray: '' }
                : {})}
            />
          )
        )}
      </Chart>
    </ResponsiveContainer>
  )
}
