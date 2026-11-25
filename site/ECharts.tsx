import { useEffect, useRef } from 'react'
import { init, use as register } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import Space from '@dnb/eufemia/components/space/Space.js'
import {
  createEChartsOptions,
  createEChartsSeries,
} from '../dist/echarts/index.js'
import type { ChartTheme } from '../dist/theme.js'
import { labels, type Example } from './examples.js'

register([LineChart, GridComponent, SVGRenderer])

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
    chart.setOption({
      ...options,
      xAxis: { ...options.xAxis, data: labels },
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
        const seriesIndex = example.override ? 1 : index
        const series = createEChartsSeries(theme, seriesIndex)
        return {
          ...series,
          name: 'Series ' + (index + 1),
          data,
          ...(example.area
            ? {
                areaStyle: { color: theme.fills[seriesIndex], opacity: 1 },
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
    })
    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(element)
    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [example, theme])
  return <Space ref={ref} style={{ height: '16rem' }} />
}
