import type { Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tinyPng = path.resolve(__dirname, '../fixtures/tiny.png')

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
 * Start with empty annotations so labeling assertions are deterministic.
 */
export async function clearAppStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('user', JSON.stringify({
      name: 'e2e',
      uuid: '11111111-1111-4111-8111-111111111111',
    }))
    window.localStorage.setItem('message', JSON.stringify({ messages: [] }))
    window.localStorage.setItem('annotation', JSON.stringify({ annotations: [] }))
    window.localStorage.setItem('selectors', JSON.stringify({ selectors: [] }))
  })
}

export async function openAnnotateApp(page: Page): Promise<void> {
  await clearAppStorage(page)
  await stubRemoteImages(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByText('Entries', { exact: true }).waitFor({ state: 'visible', timeout: 60_000 })
  await page.getByRole('button', { name: 'Vis', exact: true }).waitFor({ state: 'visible' })
}
