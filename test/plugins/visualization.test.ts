import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadVisualizations } from '~/plugins/visualization'

describe('loadVisualizations', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the asset URL, maps publishDate year and language names', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ([{
        uuid: 'v1',
        authors: null,
        displayName: 'Chart',
        publishDate: { year: 1901 },
        viewUrl: 'https://example.com/v',
        downloadUrl: 'https://example.com/i.png',
        languages: ['eng'],
        tags: [],
        abstract: null,
        rights: 'public',
        source: { name: 'S', url: 'https://example.com', accessDate: '2024-01-01' },
      }]),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await loadVisualizations()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String))
    expect(result).toHaveLength(1)
    expect(result[0].publishDate).toBe(1901)
    expect(result[0].languages[0]).toBe('English')
  })

  it('throws when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    await expect(loadVisualizations()).rejects.toThrow(/404/)
  })

  it('throws when JSON is not a valid visualizations array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [{ uuid: 1 }],
    })))
    await expect(loadVisualizations()).rejects.toThrow(/invalid visualizations/i)
  })

  it('accepts null languages and maps them to an empty list', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ([{
        uuid: 'v2',
        authors: null,
        displayName: 'No lang',
        publishDate: null,
        viewUrl: 'https://example.com/v',
        downloadUrl: 'https://example.com/i.png',
        languages: null,
        tags: [],
        abstract: null,
        rights: 'public',
        source: { name: 'S', url: 'https://example.com', accessDate: '2024-01-01' },
      }]),
    })))

    const result = await loadVisualizations()
    expect(result[0].languages).toEqual([])
    expect(result[0].publishDate).toBeNull()
  })
})
