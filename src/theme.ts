export type ChartTheme = {
  colors: [string, string, string, string]
  fills: [string, string, string, string]
  fontFamily: string
  textColor: string
  gridColor: string
  backgroundColor: string
}

/** Resolve CSS colors before passing them to SVG or canvas libraries. */
export function readChartTheme(element: Element): ChartTheme {
  const view = element.ownerDocument.defaultView
  if (!view) {
    throw new Error('Chart themes require a browser document.')
  }
  const probe = element.ownerDocument.createElement('span')
  probe.hidden = true
  element.appendChild(probe)
  const style = view.getComputedStyle(probe)
  const color = (property: string, fallback?: string) => {
    probe.style.color =
      'var(' + property + (fallback ? ', ' + fallback : '') + ')'
    return style.color
  }
  try {
    return {
      colors: [
        color('--chart-color-tertiary-solid', '#007b5e'),
        color('--chart-color-blue-700', '#1955a9'),
        color('--chart-color-purple-700', '#3c3caa'),
        color('--chart-color-orange-700', '#cc4300'),
      ],
      fills: [
        color('--chart-color-tertiary-outline-fill', '#ebf4f2'),
        color('--chart-color-blue-100', '#e1e9f9'),
        color('--chart-color-purple-100', '#e4e4f1'),
        color('--chart-color-orange-100', '#ffeae0'),
      ],
      fontFamily: style.fontFamily,
      textColor: color('--color-black-80'),
      gridColor: color('--color-black-20'),
      backgroundColor: color('--color-white'),
    }
  } finally {
    probe.remove()
  }
}
