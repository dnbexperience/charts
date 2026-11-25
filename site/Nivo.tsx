import { useId } from 'react'
import { ResponsiveLine } from '@nivo/line'
import Space from '@dnb/eufemia/components/space/Space.js'
import { createNivoConfig } from '../dist/nivo/index.js'
import type { ChartTheme } from '../dist/theme.js'
import { labels, type Example } from './examples.js'

export default function Nivo({
  example,
  theme,
}: {
  example: Example
  theme: ChartTheme
}) {
  const fillId = useId()
  const indices = example.series.map((_, index) =>
    example.override ? 1 : index
  )
  const data = example.series.map((series, index) => ({
    id: 'Series ' + (index + 1),
    color: theme.colors[indices[index]],
    data: series.map((y, i) => ({ x: labels[i], y })),
  }))
  if (example.area) {
    // Nivo draws areas in reverse series order.
    data.reverse()
  }
  return (
    <Space style={{ height: '16rem' }}>
      <ResponsiveLine
        {...createNivoConfig(theme)}
        data={data}
        colors={(series) => series.color}
        margin={{ top: 16, right: 24, bottom: 40, left: 56 }}
        yScale={{ type: 'linear', min: 0, max: 100 }}
        axisBottom={{ tickSize: 0, tickPadding: 12 }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 12,
          tickValues: [0, 25, 50, 75, 100],
          format: example.override ? (value) => value + '%' : undefined,
        }}
        gridYValues={[0, 25, 50, 75, 100]}
        enableArea={example.area}
        areaOpacity={1}
        defs={indices.map((index, i) => ({
          id: fillId + '-fill-' + i,
          type: 'linearGradient',
          colors: [
            { offset: 0, color: theme.fills[index] },
            { offset: 100, color: theme.fills[index] },
          ],
        }))}
        fill={indices.map((_, i) => ({
          match: { id: 'Series ' + (i + 1) },
          id: fillId + '-fill-' + i,
        }))}
        lineWidth={example.override ? 4 : 2}
        enablePoints={!example.override}
      />
    </Space>
  )
}
