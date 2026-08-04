<script setup lang="ts">
import type { Selector } from '~/stores/selector'
import { SelectorType } from '~/stores/selector'

const props = defineProps({
  selector: {
    type: Object as PropType<Selector>,
    required: true,
  },
})
const emit = defineEmits<{
  (e: 'removeSelector', d: Selector<SelectorType>): void
}>()

const { selector } = toRefs(props)

const isSearchSelector = computed(() => (
  selector.value.type === SelectorType.Fuse
))
const isUnlabeledSelector = computed(() => (
  selector.value.type === SelectorType.Unlabeled
))
const isLabeledSelector = computed(() => (
  selector.value.type === SelectorType.Labeled
))
const isUnsureSelector = computed(() => (
  selector.value.type === SelectorType.Unsure
))
const text = computed(() => {
  if (isSearchSelector.value) {
    return (selector.value as Selector<SelectorType.Fuse>).query.pattern
  }
  if (isUnlabeledSelector.value) {
    return 'Unlabeled'
  }
  if (isLabeledSelector.value) {
    return 'Labeled'
  }
  if (isUnsureSelector.value) {
    return 'Unsure'
  }
  return ''
})
</script>

<template>
  <div chip>
    <span
      v-if="isSearchSelector"
      class="text-gray-500 dark:text-gray-400"
    >Search</span>
    <span class="max-w-48 truncate">{{ text }}</span>
    <button
      type="button"
      class="base-btn p-0 opacity-75 inline-flex hover:text-teal-600 hover:opacity-100"
      title="Remove"
      @click="emit('removeSelector', selector)"
    >
      <div class="i-fa6-solid:xmark text-xs" />
    </button>
  </div>
</template>
