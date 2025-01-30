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
    return `search: '${(selector.value as Selector<SelectorType.Fuse>).query.pattern}'`
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
