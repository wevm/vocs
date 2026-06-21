import '../styles/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Root_client } from '../react/Root.client.js'
import { ScrollRestoration } from '../react/ScrollRestoration.js'
import { App } from './App.js'
import { read } from './payload.js'
import { init } from './waku.js'

const payload = read()
init(payload)

const container = document.getElementById('vocs-openapi-root')
if (!container) throw new Error('[vocs] Missing #vocs-openapi-root container.')

createRoot(container).render(
  <StrictMode>
    <Root_client>
      <App payload={payload} />
      <ScrollRestoration />
    </Root_client>
  </StrictMode>,
)
