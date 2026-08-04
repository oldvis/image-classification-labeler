import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { openAnnotateApp } from './helpers/app'

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')

const uploadFixture = async (
  page: import('@playwright/test').Page,
  filename: string,
): Promise<void> => {
  const upload = page.getByRole('button', { name: 'Upload', exact: true })
  await expect(upload).toBeVisible()
  // Avoid racing Vite's first-load dependency optimize (can drop the synthetic file input).
  await page.waitForLoadState('networkidle')
  const chooserPromise = page.waitForEvent('filechooser', { timeout: 30_000 })
  await upload.click()
  const chooser = await chooserPromise
  await chooser.setFiles(path.join(fixturesDir, filename))
}

const downloadAnnotations = async (
  page: import('@playwright/test').Page,
): Promise<unknown[]> => {
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download', exact: true }).click()
  const download = await downloadPromise
  const filePath = await download.path()
  expect(filePath).toBeTruthy()
  return JSON.parse(fs.readFileSync(filePath!, 'utf8')) as unknown[]
}

test.describe('annotation upload schema checks', () => {
  test('accepts a valid annotations array and shows success', async ({ page }) => {
    await openAnnotateApp(page)

    await uploadFixture(page, 'annotations-valid.json')

    await expect(page.getByText('Annotations uploaded')).toBeVisible()
    expect(await downloadAnnotations(page)).toHaveLength(2)
  })

  test('rejects invalid schema without replacing existing annotations', async ({ page }) => {
    await openAnnotateApp(page)

    const inPageLabeled = page.getByTestId('entries-stats')
    await page.getByRole('button', { name: 'Vis', exact: true }).click()
    await expect(inPageLabeled).toContainText('1/1')

    await uploadFixture(page, 'annotations-invalid-schema.json')

    await expect(page.getByText('Upload failed: file is not an annotations array')).toBeVisible()
    await expect(inPageLabeled).toContainText('1/1')
  })

  test('rejects invalid JSON without replacing existing annotations', async ({ page }) => {
    await openAnnotateApp(page)

    const inPageLabeled = page.getByTestId('entries-stats')
    await page.getByRole('button', { name: 'Vis', exact: true }).click()
    await expect(inPageLabeled).toContainText('1/1')

    await uploadFixture(page, 'annotations-invalid.json')

    await expect(page.getByText('Upload failed: invalid JSON')).toBeVisible()
    await expect(inPageLabeled).toContainText('1/1')
  })
})
