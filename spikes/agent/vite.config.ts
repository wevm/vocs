/**
 * Builds the Spike A page and Worker. `VOCS_MODEL=stand-in` routes model requests to the
 * stand-in model Worker, which runs beside the page Worker.
 * @module
 */
import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'

const standIn = process.env.VOCS_MODEL === 'stand-in'

export default defineConfig({
  // sqlite-wasm locates its own .wasm file, which prebundling moves.
  optimizeDeps: { exclude: ['@sqlite.org/sqlite-wasm'] },
  plugins: [
    cloudflare(
      standIn
        ? {
            auxiliaryWorkers: [{ configPath: '../../test/workers/model/wrangler.jsonc' }],
            configPath: './wrangler.test.jsonc',
          }
        : { configPath: './wrangler.jsonc' },
    ),
  ],
})
