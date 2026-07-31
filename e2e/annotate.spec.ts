import { expect, test } from '@playwright/test'
import { openAnnotateApp } from './helpers/app'

const classificationValuesForSubject = async (
  page: import('@playwright/test').Page,
  subjectIndex = 0,
): Promise<string[]> => {
  return page.evaluate((index) => {
    const rawVis = window.localStorage.getItem('visualizations')
    const rawAnn = window.localStorage.getItem('annotation')
    if (!rawAnn) {
      return []
    }
    const ann = JSON.parse(rawAnn) as {
      annotations: Array<{ type: string, subject: string, value: string }>
    }
    // Prefer subject from first shown entry via DOM index mapping is hard;
    // read visualizations store if persisted, else match any Vis annotation.
    let subject: string | undefined
    if (rawVis) {
      const vis = JSON.parse(rawVis) as { visualizations: Array<{ uuid: string }> }
      subject = vis.visualizations[index]?.uuid
    }
    return ann.annotations
      .filter((d) => (
        d.type === 'Classification'
        && (subject === undefined || d.subject === subject)
        && typeof d.value === 'string'
      ))
      .map((d) => d.value)
  }, subjectIndex)
}

test.describe('annotate smokes', () => {
  test('loads annotate view with category buttons', async ({ page }) => {
    await openAnnotateApp(page)
    await expect(page.getByText('Entries', { exact: true })).toBeVisible()
    await expect(page.getByText('Progress', { exact: true })).toBeVisible()

    await expect(page.getByRole('button', { name: 'Vis', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Not Vis', exact: true })).toBeVisible()
  })

  test('label Vis, go next, and download annotations.json', async ({ page }) => {
    await openAnnotateApp(page)

    const vis = page.getByRole('button', { name: 'Vis', exact: true })
    await vis.click()
    await expect.poll(async () => classificationValuesForSubject(page)).toContain('Vis')
    await expect(page.getByText('1/1')).toBeVisible()

    const next = page.getByRole('button', { name: /next 1 entry/i })
    await next.click()
    // After moving off the labeled entry, in-page labeled count returns to 0/1
    await expect(page.getByText('0/1')).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'download', exact: true }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('annotations.json')

    const failure = await download.failure()
    expect(failure).toBeNull()
  })

  test('keyboard d advances to the next entry when the label view is visible', async ({ page }) => {
    await openAnnotateApp(page)
    await page.getByRole('button', { name: 'Vis', exact: true }).click()
    await expect(page.getByText('1/1')).toBeVisible()

    await page.keyboard.press('d')
    await expect(page.getByText('0/1')).toBeVisible()
  })
})
