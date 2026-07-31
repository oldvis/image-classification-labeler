import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TheDialogLogin from '~/components/TheDialogLogin.vue'
import { useStore as useUserStore } from '~/stores/user'
import { createTestPinia } from '../helpers/pinia'

describe('theDialogLogin', () => {
  it('greets using the persisted user store name, not the local input ref', () => {
    const pinia = createTestPinia()
    useUserStore().$patch({ name: 'Ada', uuid: 'user-1' })

    const wrapper = mount(TheDialogLogin, {
      global: {
        plugins: [pinia],
        stubs: {
          VDialog: {
            template: '<div><slot name="activator" /><slot /></div>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Hi, Ada')
  })
})
