import { acceptHMRUpdate, defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

export const useStore = defineStore('user', {
  state: () => ({
    name: null as string | null,
    uuid: null as string | null,
  }),
  getters: {
    isSignedIn(): boolean {
      return this.name !== null
    },
  },
  actions: {
    trySignIn(name: string): boolean {
      this.name = name
      this.uuid = uuidv4()
      return true
    },
    signOut(): void {
      this.name = null
      this.uuid = null
    },
  },
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
