import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import Space from '@dnb/eufemia/components/space/Space.js'
import { lineChart } from 'chartist'
import { createLineChartOptions } from '../dist/chartist/index.js'
import { labels, type Example } from './examples.js'

export default function Chartist({ example }: { example: Example }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) {
      return
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
