<script setup lang="ts">
const faviconSrc = `${import.meta.env.BASE_URL}favicon.svg`
</script>

<template>
  <nav
    class="strip bg-white dark:bg-hex-121212"
    border="b gray-200 dark:gray-700"
  >
    <div class="flex shrink-0 gap-1 items-center">
      <img
        class="h-5 w-5"
        :src="faviconSrc"
        alt=""
      >
      <span class="text-sm font-semibold">
        OldVis<span class="text-gray-500 font-normal dark:text-gray-400"> · Classify</span>
      </span>
    </div>
    <div class="ml-auto flex shrink-0 gap-1 items-center">
      <TheDialogLogin />
      <button
        type="button"
        icon-btn
        title="Toggle color theme"
        @click="toggleDark()"
      >
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
