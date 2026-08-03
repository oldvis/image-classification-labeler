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
  index: {
    type: Number as PropType<number | null>,
    default: null,
  },
})

const { datum } = toRefs(props)
const showMetadata = ref(false)
const { addSuccessMessage, addErrorMessage } = useStore()
const { copy, copied } = useClipboard()

const onClickCopy = async () => {
  await copy(JSON.stringify(datum.value))
  if (copied.value) {
    addSuccessMessage('Metadata Copied.')
  }
  else {
    addErrorMessage('Failed to copy metadata.')
  }
}

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

const isHttps = (url: string | null | undefined): boolean => {
  const safe = safeHttpUrl(url)
  if (safe === null) return false
  return new URL(safe).protocol === 'https:'
}

const viewHref = computed(() => safeHttpUrl(datum.value.viewUrl))
const googleHref = computed(() => (
  `https://www.google.com/search?q=${encodeURIComponent(datum.value.displayName ?? '')}`
))
</script>

<template>
  <div
    class="text-sm p-1"
    bg="slate-100 dark:slate-900"
    border="~ gray-200 rounded"
  >
    <div class="flex">
      <div v-if="index !== null" class="text-gray">
        {{ index }}. &nbsp;
      </div>
      <b>{{ datum.displayName }}</b>
    </div>
    <div
      class="pt-1 gap-1"
      flex="~ col sm:row"
    >
      <div class="basis-4/10">
        <img
          v-if="isHttps(datum.downloadUrl)"
          :src="datum.downloadUrl ?? ''"
        >
        <span v-else>
          The image resource is not served with HTTPS.
          Please click the URL button to view it.
        </span>
      </div>
      <div
        class="basis-6/10"
        flex="~ col"
      >
        <div>
          <b>author</b>: {{ datum.authors?.join(' / ') ?? 'unknown' }}
        </div>
        <div>
          <b>year</b>: {{ datum.publishDate ?? 'unknown' }}
        </div>
        <div>
          <b>source</b>: {{ datum.source?.name ?? 'unknown' }}
        </div>
        <div>
          <b>language</b>: {{ datum.languages?.join(', ') ?? 'unknown' }}
        </div>
        <div v-if="datum.tags !== undefined && datum.tags.length !== 0">
          <b>tags</b>: {{ datum.tags?.join(', ') }}
        </div>
        <div v-if="datum.abstract !== undefined && datum.abstract !== null">
          <b>abstract</b>: {{ datum.abstract }}
        </div>
        <div class="flex gap-1">
          <button
            class="icon-btn flex gap-1"
            title="View raw metadata of this entry"
            @click="showMetadata = !showMetadata"
          >
            <div class="i-fa6-solid:database my-auto" />
            <div class="my-auto">
              view metadata
            </div>
          </button>
          <button
            class="icon-btn flex gap-1"
            title="Copy raw metadata of this entry"
            @click="onClickCopy"
          >
            <div class="i-fa6-solid:copy my-auto" />
            <div class="my-auto">
              copy metadata
            </div>
          </button>
          <a
            v-if="viewHref !== null"
            class="icon-btn flex gap-1"
            title="Open original URL in a new tab"
            target="_blank"
            rel="noopener noreferrer"
            :href="viewHref"
          >
            <div class="i-fa6-solid:globe my-auto" />
            <div class="my-auto">
              url
            </div>
          </a>
          <span
            v-else
            class="icon-btn opacity-50 flex gap-1"
            title="Original URL is missing or invalid"
          >
            <div class="i-fa6-solid:globe my-auto" />
            <div class="my-auto">
              url
            </div>
          </span>
          <a
            class="icon-btn flex gap-1"
            title="Search title in Google"
            target="_blank"
            rel="noopener noreferrer"
            :href="googleHref"
          >
            <div class="i-fa6-brands:google my-auto" />
            <div class="my-auto">
              google
            </div>
          </a>
        </div>
        <div
          v-if="showMetadata"
          class="border border-gray-200"
        >
          <VObjectInspector
            :data="datum"
            :expand-level="5"
            :dark-theme="isDark"
          />
        </div>
        <slot />
      </div>
    </div>
  </div>
</template>
