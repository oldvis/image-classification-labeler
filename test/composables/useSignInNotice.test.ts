import { beforeEach, describe, expect, it } from 'vitest'
import { useSignInNotice } from '~/composables/useSignInNotice'
import { MessageType, useStore as useMessageStore } from '~/stores/message'
import { useStore as useUserStore } from '~/stores/user'
import { createTestPinia, resetInterfaceStores } from '../helpers/pinia'

describe('useSignInNotice', () => {
  beforeEach(() => {
    createTestPinia()
    resetInterfaceStores()
    useMessageStore().$patch({ messages: [] })
  })

  it('enqueues an info snackbar when unsigned', () => {
    const { notifyIfUnsigned } = useSignInNotice()
    notifyIfUnsigned()

    const messages = useMessageStore().messages
    expect(messages).toHaveLength(1)
    expect(messages[0]?.type).toBe(MessageType.Info)
    expect(messages[0]?.content).toMatch(/Set a Name/i)
  })

  it('does not enqueue when a name is already set', () => {
    useUserStore().trySignIn('alice')
    const { notifyIfUnsigned } = useSignInNotice()
    notifyIfUnsigned()

    expect(useMessageStore().messages).toHaveLength(0)
  })
})
