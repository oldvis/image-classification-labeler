import { beforeEach, describe, expect, it } from 'vitest'
import { MessageType, useStore as useMessageStore } from '~/stores/message'
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

  it('addInfoMessage enqueues an Info-typed message', () => {
    const store = useMessageStore()
    store.addInfoMessage('nudge')
    expect(store.messages).toHaveLength(1)
    expect(store.messages[0]?.type).toBe(MessageType.Info)
    expect(store.messages[0]?.content).toBe('nudge')
  })

  it('removeByContent removes matching messages', () => {
    const store = useMessageStore()
    store.addInfoMessage('keep-looking', Number.POSITIVE_INFINITY)
    store.addSuccessMessage('other')
    store.removeByContent('keep-looking')
    expect(store.messages.map((d) => d.content)).toEqual(['other'])
  })
})
