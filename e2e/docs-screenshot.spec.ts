import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.resolve(__dirname, '../docs/images/screenshot.png')
const sampleImage = path.resolve(__dirname, 'fixtures/readme-sample.jpg')
const realVisualizations = path.resolve(__dirname, '../src/assets/visualizations.json')

/**
 * Captures the annotate workspace for the README.
 * Run via: `pnpm docs:screenshot` (excluded from default e2e).
 *
 * Uses production metadata with empty annotations, rewrites download URLs to
 * HTTPS so the local sample plate can stub image fetches offline.
 */
test('capture annotate overview for README', async ({ page }) => {
  test.setTimeout(180_000)
  await page.addInitScript(() => {
    const key = (storeId: string): string => `image-classification-labeler:${storeId}`
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('color-schema', 'light')
    window.localStorage.setItem(key('user'), JSON.stringify({
      name: 'Reviewer',
      uuid: '11111111-1111-4111-8111-111111111111',
    }))
    window.localStorage.setItem(key('selectors'), JSON.stringify({ selectors: [] }))
  })
  await page.route('**/*.{jpg,jpeg,png,webp}', async (route) => {
    const url = route.request().url()
    if (url.includes('127.0.0.1') || url.includes('localhost')) {
      await route.continue()
      return
    }
    await route.fulfill({ path: sampleImage, contentType: 'image/jpeg' })
  })
  await page.route(/annotations(?:-[^/]+)?\.json(?:\?.*)?$/, async (route) => {
    if (new URL(route.request().url()).searchParams.has('import')) {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    })
  })
  await page.route(/visualizations(?:-[^/]+)?\.json(?:\?.*)?$/, async (route) => {
    if (new URL(route.request().url()).searchParams.has('import')) {
      await route.continue()
      return
    }
    const raw = JSON.parse(fs.readFileSync(realVisualizations, 'utf8')) as Array<{
      downloadUrl?: string | null
    }>
    for (const entry of raw) {
      entry.downloadUrl = 'https://readme.local/sample.jpg'
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(raw),
    })
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByTestId('entries-stats').waitFor({ state: 'visible', timeout: 180_000 })
  await page.getByRole('button', { name: 'Vis', exact: true }).waitFor({ state: 'visible' })
  await page.getByText('Hi, Reviewer').waitFor({ state: 'visible', timeout: 10_000 })
  const img = page.locator('img').first()
  await img.waitFor({ state: 'visible', timeout: 30_000 })
  await expect.poll(async () => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  await expect(page.getByText('served over HTTP')).toHaveCount(0)
  await new Promise((r) => setTimeout(r, 500))

  await page.screenshot({
    path: outPath,
    type: 'png',
    animations: 'disabled',
  })
})
