import type { ComponentProps, ReactElement } from 'react'
import Accordion from '@dnb/eufemia/components/accordion/Accordion.js'
import Anchor from '@dnb/eufemia/components/anchor/Anchor.js'
import Space from '@dnb/eufemia/components/space/Space.js'
import Table, { Th, Td, Tr } from '@dnb/eufemia/components/table/Table.js'
import Code from '@dnb/eufemia/elements/Code.js'
import H2 from '@dnb/eufemia/elements/H2.js'
import H3 from '@dnb/eufemia/elements/H3.js'
import H4 from '@dnb/eufemia/elements/H4.js'
import Li from '@dnb/eufemia/elements/Li.js'
import Ol from '@dnb/eufemia/elements/Ol.js'
import P from '@dnb/eufemia/elements/P.js'
import Ul from '@dnb/eufemia/elements/Ul.js'
import Content from '../README.md'

const components = {
  h1: H2,
  h2: H3,
  h3: H4,
  p: P,
  code: Code,
  ul: Ul,
  ol: Ol,
  li: Li,
  th: Th,
  td: Td,
  tr: Tr,
  a: ({ href, ...props }: ComponentProps<typeof Anchor>) => (
    <Anchor
      {...props}
      href={
        href && !/^(?:https?:|#)/.test(href)
          ? 'https://github.com/dnbexperience/charts/blob/main/' + href
          : href
      }
    />
  ),
  pre: ({
    children,
  }: {
    children: ReactElement<{ children: string }>
  }) => (
    <Space
      element="pre"
      className="dnb-pre"
      tabIndex={0}
      aria-label="Code example"
    >
      <Space element="code">{children.props.children}</Space>
    </Space>
  ),
  table: (props: ComponentProps<typeof Table>) => (
    <Table.ScrollView aria-label="Chart library integrations">
      <Table {...props} size="small" />
    </Table.ScrollView>
  ),
}

export default function Readme() {
  return (
    <Accordion
      className="dnb-chart-gallery__instructions"
      variant="tertiary"
      title="Installation and usage"
      top="medium"
    >
      <Space className="dnb-chart-gallery__readme dnb-spacing" top="small">
        <Content components={components} />
      </Space>
    </Accordion>
  )
}
