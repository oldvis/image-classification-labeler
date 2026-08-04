<script setup lang="ts">
const faviconSrc = `${import.meta.env.BASE_URL}favicon.svg`
</script>

<template>
  <nav
    class="flex"
    border="b gray-200"
    p="x-3 y-1"
  >
    <img
      class="pr-1 h-28px"
      :src="faviconSrc"
    >
    <span class="text-lg font-bold">
      OldVisOnline
    </span>
    <TheDialogLogin />
    <div class="text-sm ml-auto gap-6 hidden items-center md:flex">
      <button icon-btn @click="toggleDark()">
        <div i-fa6-regular:sun dark:i-fa6-regular:moon />
      </button>
      <a
        i-fa6-brands:github icon-btn
        rel="noreferrer"
        href="https://github.com/oldvis/image-classification-labeler"
        target="_blank"
        title="GitHub"
      />
    </div>
  </nav>
</template>
