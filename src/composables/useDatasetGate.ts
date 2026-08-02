import { computed, ref } from 'vue'
import { loadVisualizations } from '~/plugins/visualization'
import { loadAnnotations, useStore as useAnnotationStore } from '~/stores/annotation'
import { useStore as useVisualizationStore } from '~/stores/visualization'

/**
 * Loads datasets into Pinia and exposes Loading / error / Retry for the annotate view.
 * Lifecycle flags stay here; stores only hold domain data.
 */
export const useDatasetGate = () => {
  const visStore = useVisualizationStore()
  const annStore = useAnnotationStore()

  const isLoading = ref(false)
  const ready = ref(false)
  const error = ref<string | null>(null)

  const showLoading = computed(() => !error.value && (isLoading.value || !ready.value))

  const loadDatasets = async (): Promise<void> => {
    if (isLoading.value) {
      return
    }

    isLoading.value = true
    error.value = null
    try {
      await Promise.all([
        (async () => {
          if (visStore.visualizations.length === 0) {
            visStore.visualizations = await loadVisualizations()
          }
        })(),
        (async () => {
          if (annStore.annotations.length === 0) {
            annStore.annotations = await loadAnnotations()
          }
        })(),
      ])
      ready.value = true
    }
    catch (e) {
      ready.value = false
      error.value = e instanceof Error ? e.message : 'Failed to load datasets'
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    showLoading,
    error,
    loadDatasets,
  }
}
