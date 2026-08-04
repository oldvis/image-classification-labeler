<script setup lang="ts">
import type { Visualization } from '~/plugins/visualization'
import { useClipboard } from '@vueuse/core'
import { VObjectInspector } from 'v-object-inspector'
import { isDark } from '~/composables/dark'
import { useStore } from '~/stores/message'
import 'v-object-inspector/dist/style.css'

const props = defineProps({
  /** Render the given part of the visualization metadata. */
  datum: {
    type: Object as PropType<Partial<Visualization>>,
    required: true,
  },
})

const { datum } = toRefs(props)
const showMetadata = ref(false)
const imageFailed = ref(false)
const imageLoading = ref(false)
const { addSuccessMessage, addErrorMessage } = useStore()
const { copy, copied } = useClipboard()

/** Parse only http(s) URLs; malformed or other schemes return null. */
const safeHttpUrl = (url: string | null | undefined): string | null => {
  if (url === null || url === undefined || url === '') return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url
    }
    return null
  }
  catch {
    return null
  }
}

const downloadUrlKind = computed((): 'https' | 'http' | 'unavailable' => {
  const safe = safeHttpUrl(datum.value.downloadUrl)
  if (safe === null) return 'unavailable'
  return new URL(safe).protocol === 'https:' ? 'https' : 'http'
})

const resetImageState = (): void => {
  imageFailed.value = false
  imageLoading.value = downloadUrlKind.value === 'https'
}

watch(() => datum.value.downloadUrl, resetImageState, { immediate: true })

const onImageLoad = (): void => {
  imageLoading.value = false
}

const onImageError = (): void => {
  imageLoading.value = false
  imageFailed.value = true
}

/** Cached images may finish before @load binds — sync from the element. */
const onImageRef = (el: unknown): void => {
  const img = el as HTMLImageElement | null
  if (img !== null && img.complete) {
    if (img.naturalWidth > 0) onImageLoad()
    else onImageError()
  }
}

const onClickCopy = async () => {
  await copy(JSON.stringify(datum.value))
  if (copied.value) {
    addSuccessMessage('Metadata copied')
  }
  else {
    addErrorMessage('Failed to copy metadata')
  }
}

const viewHref = computed(() => safeHttpUrl(datum.value.viewUrl))
const googleHref = computed(() => (
  `https://www.google.com/search?q=${encodeURIComponent(datum.value.displayName ?? '')}`
))
</script>

