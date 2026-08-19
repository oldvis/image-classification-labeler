<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { SelectorType, useStore } from '~/stores/selector'

const store = useStore()
const { selectors } = storeToRefs(store)
const {
  removeSelector,
  toggleUnlabeledSelector,
  toggleLabeledSelector,
  toggleUnsureSelector,
} = store

const hasSelectorType = (type: SelectorType): boolean => (
  selectors.value.some((d) => d.type === type)
)
</script>

<template>
  <div
    strip
    border="b gray-200 dark:gray-700"
  >
    <div class="flex shrink-0 gap-1.5 items-center">
      <div class="i-fa6-solid:filter text-gray-500 my-auto" />
      <div strip-label>
        Selectors
      </div>
    </div>
    <div
      class="flex grow gap-1.5 min-w-0 items-center overflow-y-hidden"
      :class="selectors.length > 0 ? 'overflow-x-auto' : 'overflow-x-hidden'"
    >
      <template v-if="selectors.length === 0">
        <div class="strip-meta px-1">
          No filters
        </div>
      </template>
      <template
        v-for="(selector, i) in selectors"
        :key="selector.uuid"
      >
        <span
          v-if="i !== 0"
          class="strip-meta text-gray-400 shrink-0"
          title="AND"
        >∩</span>
        <VSelector
          :selector="selector"
          class="shrink-0"
          @remove-selector="removeSelector(selector.uuid)"
        />
      </template>
    </div>
    <div class="flex shrink-0 flex-wrap gap-1 items-center">
      <button
        type="button"
        :class="hasSelectorType(SelectorType.Unlabeled) ? 'pill-on' : 'pill'"
        title="Show unlabeled entries only"
        @click="toggleUnlabeledSelector"
      >
        Unlabeled
      </button>
      <button
        type="button"
        :class="hasSelectorType(SelectorType.Labeled) ? 'pill-on' : 'pill'"
        title="Show labeled entries only"
        @click="toggleLabeledSelector"
      >
        Labeled
      </button>
      <button
        type="button"
        :class="hasSelectorType(SelectorType.Unsure) ? 'pill-on' : 'pill'"
        title="Show unsure entries only"
        @click="toggleUnsureSelector"
      >
        Unsure
      </button>
      <TheWidgetSearch class="shrink-0" />
    </div>
  </div>
</template>
