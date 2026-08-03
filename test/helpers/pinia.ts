import { createPinia, setActivePinia } from 'pinia'
import { useStore as useAnnotationStore } from '~/stores/annotation'
import { useStore as useSelectorStore } from '~/stores/selector'
import { useStore as useUserStore } from '~/stores/user'
import { useStore as useVisStore } from '~/stores/visualization'
import { fixtureVisualizations } from '../fixtures/visualizations'

export const createTestPinia = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/** Reset mutable store state used by interface tests. */
export const resetInterfaceStores = () => {
  useAnnotationStore().setAnnotations([])
  useSelectorStore().$patch({ selectors: [] })
  useUserStore().$patch({ name: null, uuid: null })
  useVisStore().$patch({ visualizations: fixtureVisualizations })
}