<template>
  <div
    class="text-sm grow min-h-0"
    flex="~ col lg:row"
  >
    <!-- Image pane: fill remaining height -->
    <div
      class="border-b border-gray-200 min-h-0 min-w-0 lg:border-b-0 lg:border-r dark:border-gray-700 lg:w-3/5"
      flex="~ col"
    >
      <div
        class="flex grow min-h-0 items-center justify-center relative overflow-hidden"
        bg="white dark:gray-950"
      >
        <div
          v-if="downloadUrlKind === 'https' && imageLoading && !imageFailed"
          class="text-sm text-gray-500 flex gap-2 items-center inset-0 justify-center absolute z-1"
        >
          <div
            class="i-fa6-solid:spinner"
            animate-spin
          />
          Loading image
        </div>
        <img
          v-if="downloadUrlKind === 'https' && !imageFailed"
          :ref="onImageRef"
          class="p-1 h-full w-full object-contain"
          :class="imageLoading ? 'opacity-0' : 'opacity-100'"
          :src="datum.downloadUrl ?? ''"
          decoding="async"
          @load="onImageLoad"
          @error="onImageError"
        >
        <span
          v-else-if="imageFailed"
          class="text-gray-600 p-3 text-center dark:text-gray-300"
        >
          Image failed to load.
          Please use URL to view it.
        </span>
        <span
          v-else-if="downloadUrlKind === 'http'"
          class="text-gray-600 p-3 text-center dark:text-gray-300"
        >
          The image is served over HTTP (not HTTPS).
          Please use URL to view it.
        </span>
        <span
          v-else
          class="text-gray-600 p-3 text-center dark:text-gray-300"
        >
          The image URL is missing or invalid.
          Please use URL to view it.
        </span>
      </div>
      <div
        v-if="$slots['image-footer']"
        class="status-strip border-t border-gray-200 shrink-0 dark:border-gray-700"
      >
        <slot name="image-footer" />
      </div>
    </div>

    <!-- Side pane -->
    <div
      class="p-1.5 gap-1.5 min-h-0 min-w-0 overflow-auto lg:w-2/5"
      flex="~ col"
      bg="gray-50 dark:gray-900"
    >
      <div class="shrink-0">
        <h3 class="text-sm leading-snug font-semibold m-0">
          {{ datum.displayName }}
        </h3>
      </div>
      <div class="text-sm text-gray-800 shrink-0 gap-0.5 dark:text-gray-200" flex="~ col">
        <div>
          <span class="font-semibold">Author</span>: {{ datum.authors?.join(' / ') ?? 'unknown' }}
        </div>
        <div>
          <span class="font-semibold">Year</span>: {{ datum.publishDate ?? 'unknown' }}
        </div>
        <div>
          <span class="font-semibold">Source</span>: {{ datum.source?.name ?? 'unknown' }}
        </div>
        <div>
          <span class="font-semibold">Language</span>: {{ datum.languages?.join(', ') ?? 'unknown' }}
        </div>
        <div v-if="datum.tags !== undefined && datum.tags.length !== 0">
          <span class="font-semibold">Tags</span>: {{ datum.tags?.join(', ') }}
        </div>
        <div
          v-if="datum.abstract !== undefined && datum.abstract !== null"
          class="line-clamp-2"
        >
          <span class="font-semibold">Abstract</span>: {{ datum.abstract }}
        </div>
      </div>
      <div class="shrink-0">
        <slot />
      </div>
      <div class="flex shrink-0 flex-wrap gap-0.5">
        <button
          type="button"
          class="btn-ghost flex gap-1"
          title="View raw metadata of this entry"
          @click="showMetadata = !showMetadata"
        >
          <div class="i-fa6-solid:database my-auto" />
          <div class="my-auto">
            View Metadata
          </div>
        </button>
        <button
          type="button"
          class="btn-ghost flex gap-1"
          title="Copy raw metadata of this entry"
          @click="onClickCopy"
        >
          <div class="i-fa6-solid:copy my-auto" />
          <div class="my-auto">
            Copy
          </div>
        </button>
        <a
          v-if="viewHref !== null"
          class="btn-ghost flex gap-1"
          title="Open original URL in a new tab"
          target="_blank"
          rel="noopener noreferrer"
          :href="viewHref"
        >
          <div class="i-fa6-solid:globe my-auto" />
          <div class="my-auto">
            URL
          </div>
        </a>
        <span
          v-else
          class="btn-ghost opacity-50 flex gap-1"
          title="Original URL is missing or invalid"
        >
          <div class="i-fa6-solid:globe my-auto" />
          <div class="my-auto">
            URL
          </div>
        </span>
        <a
          class="btn-ghost flex gap-1"
          title="Search title in Google"
          target="_blank"
          rel="noopener noreferrer"
          :href="googleHref"
        >
          <div class="i-fa6-brands:google my-auto" />
          <div class="my-auto">
            Google
          </div>
        </a>
      </div>
      <div
        v-if="showMetadata"
        class="border border-gray-200 bg-white shrink-0 min-w-0 w-full overflow-x-auto dark:border-gray-700 dark:bg-gray-900"
      >
        <div class="p-1 min-w-full inline-block">
          <VObjectInspector
            :data="datum"
            :expand-level="5"
            :dark-theme="isDark"
          />
        </div>
      </div>
    </div>
  </div>
</template>
