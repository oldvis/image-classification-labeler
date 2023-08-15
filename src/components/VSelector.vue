<script setup lang="ts">
import { SelectorType } from '~/stores/selector'
import type { Selector } from '~/stores/selector'

const { selector } = defineProps({
  selector: {
    type: Object as PropType<Selector>,
    required: true,
  },
})
const emit = defineEmits<{
  (e: 'removeSelector', d: Selector<SelectorType>): void
}>()

const isSearchSelector = computed(() => (
  selector.type === SelectorType.Fuse
))
const isUnlabeledSelector = computed(() => (
  selector.type === SelectorType.Unlabeled
))
const isLabeledSelector = computed(() => (
  selector.type === SelectorType.Labeled
))
const isUnsureSelector = computed(() => (
  selector.type === SelectorType.Unsure
))
const text = computed(() => {
  if (isSearchSelector.value) {
    return `search: '${(selector as Selector<SelectorType.Fuse>).query.pattern}'`
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
  <div class="border flex gap-1 px-1">
    {{ text }}
    <button
      icon-btn
      title="Remove"
      @click="emit('removeSelector', selector)"
    >
      <div class="i-fa6-solid:xmark m-auto" />
    </button>
  </div>
</template>
