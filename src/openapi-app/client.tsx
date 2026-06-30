import '../styles/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Root_client } from '../react/Root.client.js'
import { ScrollRestoration } from '../react/ScrollRestoration.js'
import { App } from './App.js'
import { read } from './payload.js'
import { init, RouterProvider } from './waku.js'

const payload = read()
init(payload)

// Render straight into `<body>` — exactly where a normal Vocs app mounts its
// layout (see `react/Root.tsx`: `<body><Root_client>{children}</Root_client>`).
// No bespoke wrapper element; the layout's root becomes a direct child of body
// so the DOM matches a genuine Vocs site 1:1. The render-blocking stylesheet
// stays in the server-sent `<head>`, so there is no flash of unstyled content.
createRoot(document.body).render(
  <StrictMode>
    <RouterProvider>
      <Root_client>
        <App payload={payload} />
        <ScrollRestoration />
      </Root_client>
    </RouterProvider>
  </StrictMode>,
)
