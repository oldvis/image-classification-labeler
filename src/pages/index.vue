<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import { useDatasetGate } from '~/composables/useDatasetGate'
import { useSignInNotice } from '~/composables/useSignInNotice'

useTitle('Classify · OldVis')

const { notifyIfUnsigned } = useSignInNotice()
const { showLoading, error, loadDatasets } = useDatasetGate()

watch(showLoading, (loading, wasLoading) => {
  if (wasLoading === true && loading === false && error.value === null) {
    notifyIfUnsigned()
  }
})

void loadDatasets()
</script>

<template>
  <div
    v-if="showLoading"
    class="text-sm text-gray-500 m-auto p-3 flex gap-2 dark:text-gray-400"
  >
    Loading
    <div
      class="i-fa6-solid:spinner"
      animate-spin
    />
  </div>
  <div
    v-else-if="error"
    class="m-auto text-center flex flex-col gap-2 items-center"
  >
    <p>{{ error }}</p>
    <button
      type="button"
      class="btn"
      title="Retry loading datasets"
      @click="loadDatasets"
    >
      Retry
    </button>
  </div>
  <div
    v-else
    class="grow min-h-0 overflow-hidden"
    flex="~ col"
  >
    <TheViewSelectors class="shrink-0" />
    <TheViewLabel class="grow min-h-0" />
    <TheViewLabelProgress class="shrink-0" />
  </div>
</template>
