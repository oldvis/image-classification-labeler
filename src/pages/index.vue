<script setup lang="ts">
import { useTitle } from '@vueuse/core'
import { useDatasetGate } from '~/composables/useDatasetGate'
import { useSignInNotice } from '~/composables/useSignInNotice'

useTitle('Classify · OldVisOnline')
useSignInNotice()

const { showLoading, error, loadDatasets } = useDatasetGate()
void loadDatasets()
</script>

<template>
  <div
    v-if="showLoading"
    class="text-xl m-auto flex gap-2"
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
      @click="loadDatasets"
    >
      Retry
    </button>
  </div>
  <div
    v-else
    class="m-1 grow gap-1 overflow-auto"
    flex="~ col"
  >
    <TheViewSelectors />
    <TheViewLabel class="grow" />
    <TheViewLabelProgress />
  </div>
</template>
