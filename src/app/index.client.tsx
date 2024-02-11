import './styles/index.css.js'

import { hydrateRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ConfigProvider } from './hooks/useConfig.js'
import { routes } from './routes.js'
import { hydrateLazyRoutes } from './utils/hydrateLazyRoutes.js'
import { removeTempStyles } from './utils/removeTempStyles.js'

hydrate()

async function hydrate() {
  const basename = getBasename()

  await hydrateLazyRoutes(routes, basename)
  removeTempStyles()

  const router = createBrowserRouter(routes, { basename })
  hydrateRoot(
    document.getElementById('app')!,
    <ConfigProvider>
      <RouterProvider router={router} />
    </ConfigProvider>,
  )
}

function getBasename() {
  const ogUrlMeta = document.querySelector('meta[property="og:url"]')
  return ogUrlMeta?.getAttribute?.('content') || undefined
}
