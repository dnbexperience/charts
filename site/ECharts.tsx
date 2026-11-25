import { useEffect, useRef } from 'react'
import { init, use as register } from 'echarts/core'
import {
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
} from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import Space from '@dnb/eufemia/components/space/Space.js'
import {
  createEChartsOptions,
  createEChartsSeries,
} from '../dist/echarts/index.js'
import type { ChartTheme } from '../dist/theme.js'
import { labels, scatterX, isRadial, type Example } from './examples.js'

register([
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
  GridComponent,
  SVGRenderer,
])

export default function ECharts({
  example,
  theme,
}: {
  example: Example
  theme: ChartTheme
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }
    const chart = init(element, undefined, { renderer: 'svg' })
    const options = createEChartsOptions(theme)
    chart.setOption(
      isRadial(example)
        ? {
            color: theme.colors,
            backgroundColor: theme.backgroundColor,
            textStyle: options.textStyle,
            animation: false,
            series: [
              {
                type: 'pie',
                radius: example.kind === 'donut' ? ['40%', '80%'] : '80%',
                data: example.series.map((series, i) => ({
                  name: 'Part ' + (i + 1),
                  value: series[0],
                })),
                label: {
                  position: 'inside',
                  formatter: '{c}%',
                  color: theme.backgroundColor,
                  fontSize: 16,
                },
                itemStyle: {
                  borderWidth: 2,
                  borderColor: theme.backgroundColor,
                },
                emphasis: { disabled: true },
                selectedMode: false,
              },
            ],
          }
        : {
            ...options,
            xAxis:
              example.kind === 'scatter'
                ? {
                    ...options.yAxis,
                    type: 'value',
                    min: 0,
                    max: 100,
                    splitLine: { show: false },
                  }
                : {
                    ...options.xAxis,
                    data: labels,
                    boundaryGap: example.kind === 'bar',
                  },
            yAxis: {
              ...options.yAxis,
              min: 0,
              max: 100,
              axisLabel: {
                ...options.yAxis.axisLabel,
                formatter: example.override ? '{value}%' : '{value}',
              },
            },
            series: example.series.map((data, index) => {
              if (example.kind === 'bar' || example.kind === 'scatter') {
                return {
                  type: example.kind,
                  name: 'Series ' + (index + 1),
                  data:
                    example.kind === 'scatter'
                      ? data.map((y, i) => [scatterX[i], y])
                      : data,
                  stack: example.stacked ? 'total' : undefined,
                  symbol: index === 0 ? 'circle' : 'diamond',
                  symbolSize: 8,
                  itemStyle: {
                    color: theme.colors[index],
                    borderColor: theme.backgroundColor,
                    borderWidth: example.kind === 'bar' ? 2 : 0,
                  },
                  emphasis: { disabled: true },
                }
              }
              const seriesIndex = example.override ? 1 : index
              const series = createEChartsSeries(theme, seriesIndex)
              return {
                ...series,
                name: 'Series ' + (index + 1),
                data,
                ...(example.area
                  ? {
                      areaStyle: {
                        color: example.stacked
                          ? theme.colors[seriesIndex]
                          : theme.fills[seriesIndex],
                        opacity: 1,
                      },
                      ...(example.stacked
                        ? {
                            stack: 'total',
                            showSymbol: false,
                            lineStyle: {
                              color: theme.backgroundColor,
                              width: 2,
                              type: 'solid',
                            },
                          }
                        : {}),
                    }
                  : {}),
                ...(example.override
                  ? {
                      showSymbol: false,
                      lineStyle: {
                        ...series.lineStyle,
                        width: 4,
                        type: 'solid',
                      },
                    }
                  : {}),
              }
            }),
          }
    )
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(element)
    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [example, theme])
  return <Space ref={ref} style={{ height: '16rem' }} />
}
