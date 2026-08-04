import { expect, test } from '@playwright/test'
import {
  measureCategoryRingLatencyMs,
  openAnnotateAppWithRealAssets,
} from './helpers/app'

/**
 * Regression guard for annotation hot-path latency (large production assets).
 * Typical ring feedback here is well under 50ms; threshold allows CI noise.
 */
const MAX_RING_MS = 250
const SAMPLES = 3

test.describe('label click latency', () => {
  test('keeps category ring feedback fast on real-sized datasets', async ({ page }) => {
    test.setTimeout(300_000)
    await openAnnotateAppWithRealAssets(page)

    // Warm-up (first paint / JIT); not scored.
    await measureCategoryRingLatencyMs(page, 'Confident')
    await page.getByRole('button', { name: 'Next', exact: true }).click()

    const samples: number[] = []
    for (let i = 0; i < SAMPLES; i += 1) {
      samples.push(await measureCategoryRingLatencyMs(page, 'Confident'))
      await page.getByRole('button', { name: 'Next', exact: true }).click()
    }

    const mean = samples.reduce((a, b) => a + b, 0) / samples.length
    // eslint-disable-next-line no-console
    console.log(
      `[e2e-label-latency] samples_ms=${samples.map((ms) => ms.toFixed(1)).join(',')} `
      + `mean_ms=${mean.toFixed(1)} max_ms=${MAX_RING_MS}`,
    )

    expect(mean).toBeLessThan(MAX_RING_MS)
    for (const ms of samples) {
      expect(ms).toBeLessThan(MAX_RING_MS)
    }
  })
})
