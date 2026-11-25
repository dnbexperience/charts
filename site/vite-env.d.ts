/// <reference types="vite/client" />
declare module 'virtual:charts-preview-theme'
declare module '*.md' {
  import type { ComponentType } from 'react'
  const Content: ComponentType<{ components?: Record<string, unknown> }>
  export default Content
}
