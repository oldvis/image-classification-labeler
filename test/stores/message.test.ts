import { beforeEach, describe, expect, it } from 'vitest'
import { useStore as useMessageStore } from '~/stores/message'
import { createTestPinia } from '../helpers/pinia'

describe('message store', () => {
  beforeEach(() => {
    createTestPinia()
  })

  it('removeMessage is a no-op for an unknown uuid', () => {
    const store = useMessageStore()
    store.addSuccessMessage('keep me')
    const before = [...store.messages]

    store.removeMessage('missing-uuid')

    expect(store.messages).toEqual(before)
  })
})
