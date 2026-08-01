import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { openAnnotateApp } from './helpers/app'

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')

const annotationCount = async (page: import('@playwright/test').Page): Promise<number> => {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem('image-classification-labeler:annotation')
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { annotations?: unknown[] }
    return Array.isArray(parsed.annotations) ? parsed.annotations.length : 0
  })
}

const uploadFixture = async (
  page: import('@playwright/test').Page,
  filename: string,
): Promise<void> => {
  const upload = page.getByRole('button', { name: 'upload', exact: true })
  await expect(upload).toBeVisible()
  // Avoid racing Vite's first-load dependency optimize (can drop the synthetic file input).
  await page.waitForLoadState('networkidle')
  const chooserPromise = page.waitForEvent('filechooser', { timeout: 30_000 })
  await upload.click()
  const chooser = await chooserPromise
  await chooser.setFiles(path.join(fixturesDir, filename))
}

test.describe('annotation upload schema checks', () => {
  test('accepts a valid annotations array and shows success', async ({ page }) => {
    await openAnnotateApp(page)

    await uploadFixture(page, 'annotations-valid.json')

    await expect(page.getByText('Annotations uploaded')).toBeVisible()
    await expect.poll(async () => annotationCount(page)).toBe(2)
  })

  test('rejects invalid schema without replacing existing annotations', async ({ page }) => {
    await openAnnotateApp(page)

    await page.getByRole('button', { name: 'Vis', exact: true }).click()
    await expect.poll(async () => annotationCount(page)).toBe(1)

    await uploadFixture(page, 'annotations-invalid-schema.json')

    await expect(page.getByText('Upload failed: file is not an annotations array')).toBeVisible()
    await expect.poll(async () => annotationCount(page)).toBe(1)
    await expect(page.getByText('1/1')).toBeVisible()
  })

  test('rejects invalid JSON without replacing existing annotations', async ({ page }) => {
    await openAnnotateApp(page)

    await page.getByRole('button', { name: 'Vis', exact: true }).click()
    await expect.poll(async () => annotationCount(page)).toBe(1)

    await uploadFixture(page, 'annotations-invalid.json')

    await expect(page.getByText('Upload failed: invalid JSON')).toBeVisible()
    await expect.poll(async () => annotationCount(page)).toBe(1)
  })
})
