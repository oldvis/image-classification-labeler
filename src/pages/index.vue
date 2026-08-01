<script setup lang="ts">
import { useSignInNotice } from '~/composables/useSignInNotice'

useSignInNotice()
</script>

<template>
  <div
    class="m-1 grow gap-1 overflow-auto"
    flex="~ col"
  >
    <TheViewSelectors />
    <TheViewLabel class="grow" />
    <TheViewLabelProgress />
  </div>
</template>
