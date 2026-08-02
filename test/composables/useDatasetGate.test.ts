import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDatasetGate } from '~/composables/useDatasetGate'
import { Category, useStore as useAnnotationStore } from '~/stores/annotation'
import { useStore as useVisStore } from '~/stores/visualization'
import { makeAnnotation } from '../fixtures/annotations'
import { fixtureVisualizations } from '../fixtures/visualizations'
import { createTestPinia } from '../helpers/pinia'

vi.mock('~/plugins/visualization', async (importOriginal) => {
  const mod = await importOriginal<typeof import('~/plugins/visualization')>()
  return {
    ...mod,
    loadVisualizations: vi.fn(),
  }
})

const { loadVisualizations } = await import('~/plugins/visualization')

describe('useDatasetGate', () => {
  beforeEach(() => {
    createTestPinia()
    localStorage.clear()
    vi.unstubAllGlobals()
    vi.mocked(loadVisualizations).mockReset()
    vi.mocked(loadVisualizations).mockResolvedValue(fixtureVisualizations)
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [],
    })))
  })

  it('loads visualizations and becomes ready', async () => {
    const { showLoading, error, loadDatasets } = useDatasetGate()
    expect(showLoading.value).toBe(true)
    await loadDatasets()
    expect(useVisStore().visualizations).toEqual(fixtureVisualizations)
    expect(showLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('loads annotations when the store is empty', async () => {
    const seed = [makeAnnotation('vis-a', Category.Vis)]
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => seed,
    })))

    const { loadDatasets } = useDatasetGate()
    await loadDatasets()
    expect(useAnnotationStore().annotations).toEqual(seed)
  })

  it('does not refetch annotations when already loaded', async () => {
    const existing = [makeAnnotation('vis-a', Category.NotText)]
    useAnnotationStore().$patch({ annotations: existing })
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [makeAnnotation('vis-b', Category.Vis)],
    }))
    vi.stubGlobal('fetch', fetchMock)

    const { loadDatasets } = useDatasetGate()
    await loadDatasets()
    expect(useAnnotationStore().annotations).toEqual(existing)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sets error when visualization load fails', async () => {
    vi.mocked(loadVisualizations).mockRejectedValue(new Error('network down'))
    const { error, showLoading, loadDatasets } = useDatasetGate()
    await loadDatasets()
    expect(error.value).toMatch(/network down/)
    expect(showLoading.value).toBe(false)
  })

  it('does not refetch visualizations when already loaded', async () => {
    useVisStore().$patch({ visualizations: fixtureVisualizations })
    useAnnotationStore().$patch({ annotations: [makeAnnotation('vis-a', Category.Vis)] })
    const { loadDatasets } = useDatasetGate()
    await loadDatasets()
    expect(loadVisualizations).not.toHaveBeenCalled()
  })

  it('sets error when annotation load fails and retries successfully', async () => {
    const seed = [makeAnnotation('vis-a', Category.Vis)]
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => seed,
      })
    vi.stubGlobal('fetch', fetchMock)

    const { error, loadDatasets } = useDatasetGate()
    await loadDatasets()
    expect(error.value).toMatch(/503/)
    expect(useAnnotationStore().annotations).toEqual([])

    await loadDatasets()
    expect(error.value).toBeNull()
    expect(useAnnotationStore().annotations).toEqual(seed)
  })
})
