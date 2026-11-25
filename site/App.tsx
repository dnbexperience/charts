import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Accordion from '@dnb/eufemia/components/accordion/Accordion.js'
import Anchor from '@dnb/eufemia/components/anchor/Anchor.js'
import Breadcrumb from '@dnb/eufemia/components/breadcrumb/Breadcrumb.js'
import { Card } from '@dnb/eufemia/components/card/Card.js'
import Flex from '@dnb/eufemia/components/flex/Flex.js'
import Grid from '@dnb/eufemia/components/grid/Grid.js'
import Space from '@dnb/eufemia/components/space/Space.js'
import Switch from '@dnb/eufemia/components/switch/Switch.js'
import type { SwitchOnChangeParams } from '@dnb/eufemia/components/switch/types.js'
import Table, { Th, Td, Tr } from '@dnb/eufemia/components/table/Table.js'
import H1 from '@dnb/eufemia/elements/H1.js'
import H2 from '@dnb/eufemia/elements/H2.js'
import H3 from '@dnb/eufemia/elements/H3.js'
import Li from '@dnb/eufemia/elements/Li.js'
import P from '@dnb/eufemia/elements/P.js'
import SidebarMenu from '@dnb/eufemia/extensions/sidebar-menu/SidebarMenu.js'
import home from '@dnb/eufemia/icons/home.js'
import graph from '@dnb/eufemia/icons/graph_increase.js'
import Theme from '@dnb/eufemia/shared/Theme.js'
import { readChartTheme, type ChartTheme } from '../dist/theme.js'
import { examples, labels, type Example } from './examples.js'

const libraries = [
  {
    key: 'chartist',
    title: 'Chartist',
    description:
      'Small SVG charts with scoped CSS and a browser lifecycle. Use it in a React effect.',
    href: 'https://chartist.dev/',
    Chart: lazy(() => import('./Chartist.js')),
  },
  {
    key: 'recharts',
    title: 'Recharts',
    description:
      'Compose SVG charts with React components. A useful starting point for application charts.',
    href: 'https://recharts.org/',
    Chart: lazy(() => import('./Recharts.js')),
  },
  {
    key: 'chart-js',
    title: 'Chart.js',
    description:
      'Canvas charts with the react-chartjs-2 adapter. Useful when SVG point counts become costly.',
    href: 'https://react-chartjs-2.js.org/',
    Chart: lazy(() => import('./ChartJs.js')),
  },
  {
    key: 'nivo',
    title: 'Nivo',
    description:
      'React charts built on D3, with declarative themes and SVG or canvas renderers. This preview uses SVG.',
    href: 'https://nivo.rocks/line/',
    Chart: lazy(() => import('./Nivo.js')),
  },
  {
    key: 'echarts',
    title: 'Apache ECharts',
    description:
      'A broad chart engine for richer visualizations. Use its browser lifecycle in a React effect; this preview selects the SVG renderer.',
    href: 'https://echarts.apache.org/handbook/en/get-started/',
    Chart: lazy(() => import('./ECharts.js')),
  },
]
type Library = (typeof libraries)[number]
const title = (key: string) =>
  libraries.find((library) => library.key === key)?.title ?? 'Overview'
const selectedPage = () =>
  libraries.some(({ key }) => key === location.hash.slice(1))
    ? location.hash.slice(1)
    : 'overview'

function DataTable({ example }: { example: Example }) {
  return (
    <Accordion variant="tertiary" title="View data" top="small">
      <Table.ScrollView top="small">
        <Table size="small">
          <caption>{example.title} – values in percent</caption>
          <thead>
            <Tr>
              <Th scope="col">Month</Th>
              {example.series.map((_, index) => (
                <Th scope="col" key={index}>
                  Series {index + 1}
                </Th>
              ))}
            </Tr>
          </thead>
          <tbody>
            {labels.map((label, index) => (
              <Tr key={label}>
                <Th scope="row">{label}</Th>
                {example.series.map((series, seriesIndex) => (
                  <Td key={seriesIndex}>
                    {series[index] ?? 'No observation'}
                  </Td>
                ))}
              </Tr>
            ))}
          </tbody>
        </Table>
      </Table.ScrollView>
    </Accordion>
  )
}

