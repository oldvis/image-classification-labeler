<script setup lang="ts">
import { onKeyStroke, useFocus } from '@vueuse/core'
import { useStore } from '~/stores/selector'

const input = ref('')
const target = ref()
const { focused } = useFocus(target)
const store = useStore()
const onSearch = () => {
  if (store.addSearchSelector(input.value)) input.value = ''
}
onKeyStroke('Enter', () => {
  if (!focused.value) return
  onSearch()
})
</script>

<template>
  <div class="flex items-center relative">
    <input
      ref="target"
      v-model="input"
      type="text"
      class="pr-7 min-w-44 w-48"
      placeholder="Search"
      required
      input-area
    >
    <button
      type="button"
      icon-btn
      class="right-0.5 absolute"
      title="Search"
      @click="onSearch"
    >
      <div class="i-fa6-solid:magnifying-glass" />
    </button>
  </div>
</template>
