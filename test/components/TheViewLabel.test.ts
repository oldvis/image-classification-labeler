import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TheViewLabel from '~/components/TheViewLabel.vue'
import { Category, useStore as useAnnotationStore } from '~/stores/annotation'
import { useStore as useSelectorStore } from '~/stores/selector'
import { createTestPinia, resetInterfaceStores } from '../helpers/pinia'

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core')
  return {
    ...actual,
    useElementVisibility: () => ({ value: true }),
  }
})

const mountLabelView = () => {
  const pinia = createTestPinia()
  resetInterfaceStores()
  return mount(TheViewLabel, {
    global: {
      plugins: [pinia],
      stubs: {
        VDataEntry: {
          props: ['datum', 'index'],
          template: '<div class="stub-entry" :data-uuid="datum.uuid"><slot /></div>',
        },
      },
    },
  })
}

describe('theViewLabel interface', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the first matched entry and category buttons', () => {
    const wrapper = mountLabelView()
    expect(wrapper.text()).toContain('Vis')
    expect(wrapper.text()).toContain('Not Vis')
    expect(wrapper.text()).toContain('Map')
    expect(wrapper.text()).toContain('Unsure')
    // nInPageLabeled / shown.length — first page entry is unlabeled
    expect(wrapper.text()).toContain('0/1')
  })

  it('clicking Vis then Not Vis replaces the pair via the store', async () => {
    const wrapper = mountLabelView()
    const store = useAnnotationStore()

    const visBtn = wrapper.find('button[title="This is a visualization"]')
    const notVisBtn = wrapper.find('button[title="This is not a visualization"]')

    await visBtn.trigger('click')
    expect(store.isClassified('vis-a', Category.Vis)).toBe(true)

    await notVisBtn.trigger('click')
    expect(store.isClassified('vis-a', Category.Vis)).toBe(false)
    expect(store.isClassified('vis-a', Category.NotVis)).toBe(true)
  })

  it('clicking an active category removes it', async () => {
    const wrapper = mountLabelView()
    const store = useAnnotationStore()
    const visBtn = wrapper.find('button[title="This is a visualization"]')

    await visBtn.trigger('click')
    await visBtn.trigger('click')
    expect(store.isLabeled('vis-a')).toBe(false)
  })

  it('next/previous buttons move startIndex within matched entries', async () => {
    const wrapper = mountLabelView()
    const next = wrapper.find('button[title="Show next 1 entries"]')
    const prev = wrapper.find('button[title="Show previous 1 entries"]')

    expect(prev.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-a')
    await next.trigger('click')
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-b')
    await prev.trigger('click')
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-a')
    expect(prev.attributes('disabled')).toBeDefined()
  })

  it('disables next when the filtered match list is exhausted', async () => {
    const wrapper = mountLabelView()
    const selectorStore = useSelectorStore()
    // Keep only one visualization (uuid vis-a) in the matched set
    selectorStore.addSearchSelector('vis-a')
    await wrapper.vm.$nextTick()

    const next = wrapper.find('button[title="Show next 1 entries"]')
    expect(next.attributes('disabled')).toBeDefined()
  })

  it('goto first unlabeled jumps past a labeled first entry', async () => {
    const wrapper = mountLabelView()
    const store = useAnnotationStore()
    store.addClassification('vis-a', Category.Vis)

    const goto = wrapper.find('button[title="goto first unlabeled"]')
    await goto.trigger('click')

    expect(wrapper.text()).toContain('0/1')
  })

  it('pressing d then a navigates forward and back when visible', async () => {
    const wrapper = mountLabelView()
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-a')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-b')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-a')
  })

  it('ignores a/d while an input is focused or a modifier is held', async () => {
    const wrapper = mountLabelView()
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-a')

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-a')
    input.blur()
    input.remove()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', metaKey: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-a')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-a')
  })

  it('pressing d at the last entry stays on the last entry', async () => {
    const wrapper = mountLabelView()
    const selectorStore = useSelectorStore()
    selectorStore.addSearchSelector('vis-a')
    await wrapper.vm.$nextTick()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-a')
    expect(wrapper.text()).not.toContain('No Entries Matched')
  })

  it('clamps startIndex when selectors shrink the matched set', async () => {
    const wrapper = mountLabelView()
    const next = wrapper.find('button[title="Show next 1 entries"]')
    await next.trigger('click')
    await next.trigger('click')
    await next.trigger('click')
    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-d')

    const selectorStore = useSelectorStore()
    selectorStore.addSearchSelector('vis-a')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.stub-entry').attributes('data-uuid')).toBe('vis-a')
    expect(wrapper.text()).not.toContain('No Entries Matched')
  })
})
