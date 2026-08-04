import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import TheWidgetSearch from '~/components/TheWidgetSearch.vue'
import { SelectorType, useStore as useSelectorStore } from '~/stores/selector'
import { createTestPinia, resetInterfaceStores } from '../helpers/pinia'

describe('theWidgetSearch', () => {
  beforeEach(() => {
    createTestPinia()
    resetInterfaceStores()
  })

  it('clicking search adds a Fuse selector and clears the input', async () => {
    const pinia = createTestPinia()
    resetInterfaceStores()
    const wrapper = mount(TheWidgetSearch, {
      global: { plugins: [pinia] },
    })

    const input = wrapper.get('input')
    await input.setValue('Alpha Chart')
    await wrapper.get('button').trigger('click')

    const store = useSelectorStore()
    expect(store.selectors).toHaveLength(1)
    expect(store.selectors[0].type).toBe(SelectorType.Fuse)
    expect((store.selectors[0].query as { pattern: string }).pattern).toBe('Alpha Chart')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('keeps the input when the pattern is empty or already present', async () => {
    const pinia = createTestPinia()
    resetInterfaceStores()
    const store = useSelectorStore()
    store.addSearchSelector('Alpha Chart')

    const wrapper = mount(TheWidgetSearch, {
      global: { plugins: [pinia] },
    })

    const input = wrapper.get('input')
    await input.setValue('   ')
    await wrapper.get('button').trigger('click')
    expect((input.element as HTMLInputElement).value).toBe('   ')
    expect(store.selectors).toHaveLength(1)

    await input.setValue('Alpha Chart')
    await wrapper.get('button').trigger('click')
    expect((input.element as HTMLInputElement).value).toBe('Alpha Chart')
    expect(store.selectors).toHaveLength(1)
  })
})
