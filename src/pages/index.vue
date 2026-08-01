<script setup lang="ts">
import { useSignInNotice } from '~/composables/useSignInNotice'

useSignInNotice()
</script>

<template>
  <div
    class="grow overflow-auto m-1 gap-1"
    flex="~ col"
  >
    <TheViewSelectors />
    <TheViewLabel class="grow" />
    <TheViewLabelProgress />
  </div>
</template>
