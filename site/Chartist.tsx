import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import Space from '@dnb/eufemia/components/space/Space.js'
import { lineChart, barChart, pieChart, type ChartPlugin } from 'chartist'
import {
  createLineChartOptions,
  createBarChartOptions,
  createPieChartOptions,
} from '../dist/chartist/index.js'
import { labels, isRadial, type Example } from './examples.js'

// Chartist draws bars and donut slices as strokes, so leave a light gap.
const segmentBoundaries: ChartPlugin = {
  name: 'segment-boundaries',
  install(chart) {
    chart.on('compose', (current) => {
      if (current.role === 'bar' && current.ctx.stacked) {
        return current.attr({
          y1: current.ctx.y1 - 1,
          y2: current.ctx.y2 + 1,
        })
      }
      if (
        current.role === 'slice' &&
        current.classes.includes('ct-slice-donut')
      ) {
        const { radius, startAngle, endAngle } = current.ctx
        const length = (radius * (endAngle - startAngle) * Math.PI) / 180
        return current.attr({
          pathLength: 100,
          'stroke-dasharray': 100 - 200 / length + ' 100',
        })
      }
    })
  },
}

export default function Chartist({ example }: { example: Example }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) {
      return
    }
    if (isRadial(example)) {
      const values = example.series.map((series) => series[0] ?? 0)
      const chart = pieChart(
        ref.current,
        { series: values },
        createPieChartOptions({
          height: 256,
          donut: example.kind === 'donut',
          donutWidth: 56,
          plugins: [segmentBoundaries],
          labelInterpolationFnc: (value) => value + '%',
        })
      )
      return () => chart.destroy()
    }
    if (example.kind === 'bar') {
      const chart = barChart(
        ref.current,
        { labels, series: example.series },
        createBarChartOptions({
          height: 256,
          high: 100,
          seriesBarDistance: 14,
          stackBars: example.stacked,
          stackMode: 'accumulate',
          plugins: [segmentBoundaries],
          axisY: { offset: 56, scaleMinSpace: 48 },
        })
      )
      return () => chart.destroy()
    }
    const chart = lineChart(
      ref.current,
      { labels, series: example.series },
      createLineChartOptions({
        height: 256,
        low: 0,
        high: 100,
        showArea: example.area,
        showPoint: !example.override,
        axisY: {
          offset: 56,
          scaleMinSpace: 48,
          ...(example.override
            ? { labelInterpolationFnc: (value) => value + '%' }
            : {}),
        },
      })
    )
    return () => chart.destroy()
  }, [example])
  return (
    <Space
      ref={ref}
      className="dnb-chartist"
      style={
        example.override
          ? ({
              '--ct-series-a': 'var(--chart-color-blue-700, #1955a9)',
              '--ct-line-width': '0.25rem',
            } as CSSProperties)
          : undefined
      }
    />
  )
}
