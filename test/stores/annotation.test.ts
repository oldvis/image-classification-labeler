import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Category,
  isAnnotationArray,
  loadAnnotations,
  parseUploadedAnnotations,
  useStore as useAnnotationStore,
} from '~/stores/annotation'
import { useStore as useUserStore } from '~/stores/user'
import { makeAnnotation } from '../fixtures/annotations'
import { createTestPinia, resetInterfaceStores } from '../helpers/pinia'

describe('loadAnnotations', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and returns the JSON array', async () => {
    const seed = [makeAnnotation('vis-a', Category.Vis)]
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => seed,
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(loadAnnotations()).resolves.toEqual(seed)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    await expect(loadAnnotations()).rejects.toThrow(/500/)
  })

  it('throws when JSON is not a valid annotations array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ nope: true }),
    })))
    await expect(loadAnnotations()).rejects.toThrow(/invalid annotations/i)
  })
})

describe('annotation store labeling contracts', () => {
  beforeEach(() => {
    createTestPinia()
    resetInterfaceStores()
    vi.unstubAllGlobals()
  })

  it('adds a classification and marks the subject labeled', () => {
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Vis)

    expect(store.annotations).toHaveLength(1)
    expect(store.annotations[0]).toMatchObject({
      type: 'Classification',
      subject: 'vis-a',
      value: Category.Vis,
    })
    expect(store.isLabeled('vis-a')).toBe(true)
    expect(store.labeledCount).toBe(1)
    expect(store.isClassified('vis-a', Category.Vis)).toBe(true)
    expect(store.classificationCountByValue[Category.Vis]).toBe(1)
  })

  it('replaces Vis with NotVis instead of keeping both', () => {
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Vis)
    store.addClassification('vis-a', Category.NotVis)

    const values = store.annotations
      .filter((d) => d.subject === 'vis-a')
      .map((d) => d.value)
    expect(values).toEqual([Category.NotVis])
    expect(store.classificationCountByValue[Category.Vis]).toBe(0)
    expect(store.classificationCountByValue[Category.NotVis]).toBe(1)
  })

  it('keeps independent pairs side by side (Vis + Map + Text + Table)', () => {
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Vis)
    store.addClassification('vis-a', Category.Map)
    store.addClassification('vis-a', Category.Text)
    store.addClassification('vis-a', Category.Table)

    const values = store.annotations
      .filter((d) => d.subject === 'vis-a')
      .map((d) => d.value)
      .sort()
    expect(values).toEqual([
      Category.Map,
      Category.Table,
      Category.Text,
      Category.Vis,
    ].sort())
  })

  it('does not treat Unsure and Confident as a replace pair', () => {
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Unsure)
    store.addClassification('vis-a', Category.Confident)

    expect(store.isClassified('vis-a', Category.Unsure)).toBe(true)
    expect(store.isClassified('vis-a', Category.Confident)).toBe(true)
    expect(store.isUnsure('vis-a')).toBe(true)
  })

  it('removeClassification removes only the exact value', () => {
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Vis)
    store.addClassification('vis-a', Category.Map)
    store.removeClassification('vis-a', Category.Vis)

    expect(store.isClassified('vis-a', Category.Vis)).toBe(false)
    expect(store.isClassified('vis-a', Category.Map)).toBe(true)
  })

  it('stamps the signed-in user uuid onto new annotations', () => {
    const user = useUserStore()
    user.trySignIn('alice')
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Vis)

    expect(store.annotations[0].user).toBe(user.uuid)
  })

  it('stores null user when unsigned', () => {
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Vis)
    expect(store.annotations[0].user).toBeNull()
  })

  it('parseUploadedAnnotations rejects unknown subjects and contradictory pairs', () => {
    const known = new Set(['vis-a'])
    expect(parseUploadedAnnotations(
      [makeAnnotation('missing', Category.Vis)],
      known,
    )).toMatchObject({ ok: false, error: expect.stringMatching(/subject/i) })

    expect(parseUploadedAnnotations(
      [
        makeAnnotation('vis-a', Category.Vis),
        makeAnnotation('vis-a', Category.NotVis, { uuid: 'other' }),
      ],
      known,
    )).toMatchObject({ ok: false, error: expect.stringMatching(/contradictory/i) })

    expect(parseUploadedAnnotations(
      [makeAnnotation('vis-a', Category.Vis)],
      known,
    )).toMatchObject({ ok: true })
  })

  it('isAnnotationArray accepts well-formed rows and rejects junk', () => {
    expect(isAnnotationArray([{
      type: 'Classification',
      uuid: 'a',
      subject: 'vis-a',
      user: null,
      value: 'Vis',
      time: '2020-01-01T00:00:00.000Z',
    }])).toBe(true)
    expect(isAnnotationArray({ nope: true })).toBe(false)
    expect(isAnnotationArray([{ uuid: 1 }])).toBe(false)
    expect(isAnnotationArray([{
      type: 'Classification',
      uuid: 'a',
      subject: 'vis-a',
      user: null,
      value: 'NotARealCategory',
      time: '2020-01-01T00:00:00.000Z',
    }])).toBe(false)
  })
})
