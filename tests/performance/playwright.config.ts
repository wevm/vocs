import { defineConfig, devices } from '@playwright/test'

const executablePath = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  use: {
    baseURL: 'http://localhost:4183',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm --filter performance-fixture build && pnpm --filter performance-fixture preview',
    cwd: '../..',
    url: 'http://localhost:4183',
    timeout: 300_000,
    reuseExistingServer: false,
  },
})
