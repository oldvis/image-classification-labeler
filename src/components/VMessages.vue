<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStore } from '~/stores/message'
import VMessage from './VMessage.vue'

const messageStore = useStore()
const { messages } = storeToRefs(messageStore)
const onClose = (uuid: string): void => {
  messageStore.removeMessage(uuid)
}
</script>

<template>
  <div
    class="h-screen w-screen pointer-events-none items-end justify-end fixed z-2"
    flex="~ col"
  >
    <VMessage
      v-for="message in messages"
      :key="`${message.uuid}`"
      class="mx-2 mb-2 pointer-events-auto"
      :message="message"
      @close="onClose(message.uuid)"
    />
  </div>
</template>
