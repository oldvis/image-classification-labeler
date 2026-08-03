import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TheViewLabelProgress from '~/components/TheViewLabelProgress.vue'
import * as filePlugin from '~/plugins/file'
import { Category, useStore as useAnnotationStore } from '~/stores/annotation'
import { useStore as useMessageStore } from '~/stores/message'
import { makeAnnotation } from '../fixtures/annotations'
import { createTestPinia, resetInterfaceStores } from '../helpers/pinia'

describe('theViewLabelProgress import/export wiring', () => {
  beforeEach(() => {
    createTestPinia()
    resetInterfaceStores()
    vi.restoreAllMocks()
  })

  it('download button saves current annotations as annotations.json', async () => {
    const pinia = createTestPinia()
    resetInterfaceStores()
    const store = useAnnotationStore()
    store.annotations = [makeAnnotation('vis-a', Category.Vis)]

    const saveSpy = vi.spyOn(filePlugin, 'saveJsonFile').mockImplementation(() => {})

    const wrapper = mount(TheViewLabelProgress, {
      global: { plugins: [pinia] },
    })

    await wrapper.findAll('button').find((b) => b.text() === 'download')!.trigger('click')

    expect(saveSpy).toHaveBeenCalledWith(store.annotations, 'annotations.json')
  })

  it('upload button replaces the annotations array', async () => {
    const pinia = createTestPinia()
    resetInterfaceStores()
    const store = useAnnotationStore()
    store.annotations = [makeAnnotation('vis-a', Category.Vis)]

    const uploaded = [makeAnnotation('vis-b', Category.Map)]
    vi.spyOn(filePlugin, 'uploadJsonFile').mockResolvedValue(uploaded)

    const wrapper = mount(TheViewLabelProgress, {
      global: { plugins: [pinia] },
    })

    await wrapper.findAll('button').find((b) => b.text() === 'upload')!.trigger('click')
    await Promise.resolve()

    expect(store.annotations).toEqual(uploaded)
  })

  it('upload button rejects unknown subjects without replacing annotations', async () => {
    const pinia = createTestPinia()
    resetInterfaceStores()
    const store = useAnnotationStore()
    const existing = [makeAnnotation('vis-a', Category.Vis)]
    store.annotations = existing

    vi.spyOn(filePlugin, 'uploadJsonFile').mockResolvedValue([
      makeAnnotation('not-in-dataset', Category.Map),
    ])

    const wrapper = mount(TheViewLabelProgress, {
      global: { plugins: [pinia] },
    })

    await wrapper.findAll('button').find((b) => b.text() === 'upload')!.trigger('click')
    await Promise.resolve()

    expect(store.annotations).toEqual(existing)
    expect(useMessageStore().messages.some((d) => /subject/i.test(d.content))).toBe(true)
  })

  it('upload button keeps existing annotations when payload is invalid', async () => {
    const pinia = createTestPinia()
    resetInterfaceStores()
    const store = useAnnotationStore()
    const existing = [makeAnnotation('vis-a', Category.Vis)]
    store.annotations = existing

    vi.spyOn(filePlugin, 'uploadJsonFile').mockResolvedValue({ nope: true })

    const wrapper = mount(TheViewLabelProgress, {
      global: { plugins: [pinia] },
    })

    await wrapper.findAll('button').find((b) => b.text() === 'upload')!.trigger('click')
    await Promise.resolve()

    expect(store.annotations).toEqual(existing)
  })

  it('renders category progress counts from the store', () => {
    const pinia = createTestPinia()
    resetInterfaceStores()
    const store = useAnnotationStore()
    store.annotations = [
      makeAnnotation('vis-a', Category.Vis),
      makeAnnotation('vis-b', Category.NotVis),
      makeAnnotation('vis-a', Category.Unsure),
    ]

    const wrapper = mount(TheViewLabelProgress, {
      global: { plugins: [pinia] },
    })

    expect(wrapper.text()).toContain('#Vis/Not:')
    expect(wrapper.text()).toContain('1 / 1')
    expect(wrapper.text()).toContain('#Unsure:')
  })
})
