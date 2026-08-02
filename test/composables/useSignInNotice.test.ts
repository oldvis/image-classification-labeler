import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { useSignInNotice } from '~/composables/useSignInNotice'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useUserStore } from '~/stores/user'
import { createTestPinia } from '../helpers/pinia'

const isSignInNotice = (content: string): boolean => (
  content.includes('Please sign in')
)

const mountNoticeHost = () => {
  const pinia = createTestPinia()
  const Host = defineComponent({
    setup() {
      useSignInNotice()
      return () => null
    },
  })
  return mount(Host, { global: { plugins: [pinia] } })
}

describe('useSignInNotice', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows a notice when unsigned and removes it after sign-in', async () => {
    mountNoticeHost()
    const messages = useMessageStore()
    const user = useUserStore()

    expect(messages.messages.some((d) => isSignInNotice(d.content))).toBe(true)

    user.trySignIn('alice')
    await nextTick()

    expect(messages.messages.some((d) => isSignInNotice(d.content))).toBe(false)
  })

  it('does not add duplicate notices while still signed out', async () => {
    mountNoticeHost()
    const messages = useMessageStore()
    const user = useUserStore()

    user.trySignIn('alice')
    await nextTick()
    user.signOut()
    await nextTick()
    user.signOut()
    await nextTick()

    expect(messages.messages.filter((d) => isSignInNotice(d.content))).toHaveLength(1)
  })
})
