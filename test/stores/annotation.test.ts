import { beforeEach, describe, expect, it } from 'vitest'
import { Category, useStore as useAnnotationStore } from '~/stores/annotation'
import { useStore as useUserStore } from '~/stores/user'
import { createTestPinia, resetInterfaceStores } from '../helpers/pinia'

describe('annotation store labeling contracts', () => {
  beforeEach(() => {
    createTestPinia()
    resetInterfaceStores()
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
    expect(store.labeledUuids.has('vis-a')).toBe(true)
  })

  it('replaces Vis with NotVis instead of keeping both', () => {
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Vis)
    store.addClassification('vis-a', Category.NotVis)

    const values = store.annotations
      .filter((d) => d.subject === 'vis-a')
      .map((d) => d.value)
    expect(values).toEqual([Category.NotVis])
  })

  it('keeps independent pairs side by side (Vis + Map + Text + Table)', () => {
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Vis)
    store.addClassification('vis-a', Category.Map)
    store.addClassification('vis-a', Category.Text)
    store.addClassification('vis-a', Category.Table)

    const values = store.labelsByUuid['vis-a'].map((d) => d.value).sort()
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

    const values = store.labelsByUuid['vis-a'].map((d) => d.value).sort()
    expect(values).toEqual([Category.Confident, Category.Unsure].sort())
    expect(store.unsureUuids.has('vis-a')).toBe(true)
  })

  it('removeClassification removes only the exact value', () => {
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Vis)
    store.addClassification('vis-a', Category.Map)
    store.removeClassification('vis-a', Category.Vis)

    expect(store.labelsByUuid['vis-a'].map((d) => d.value)).toEqual([Category.Map])
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
})
