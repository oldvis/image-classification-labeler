<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStore } from '~/stores/selector'

const store = useStore()
const { selectors } = storeToRefs(store)
const {
  removeSelector,
  toggleUnlabeledSelector,
  toggleLabeledSelector,
  toggleUnsureSelector,
} = store
</script>

<template>
  <div
    class="flex gap-1"
    border="~ gray-200"
  >
    <div class="p-1 flex gap-1 text-sm">
      <div class="i-fa6-solid:filter my-auto" />
      <div class="font-bold my-auto">
        Selectors
      </div>
    </div>
    <div class="flex overflow-auto">
      <template
        v-for="(selector, i) in selectors"
        :key="i"
      >
        <div v-if="i !== 0" class="my-auto">
          ∩
        </div>
        <VSelector
          :selector="selector"
          class="my-auto text-nowrap"
          @remove-selector="removeSelector(selector.uuid)"
        />
      </template>
    </div>
    <div class="grow" />
    <button
      btn
      type="submit"
      class="my-1 flex gap-1 items-center"
      @click="toggleUnlabeledSelector"
    >
      <div class="i-fa6-solid:magnifying-glass" />
      <div>UnLabeled</div>
    </button>
    <button
      btn
      type="submit"
      class="my-1 flex gap-1 items-center"
      @click="toggleLabeledSelector"
    >
      <div class="i-fa6-solid:magnifying-glass" />
      <div>Labeled</div>
    </button>
    <button
      btn
      type="submit"
      class="my-1 flex gap-1 items-center"
      @click="toggleUnsureSelector"
    >
      <div class="i-fa6-solid:magnifying-glass" />
      <div>Unsure</div>
    </button>
    <TheWidgetSearch m="r-1" class="shrink-0" />
  </div>
</template>
