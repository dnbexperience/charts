export const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const values = [20, 35, 30, 55, 60, 75]
export type Example = {
  id: string
  title: string
  description: string
  series: (number | null)[][]
  kind?: 'bar' | 'scatter' | 'pie' | 'donut'
  stacked?: boolean
  area?: boolean
  override?: boolean
}
const contributions = [
  [20, 25, 30, 25, 35, 40],
  [10, 15, 20, 15, 20, 25],
  [5, 10, 10, 15, 10, 15],
]

export const examples: Example[] = [
  {
    id: 'line',
    title: 'Line',
    description:
      'Straight lines, point markers, horizontal grid and axis labels.',
    series: [values],
  },
  {
    id: 'area',
    title: 'Area',
    description: 'A pale fill keeps the line and observations in focus.',
    series: [values],
    area: true,
  },
  {
    id: 'series',
    title: 'Four series',
    description:
      'Green, blue, purple and orange. Compare the same data in each library.',
    series: [
      values,
      [65, 60, 70, 65, 80, 90],
      [40, 45, 50, 40, 45, 55],
      [10, 15, 20, 25, 30, 35],
    ],
  },
  {
    id: 'areas',
    title: 'Four area fills',
    description: 'Each series uses its corresponding pale chart color.',
    series: [
      [75, 80, 75, 90, 85, 95],
      [55, 60, 55, 70, 65, 75],
      [35, 40, 35, 50, 45, 55],
      [15, 20, 15, 30, 25, 35],
    ],
    area: true,
  },
  {
    id: 'bars',
    title: 'Grouped bars',
    kind: 'bar',
    description:
      'Compare monthly contributions in thousands of NOK, with a zero baseline.',
    series: contributions,
  },
  {
    id: 'stacked-bars',
    title: 'Stacked bars',
    kind: 'bar',
    stacked: true,
    description:
      'Monthly contributions in thousands of NOK. Light boundaries separate the segments.',
    series: contributions,
  },
  {
    id: 'stacked-area',
    title: 'Stacked area',
    area: true,
    stacked: true,
    description:
      'Cumulative monthly contributions in thousands of NOK, with visible boundaries between series.',
    series: contributions,
  },
  {
    id: 'scatter',
    title: 'Scatter plot',
    kind: 'scatter',
    description:
      'Compare hours of effort (X) with output in units (Y). Numeric X positions preserve unequal intervals.',
    series: [
      [20, 35, 30, 55, 60, 75],
      [65, 60, 70, 65, 80, 90],
    ],
  },
  ...(['pie', 'donut'] as const).map((kind) => ({
    id: kind,
    title: kind === 'pie' ? 'Pie' : 'Donut',
    kind,
    description:
      'Three parts of a whole, labeled with their shares. Use bars when precise comparison matters.',
    series: [[55], [30], [15]],
  })),
  {
    id: 'gaps',
    title: 'Missing observations',
    description: 'March has no observation. The line leaves a gap.',
    series: [[20, 35, null, 55, 60, 75]],
  },
  {
    id: 'overrides',
    title: 'Local overrides',
    description:
      'A thicker blue line and percent labels, scoped to this chart.',
    series: [values],
    override: true,
  },
]

export const scatterX = [5, 12, 28, 45, 70, 90]
export const isRadial = (example: Example) =>
  example.kind === 'pie' || example.kind === 'donut'
export const exampleLabels = (example: Example) =>
  isRadial(example)
    ? ['Share']
    : example.kind === 'scatter'
      ? scatterX.map(String)
      : labels
export const seriesName = (example: Example, index: number) =>
  (isRadial(example) ? 'Part ' : 'Series ') + (index + 1)
export const exampleUnit = (example: Example) =>
  isRadial(example)
    ? 'percent of total'
    : example.kind === 'scatter'
      ? 'output in units'
      : example.kind === 'bar' || example.stacked
        ? 'thousands of NOK'
        : 'percent'
export const supportsExample = (library: string, example: Example) =>
  library !== 'chartist' ||
  (example.kind !== 'scatter' && example.id !== 'stacked-area')
