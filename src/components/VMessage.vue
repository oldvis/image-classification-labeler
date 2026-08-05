<script setup lang="ts">
import type { Message } from '~/stores/message'
import { promiseTimeout } from '@vueuse/core'
import { MessageType } from '~/stores/message'

const props = defineProps({
  message: {
    type: Object as PropType<Message>,
    required: true,
  },
})
const emit = defineEmits<{
  (e: 'close'): void
}>()

const { message } = toRefs(props)
const show = ref(true)

onMounted(async () => {
  if (message.value.timeout === Number.POSITIVE_INFINITY) return
  await promiseTimeout(message.value.timeout)
  show.value = false
})
watch(show, (d) => {
  if (d === false) emit('close')
})
</script>

<template>
  <div
    class="p-2 rounded flex gap-2 max-w-xs w-full shadow items-center"
    bg="white dark:gray-800"
    text="gray-500 dark:gray-400"
  >
    <div
      v-if="message.type === MessageType.Success"
      class="p-2 rounded inline-flex h-8 w-8 items-center justify-center"
      bg="green-100 dark:green-800"
      text="green-500 dark:green-200"
    >
      <div class="i-fa6-solid:check" />
    </div>
    <div
      v-if="message.type === MessageType.Error"
      class="p-2 rounded inline-flex h-8 w-8 items-center justify-center"
      bg="orange-100 dark:orange-700"
      text="orange-500 dark:orange-200"
    >
      <div class="i-fa6-solid:triangle-exclamation" />
    </div>
    <div
      v-if="message.type === MessageType.Info"
      class="p-2 rounded inline-flex h-8 w-8 items-center justify-center"
      bg="sky-100 dark:sky-800"
      text="sky-600 dark:sky-200"
    >
      <div class="i-fa6-solid:circle-info" />
    </div>
    <div class="text-sm">
      {{ message.content }}
    </div>
    <button
      type="button"
      icon-btn
      class="ml-auto"
      title="Close"
      @click="show = false"
    >
      <div class="i-fa6-solid:xmark" />
    </button>
  </div>
</template>
