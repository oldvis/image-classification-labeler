import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const rootDir = path.dirname(fileURLToPath(import.meta.url))
const viteBin = path.join(rootDir, 'node_modules', '.bin', 'vite')

// Playwright's webServer readiness probe honors HTTP(S)_PROXY. With a local
// proxy (e.g. Clash), checks to 127.0.0.1 can fail even after Vite is up.
const localHosts = '127.0.0.1,localhost,[::1]'
for (const key of ['NO_PROXY', 'no_proxy'] as const) {
  const current = process.env[key]
  process.env[key] = current ? `${current},${localHosts}` : localHosts
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 120_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Absolute path: Playwright's spawned shell may not have node_modules/.bin on PATH.
    command: `"${viteBin}" --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
