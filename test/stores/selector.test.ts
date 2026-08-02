import { beforeEach, describe, expect, it } from 'vitest'
import { Category, useStore as useAnnotationStore } from '~/stores/annotation'
import { SelectorType, useStore as useSelectorStore } from '~/stores/selector'
import { fixtureVisualizations } from '../fixtures/visualizations'
import { createTestPinia, resetInterfaceStores } from '../helpers/pinia'

describe('selector store filter contracts', () => {
  beforeEach(() => {
    createTestPinia()
    resetInterfaceStores()
  })

  it('addSearchSelector keeps exact uuid matches (threshold 0)', () => {
    const store = useSelectorStore()
    store.addSearchSelector('vis-b')

    const matched = store.applySelectors(fixtureVisualizations)
    expect(matched.map((d) => d.uuid)).toEqual(['vis-b'])
    expect(store.selectors[0].type).toBe(SelectorType.Fuse)
  })

  it('toggleUnlabeledSelector filters to unlabeled only', () => {
    const annotations = useAnnotationStore()
    annotations.addClassification('vis-a', Category.Vis)

    const store = useSelectorStore()
    store.toggleUnlabeledSelector()

    const matched = store.applySelectors(fixtureVisualizations)
    expect(matched.map((d) => d.uuid).sort()).toEqual(['vis-b', 'vis-c', 'vis-d'])
  })

  it('toggleLabeledSelector filters to labeled only', () => {
    const annotations = useAnnotationStore()
    annotations.addClassification('vis-a', Category.Vis)
    annotations.addClassification('vis-c', Category.Map)

    const store = useSelectorStore()
    store.toggleLabeledSelector()

    const matched = store.applySelectors(fixtureVisualizations)
    expect(matched.map((d) => d.uuid).sort()).toEqual(['vis-a', 'vis-c'])
  })

  it('toggleUnsureSelector filters to unsure subjects', () => {
    const annotations = useAnnotationStore()
    annotations.addClassification('vis-a', Category.Vis)
    annotations.addClassification('vis-a', Category.Unsure)
    annotations.addClassification('vis-b', Category.Map)

    const store = useSelectorStore()
    store.toggleUnsureSelector()

    const matched = store.applySelectors(fixtureVisualizations)
    expect(matched.map((d) => d.uuid)).toEqual(['vis-a'])
  })

  it('composes selectors with intersection order', () => {
    const annotations = useAnnotationStore()
    annotations.addClassification('vis-a', Category.Vis)
    // vis-d remains unlabeled and matches tag/search via displayName/tags if needed

    const store = useSelectorStore()
    store.toggleUnlabeledSelector()
    store.addSearchSelector('Delta Map')

    const matched = store.applySelectors(fixtureVisualizations)
    expect(matched.map((d) => d.uuid)).toEqual(['vis-d'])
  })

  it('toggling the same unlabeled selector twice removes it', () => {
    const store = useSelectorStore()
    store.toggleUnlabeledSelector()
    expect(store.selectors).toHaveLength(1)
    store.toggleUnlabeledSelector()
    expect(store.selectors).toHaveLength(0)
  })

  it('removeSelector is a no-op for an unknown uuid', () => {
    const store = useSelectorStore()
    store.toggleUnlabeledSelector()
    const before = [...store.selectors]

    store.removeSelector('missing-uuid')

    expect(store.selectors).toEqual(before)
  })
})
