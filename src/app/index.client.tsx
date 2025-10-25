import './styles/index.css.js'

import { NuqsAdapter } from 'nuqs/adapters/react'
import { hydrateRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { ConfigProvider, getConfig } from './hooks/useConfig.js'
import { routes } from './routes.js'
import { hydrateLazyRoutes } from './utils/hydrateLazyRoutes.js'
import { removeTempStyles } from './utils/removeTempStyles.js'

hydrate()

async function hydrate() {
  const basePath = getConfig().basePath

  await hydrateLazyRoutes(routes, basePath)
  removeTempStyles()

  const router = createBrowserRouter(routes, { basename: basePath })
  hydrateRoot(
    document.getElementById('app')!,
    <ConfigProvider>
      <NuqsAdapter>
        <RouterProvider router={router} />
      </NuqsAdapter>
    </ConfigProvider>,
  )
}
