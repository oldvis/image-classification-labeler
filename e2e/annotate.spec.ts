import { expect, test } from '@playwright/test'
import { openAnnotateApp } from './helpers/app'

const inPageLabeled = (page: import('@playwright/test').Page) => (
  page.getByTestId('entries-stats')
)

test.describe('annotate smokes', () => {
  test('loads annotate view with category buttons', async ({ page }) => {
    await openAnnotateApp(page)
    await expect(page.getByTestId('entries-stats')).toBeVisible()
    await expect(page.getByText('Progress', { exact: true })).toBeVisible()

    await expect(page.getByRole('button', { name: 'Vis', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Not Vis', exact: true })).toBeVisible()
  })

  test('label Vis, go next, and download annotations.json', async ({ page }) => {
    await openAnnotateApp(page)

    const vis = page.getByRole('button', { name: 'Vis', exact: true })
    await vis.click()
    await expect(vis).toHaveAttribute('ring', '2 black dark:white')
    await expect(inPageLabeled(page)).toContainText('1/1')

    const next = page.getByRole('button', { name: 'Next', exact: true })
    await next.click()
    // After moving off the labeled entry, in-page labeled count returns to 0/1
    await expect(inPageLabeled(page)).toContainText('0/1')

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('annotations.json')

    const failure = await download.failure()
    expect(failure).toBeNull()
  })

  test('keyboard d advances to the next entry when the label view is visible', async ({ page }) => {
    await openAnnotateApp(page)
    await page.getByRole('button', { name: 'Vis', exact: true }).click()
    await expect(inPageLabeled(page)).toContainText('1/1')

    await page.keyboard.press('d')
    await expect(inPageLabeled(page)).toContainText('0/1')
  })

  test('reload drops in-session labels and reseeds from annotations JSON', async ({ page }) => {
    await openAnnotateApp(page)
    const vis = page.getByRole('button', { name: 'Vis', exact: true })
    await vis.click()
    await expect(inPageLabeled(page)).toContainText('1/1')

    await page.reload()
    await page.getByTestId('entries-stats').waitFor({ state: 'visible', timeout: 60_000 })
    await expect(inPageLabeled(page)).toContainText('0/1')
    await expect(vis).not.toHaveAttribute('ring', '2 black dark:white')
  })
})
