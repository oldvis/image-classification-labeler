import { beforeEach, describe, expect, it } from 'vitest'
import { useStore as useUserStore } from '~/stores/user'
import { createTestPinia, resetInterfaceStores } from '../helpers/pinia'

describe('user store', () => {
  beforeEach(() => {
    createTestPinia()
    resetInterfaceStores()
  })

  it('trySignIn sets name, uuid, and isSignedIn', () => {
    const store = useUserStore()
    expect(store.isSignedIn).toBe(false)

    const ok = store.trySignIn('bob')
    expect(ok).toBe(true)
    expect(store.name).toBe('bob')
    expect(store.uuid).toEqual(expect.any(String))
    expect(store.isSignedIn).toBe(true)
  })

  it('signOut clears name and uuid', () => {
    const store = useUserStore()
    store.trySignIn('bob')
    store.signOut()

    expect(store.name).toBeNull()
    expect(store.uuid).toBeNull()
    expect(store.isSignedIn).toBe(false)
  })
})
