/**
 * The host app's page, which places the Vocs prompt box in its own layout.
 * @module
 */
import { createRoot } from 'react-dom/client'
import { Ask } from 'vocs/react'

createRoot(document.getElementById('root')!).render(
  <>
    <h1>Playground</h1>
    <Ask basePath="/docs" label="What do you want to learn?" />
  </>,
)
