/**
 * Configures the end-to-end suites. Each run builds the `vocs` package, then serves the
 * production build of the custom-mode playground with the stand-in model Worker.
 * @module
 */
import { defineConfig, devices } from '@playwright/test'

const port = 5180

export default defineConfig({
  forbidOnly: !!process.env.CI,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: process.env.CI ? 'github' : 'list',
  testDir: './test/e2e',
  testMatch: '**/*.e2e.ts',
  use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
  webServer: {
    command: `pnpm build && pnpm --dir playground/custom build && pnpm --dir playground/custom preview --port ${port} --strictPort`,
    env: { VOCS_MODEL: 'stand-in' },
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