function ChartPreview({
  example,
  library,
}: {
  example: Example
  library: Library
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<ChartTheme>()
  useEffect(() => {
    if (ref.current) {
      setTheme(readChartTheme(ref.current))
    }
  }, [])
  const Chart = library.Chart
  return (
    <Card
      className="dnb-chart-gallery__example"
      aria-labelledby={example.id}
      align="stretch"
    >
      <H3 id={example.id}>{example.title}</H3>
      <P size="small">{example.description}</P>
      <Space
        ref={ref}
        className="dnb-chart-gallery__plot"
        data-example={example.id}
        aria-hidden="true"
      >
        {theme && (
          <Suspense fallback={<P>Loading chart…</P>}>
            <Chart example={example} theme={theme} />
          </Suspense>
        )}
      </Space>
      {example.series.length > 1 && (
        <Flex.Container
          element="ul"
          layoutEngine="css"
          className={
            'dnb-chart-gallery__legend' +
            (library.key === 'nivo'
              ? ' dnb-chart-gallery__legend--solid'
              : '')
          }
          gap="small"
          rowGap="x-small"
          aria-label="Series"
          role="list"
        >
          {example.series.map((_, index) => (
            <Li key={index}>Series {index + 1}</Li>
          ))}
        </Flex.Container>
      )}
      <DataTable example={example} />
    </Card>
  )
}

function Gallery({ library }: { library: Library }) {
  return (
    <Space>
      <P>{library.description}</P>

      <Card top="medium">
        <H2>Preview colors</H2>
        <P>
          These examples use Eufemia's alpha chart palette. Applications
          can override the chart color properties. The palette may change
          as the chart guidelines develop.
        </P>
      </Card>
      <P top="medium">
        <Anchor href={library.href}>{library.title} documentation</Anchor>
      </P>
      <Grid.Container
        columns={{ small: 1, medium: 1, large: 2 }}
        rowGap="medium"
        columnGap="medium"
        top="large"
      >
        {examples.map((example) => (
          <ChartPreview
            key={example.id}
            example={example}
            library={library}
          />
        ))}
      </Grid.Container>
    </Space>
  )
}

function Overview() {
  return (
    <Flex.Stack layoutEngine="css" gap="medium">
      <P>
        Compare five React-compatible chart libraries using the same
        Eufemia styling and data. Choose a library in the sidebar to
        preview lines, area fills, four series, missing observations and
        local overrides.
      </P>
      <P>
        The package provides configuration and theme values. Install the
        chart library your application needs. Recharts and Nivo use React
        components; Chart.js uses react-chartjs-2; Chartist and ECharts are
        created in an effect and cleaned up on unmount.
      </P>
      <Grid.Container
        columns={{ small: 1, medium: 1, large: 2 }}
        rowGap="medium"
        columnGap="medium"
      >
        {libraries.map((library) => (
          <Card key={library.key} align="stretch">
            <H2>{library.title}</H2>
            <P>{library.description}</P>
            <Anchor href={'#' + library.key}>
              Preview {library.title}
            </Anchor>
          </Card>
        ))}
      </Grid.Container>
      <P>
        These are practical options with different rendering and
        composition models, rather than a universal ranking. The line-chart
        presets are a starting point. Each example includes a data table;
        keyboard interaction, tooltips and larger datasets need validation
        in the consuming application.
      </P>
    </Flex.Stack>
  )
}

export default function App() {
  const [selectedKey, setSelectedKey] = useState(selectedPage)
  const [dark, setDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const library = libraries.find(({ key }) => key === selectedKey)
  useEffect(() => {
    const update = () => {
      setSelectedKey(selectedPage())
      setMenuOpen(false)
      window.scrollTo(0, 0)
      requestAnimationFrame(() =>
        heading.current?.focus({ preventScroll: true })
      )
    }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  const navigation = (location: string) => (
    <SidebarMenu.Root
      aria-label="Chart libraries"
      selectedItem={location + '-' + selectedKey}
    >
      <SidebarMenu.Item
        id={location + '-overview'}
        text="Overview"
        icon={home}
        href="#overview"
        onClick={() => setMenuOpen(false)}
      />
      {libraries.map(({ key, title }) => (
        <SidebarMenu.Item
          key={key}
          id={location + '-' + key}
          text={title}
          icon={graph}
          href={'#' + key}
          onClick={() => setMenuOpen(false)}
        />
      ))}
    </SidebarMenu.Root>
  )
  return (
    <Theme
      colorScheme={dark ? 'dark' : 'light'}
      className="dnb-chart-gallery-theme"
    >
      <SidebarMenu.ResponsiveProvider
        scopeId="chart-gallery"
        drawerAt="medium"
        compactAt="large"
        open={menuOpen}
        onOpenChange={setMenuOpen}
      >
        <SidebarMenu.ResponsiveShell>
          <SidebarMenu.ResponsiveAside
            expandedWidth="15rem"
            compactWidth="4rem"
          >
            {navigation('inline')}
          </SidebarMenu.ResponsiveAside>
          <Space className="dnb-chart-gallery__workspace">
            <Flex.Container
              element="header"
              layoutEngine="css"
              align="center"
              justify="space-between"
              innerSpace="small"
            >
              <Flex.Container layoutEngine="css" align="center">
                <SidebarMenu.ResponsiveTrigger text="Menu" />
                <P space={0} weight="medium">
                  Eufemia charts
                </P>
              </Flex.Container>
              <Switch
                label="Dark appearance"
                checked={dark}
                onChange={({ checked }: SwitchOnChangeParams) =>
                  setDark(checked)
                }
              />
            </Flex.Container>
            <Space
              element="main"
              className="dnb-chart-gallery"
              innerSpace={{
                small: 'small',
                medium: 'large',
                large: 'large',
              }}
            >
              <Breadcrumb bottom="medium">
                <Breadcrumb.Item
                  text="Charts"
                  href="#overview"
                  variant={library ? 'home' : 'current'}
                />
                {library && (
                  <Breadcrumb.Item
                    text={library.title}
                    variant="current"
                  />
                )}
              </Breadcrumb>
              <H1 ref={heading} tabIndex={-1} bottom="medium">
                {title(selectedKey)}
              </H1>
              {library ? (
                <Gallery key={library.key} library={library} />
              ) : (
                <Overview />
              )}
            </Space>
          </Space>
        </SidebarMenu.ResponsiveShell>
        <SidebarMenu.ResponsiveDrawer dialogTitle="Chart libraries">
          {navigation('drawer')}
        </SidebarMenu.ResponsiveDrawer>
      </SidebarMenu.ResponsiveProvider>
    </Theme>
  )
}
