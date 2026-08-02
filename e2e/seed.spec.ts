import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import {
  clearAppStorage,
  stubDatasetJson,
  stubRemoteImages,
} from './helpers/app'

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')

/** Vite `*.json?url` resolves via `?import` module requests — never stub those. */
const isViteJsonUrlImport = (url: string): boolean => {
  try {
    return new URL(url).searchParams.has('import')
  }
  catch {
    return false
  }
}

test.describe('annotation seed loading', () => {
  test('applies seeded classifications to the label UI', async ({ page }) => {
    await clearAppStorage(page)
    await stubDatasetJson(page)
    // Override empty annotation stub with a seed that labels vis-a as Vis.
    await page.route(/annotations(?:-[^/]+)?\.json(?:\?.*)?$/, async (route) => {
      if (isViteJsonUrlImport(route.request().url())) {
        await route.continue()
        return
      }
      await route.fulfill({
        path: path.join(fixturesDir, 'annotations-seed.json'),
        contentType: 'application/json',
      })
    })
    await stubRemoteImages(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    await expect(page.getByText('Entries', { exact: true })).toBeVisible({ timeout: 60_000 })
    // Seed labeled vis-a → first (only) shown entry counts as labeled.
    await expect(page.getByText('1/1')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Vis', exact: true })).toHaveAttribute(
      'ring',
      '2 black dark:white',
    )
  })
})
