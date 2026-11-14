/**
 * Custom mode: a host app that mounts Vocs. The Worker serves the Vocs handler under `/docs`
 * and the page renders `<Ask />`. `VOCS_MODEL=stand-in` builds with `vocs.config.test.ts` and
 * runs the stand-in model Worker beside the app Worker.
 * @module
 */
import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { vocs } from 'vocs/vite'
import { defineConfig } from 'vite'

const standIn = process.env.VOCS_MODEL === 'stand-in'

export default defineConfig({
  plugins: [
    cloudflare(
      standIn
        ? {
            auxiliaryWorkers: [{ configPath: '../../test/workers/model/wrangler.jsonc' }],
            configPath: './wrangler.test.jsonc',
          }
        : { configPath: './wrangler.jsonc' },
    ),
    react(),
    vocs({ config: standIn ? 'vocs.config.test.ts' : 'vocs.config.ts' }),
  ],
})
