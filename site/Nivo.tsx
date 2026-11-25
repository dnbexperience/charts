import { useId } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveScatterPlot } from '@nivo/scatterplot'
import { ResponsivePie } from '@nivo/pie'
import Space from '@dnb/eufemia/components/space/Space.js'
import { createNivoConfig, createNivoTheme } from '../dist/nivo/index.js'
import type { ChartTheme } from '../dist/theme.js'
import { labels, scatterX, isRadial, type Example } from './examples.js'

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
  const common = {
    theme: createNivoTheme(theme),
    colors: theme.colors,
    animate: false,
    isInteractive: false,
    margin: { top: 16, right: 24, bottom: 40, left: 56 },
  }
  if (isRadial(example)) {
    return (
      <Space style={{ height: '16rem' }}>
        <ResponsivePie
          {...common}
          margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
          data={example.series.map((series, i) => ({
            id: 'Part ' + (i + 1),
            value: series[0] ?? 0,
          }))}
          innerRadius={example.kind === 'donut' ? 0.5 : 0}
          sortByValue={false}
          borderWidth={2}
          borderColor={theme.backgroundColor}
          enableArcLinkLabels={false}
          arcLabel={(datum) => datum.value + '%'}
          arcLabelsTextColor={theme.backgroundColor}
        />
      </Space>
    )
  }
  if (example.kind === 'bar') {
    return (
      <Space style={{ height: '16rem' }}>
        <ResponsiveBar
          {...common}
          data={labels.map((month, i) => ({
            month,
            ...Object.fromEntries(
              example.series.map((series, j) => [
                'series' + j,
                series[i] ?? 0,
              ])
            ),
          }))}
          keys={example.series.map((_, i) => 'series' + i)}
          indexBy="month"
          groupMode={example.stacked ? 'stacked' : 'grouped'}
          valueScale={{ type: 'linear', min: 0, max: 100 }}
          padding={0.25}
          innerPadding={2}
          enableLabel={false}
          borderWidth={2}
          borderColor={theme.backgroundColor}
          axisBottom={{ tickSize: 0, tickPadding: 12 }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 12,
            tickValues: [0, 25, 50, 75, 100],
          }}
          gridYValues={[0, 25, 50, 75, 100]}
        />
      </Space>
    )
  }
  if (example.kind === 'scatter') {
    return (
      <Space style={{ height: '16rem' }}>
        <ResponsiveScatterPlot
          {...common}
          data={example.series.map((series, i) => ({
            id: 'Series ' + (i + 1),
            data: series.map((y, j) => ({ x: scatterX[j], y: y! })),
          }))}
          xScale={{ type: 'linear', min: 0, max: 100 }}
          yScale={{ type: 'linear', min: 0, max: 100 }}
          enableGridX={false}
          nodeSize={8}
          nodeComponent={({ node }) => (
            <path
              transform={'translate(' + node.x + ',' + node.y + ')'}
              d={
                node.serieId === 'Series 1'
                  ? 'M-4,0a4,4 0 1,0 8,0a4,4 0 1,0 -8,0'
                  : 'M0,-5L5,0L0,5L-5,0Z'
              }
              fill={node.color}
            />
          )}
          axisBottom={{ tickSize: 0, tickPadding: 12 }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 12,
            tickValues: [0, 25, 50, 75, 100],
          }}
          gridYValues={[0, 25, 50, 75, 100]}
        />
      </Space>
    )
  }
  if (example.area && !example.stacked) {
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
        yScale={{
          type: 'linear',
          min: 0,
          max: 100,
          stacked: example.stacked,
        }}
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
            {
              offset: 0,
              color: example.stacked
                ? theme.colors[index]
                : theme.fills[index],
            },
            {
              offset: 100,
              color: example.stacked
                ? theme.colors[index]
                : theme.fills[index],
            },
          ],
        }))}
        fill={indices.map((_, i) => ({
          match: { id: 'Series ' + (i + 1) },
          id: fillId + '-fill-' + i,
        }))}
        lineWidth={example.override ? 4 : 2}
        enablePoints={!example.override && !example.stacked}
        {...(example.stacked
          ? { lineWidth: 2, colors: [theme.backgroundColor] }
          : {})}
      />
    </Space>
  )
}
