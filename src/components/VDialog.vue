<script setup lang="ts">
const { dialog } = defineProps<{ dialog: boolean }>()
</script>

<template>
  <slot name="activator" />
  <Teleport to="#app">
    <div
      v-if="dialog"
      dialog-backdrop
    >
      <div class="max-h-full overflow-auto">
        <slot>
          <div dialog-panel />
        </slot>
      </div>
    </div>
  </Teleport>
</template>
