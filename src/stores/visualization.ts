import type { Visualization } from '~/plugins/visualization'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useStore = defineStore('visualizations', {
  state: () => ({
    visualizations: [] as Visualization[],
  }),
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
