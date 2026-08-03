import type { Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from '@playwright/test'

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

interface StubDatasetJsonOptions {
  /** Absolute path to an annotations JSON fixture. Defaults to an empty array. */
  annotationsPath?: string
  /** Absolute path to a visualizations JSON fixture. Defaults to the mini fixture. */
  visualizationsPath?: string
}

/**
 * Keep e2e fast/deterministic: tiny visualization catalog + annotation seed stub.
 * Only intercepts runtime `fetch()` of the JSON assets, not Vite's `?url` module graph.
 */
export async function stubDatasetJson(
  page: Page,
  options: StubDatasetJsonOptions = {},
): Promise<void> {
  await page.route(/annotations(?:-[^/]+)?\.json(?:\?.*)?$/, async (route) => {
    if (isViteJsonUrlImport(route.request().url())) {
      await route.continue()
      return
    }
    if (options.annotationsPath !== undefined) {
      await route.fulfill({
        path: options.annotationsPath,
        contentType: 'application/json',
      })
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
      path: options.visualizationsPath ?? miniVisualizations,
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

const realAnnotations = path.resolve(__dirname, '../../src/assets/annotations.json')
const realVisualizations = path.resolve(__dirname, '../../src/assets/visualizations.json')

/** Open annotate view with production-sized assets (latency regression tests). */
export async function openAnnotateAppWithRealAssets(page: Page): Promise<void> {
  await clearAppStorage(page)
  await stubDatasetJson(page, {
    annotationsPath: realAnnotations,
    visualizationsPath: realVisualizations,
  })
  await stubRemoteImages(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByText('Entries', { exact: true }).waitFor({ state: 'visible', timeout: 180_000 })
  await page.getByRole('button', { name: 'Vis', exact: true }).waitFor({ state: 'visible' })
  await expect.poll(async () => {
    const text = await page.locator('[view-header]').evaluate((el) => el.textContent ?? '')
    return text.match(/#entries:\s*(\d+)/)?.[1] ?? ''
  }).toBe('13511')
}

/**
 * In-page click → category `ring` attribute change (add or remove).
 * This is the user-perceived label feedback latency.
 */
export async function measureCategoryRingLatencyMs(
  page: Page,
  category: string,
): Promise<number> {
  const button = page.getByRole('button', { name: category, exact: true })
  await button.waitFor({ state: 'visible' })
  return button.evaluate(async (el) => {
    const start = performance.now()
    const before = el.getAttribute('ring') ?? ''
    await new Promise<void>((resolve, reject) => {
      let settled = false
      let timer = 0
      let obs: MutationObserver
      const finish = (error?: Error): void => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        obs.disconnect()
        if (error !== undefined) reject(error)
        else resolve()
      }
      obs = new MutationObserver(() => {
        if ((el.getAttribute('ring') ?? '') !== before) {
          finish()
        }
      })
      timer = window.setTimeout(() => {
        finish(new Error('Timed out waiting for ring attribute change'))
      }, 30_000)
      obs.observe(el, { attributes: true, attributeFilter: ['ring'] })
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    return performance.now() - start
  })
}
