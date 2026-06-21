import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Handler } from 'vocs/server'

/**
 * Standalone OpenAPI reference mounted on a Hono server. Demonstrates the
 * `Handler.openApi` integration independent of the Vocs site/Waku app.
 *
 * Run with: `pnpm --filter playground dev:server`
 */
const app = new Hono()

app.get('/', (c) => c.redirect('/docs'))

app.route(
  '/docs',
  Handler.openApi({
    spec: 'https://cadent.tempo.xyz/openapi.json',
  }),
)

const port = Number(process.env.PORT ?? 5199)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`OpenAPI reference on http://localhost:${info.port}/docs`)
})
