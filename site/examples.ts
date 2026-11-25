export const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const values = [20, 35, 30, 55, 60, 75]
export type Example = {
  id: string
  title: string
  description: string
  series: (number | null)[][]
  area?: boolean
  override?: boolean
}
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
