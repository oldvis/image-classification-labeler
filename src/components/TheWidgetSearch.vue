<script setup lang="ts">
import { onKeyStroke, useFocus } from '@vueuse/core'
import { useStore } from '~/stores/selector'

const input = ref('')
const target = ref()
const { focused } = useFocus(target)
const { addSearchSelector } = useStore()
const onSearch = () => {
  addSearchSelector(input.value)
  input.value = ''
}
onKeyStroke('Enter', () => {
  if (!focused.value) return
  onSearch()
})
</script>

<template>
  <div class="flex relative">
    <input
      ref="target"
      v-model="input"
      type="text"
      class="text-sm my-1 pr-6 w-full"
      placeholder="Search"
      required
      input-area
    >
    <button
      icon-btn
      class="pr-1 h-full right-0 top-0 absolute"
      @click="onSearch"
    >
      <div class="i-fa6-solid:magnifying-glass" />
    </button>
  </div>
</template>
