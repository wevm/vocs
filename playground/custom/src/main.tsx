/**
 * The host app's pages. `/` renders the Vocs docs app, and `/console` places only the prompt box
 * in the host's own layout.
 * @module
 */
import { createRoot } from 'react-dom/client'
import { Ask, Docs } from 'vocs/react'
import 'vocs/styles.css'

createRoot(document.getElementById('root')!).render(
  location.pathname === '/console' ? (
    <>
      <h1>Console</h1>
      <Ask basePath="/docs" label="What do you want to learn?" />
    </>
  ) : (
    <Docs basePath="/docs" title="Tempo" />
  ),
)
