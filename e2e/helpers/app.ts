import type { Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tinyPng = path.resolve(__dirname, '../fixtures/tiny.png')
const miniVisualizations = path.resolve(__dirname, '../fixtures/visualizations-mini.json')

/** Stub remote image fetches with a local PNG. */
export async function stubRemoteImages(page: Page): Promise<void> {
  await page.route('**/*.{jpg,jpeg,png,webp}', async (route) => {
    const url = route.request().url()
    if (url.includes('127.0.0.1') || url.includes('localhost')) {
      await route.continue()
      return
    }
    await route.fulfill({ path: tinyPng, contentType: 'image/png' })
  })
}

/**
 * Reset persisted Pinia state.
 * Pre-sign-in so `useSignInNotice` does not leave an infinite error toast.
 */
export async function clearAppStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const key = (storeId: string): string => `image-classification-labeler:${storeId}`
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem(key('user'), JSON.stringify({
      name: 'e2e',
      uuid: '11111111-1111-4111-8111-111111111111',
    }))
    window.localStorage.setItem(key('message'), JSON.stringify({ messages: [] }))
    window.localStorage.setItem(key('selectors'), JSON.stringify({ selectors: [] }))
  })
}

/** Vite `*.json?url` resolves via `?import` module requests — never stub those. */
const isViteJsonUrlImport = (url: string): boolean => {
  try {
    return new URL(url).searchParams.has('import')
  }
  catch {
    return false
  }
}

/**
 * Keep e2e fast/deterministic: tiny visualization catalog + empty annotation seed.
 * Only intercepts runtime `fetch()` of the JSON assets, not Vite's `?url` module graph.
 */
export async function stubDatasetJson(page: Page): Promise<void> {
  await page.route(/annotations(?:-[^/]+)?\.json(?:\?.*)?$/, async (route) => {
    if (isViteJsonUrlImport(route.request().url())) {
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
    if (isViteJsonUrlImport(route.request().url())) {
      await route.continue()
      return
    }
    await route.fulfill({
      path: miniVisualizations,
      contentType: 'application/json',
    })
  })
}

export async function openAnnotateApp(page: Page): Promise<void> {
  await clearAppStorage(page)
  await stubDatasetJson(page)
  await stubRemoteImages(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByText('Entries', { exact: true }).waitFor({ state: 'visible', timeout: 60_000 })
  await page.getByRole('button', { name: 'Vis', exact: true }).waitFor({ state: 'visible' })
}
