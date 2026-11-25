import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Provider from '@dnb/eufemia/shared/Provider.js'
import '@dnb/eufemia/style/index.js'
import '@dnb/eufemia/style/themes/ui/ui-theme-dark-mode.min.css'
import '@dnb/eufemia/extensions/sidebar-menu/style.js'
import 'virtual:charts-preview-theme'
import '../dist/chartist/styles.css'
import './styles.scss'
import App from './App.js'

const root = document.querySelector('#root')
if (!root) {
  throw new Error('Missing application root.')
}

createRoot(root).render(
  <StrictMode>
    <Provider locale="en-GB">
      <App />
    </Provider>
  </StrictMode>
)
