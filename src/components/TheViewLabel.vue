<script setup lang="ts">
import { isFocusedElementEditable, onKeyStroke, useElementVisibility } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import {
  AnnotationType,
  Category,
  useStore as useAnnotationStore,
} from '~/stores/annotation'
import { useStore as useSelectorStore } from '~/stores/selector'
import { useStore as useVisStore } from '~/stores/visualization'

const { visualizations } = storeToRefs(useVisStore())

const selectorStore = useSelectorStore()
const { selectors } = storeToRefs(selectorStore)
/** The visualizations that match the selectors. */
const matched = computed(() => (
  selectorStore.applySelectors(visualizations.value)
))

const content = ref<HTMLDivElement | null>(null)
/** The number of shown visualizations. */
const shownNumber = ref(1)
/** The start index of shown visualizations. */
const startIndex = ref(0)
/** The visualizations that should be shown. */
const shown = computed(() => (
  matched.value.slice(
    startIndex.value,
    startIndex.value + shownNumber.value,
  )
))

const maxStartIndex = computed(() => (
  Math.max(0, matched.value.length - shownNumber.value)
))

const clampStartIndex = (): void => {
  if (startIndex.value > maxStartIndex.value) {
    startIndex.value = maxStartIndex.value
  }
}

watch(matched, clampStartIndex)

/** Show n more entries. */
const showNext = (n: number): void => {
  startIndex.value = Math.min(
    Math.max(0, startIndex.value + n),
    maxStartIndex.value,
  )
  if (content.value !== null) {
    content.value.scrollTop = 0
  }
}

const annotationStore = useAnnotationStore()
const { labelsByUuid } = storeToRefs(annotationStore)
const isClassified = (uuid: string, category: Category): boolean => {
  if (!(uuid in labelsByUuid.value)) return false
  const flag = labelsByUuid.value[uuid]
    .findIndex((d) => (
      d.type === AnnotationType.Classification
      && d.value === category
    )) !== -1
  return flag
}

const {
  isLabeled,
  addClassification,
  removeClassification,
} = annotationStore
const nInPageLabeled = computed(() => (
  shown.value.filter((d) => isLabeled(d.uuid)).length
))

const gotoUnlabeled = (): void => {
  const index = matched.value.findIndex((d) => !isLabeled(d.uuid))
  if (index !== -1) {
    startIndex.value = index
    if (content.value !== null) {
      content.value.scrollTop = 0
    }
  }
}

const container = ref<HTMLDivElement | null>(null)
const isVisible = useElementVisibility(container)

const shouldHandleNavKey = (event: KeyboardEvent): boolean => (
  isVisible.value
  && !event.metaKey
  && !event.ctrlKey
  && !event.altKey
  && !isFocusedElementEditable()
)

onKeyStroke('a', (event) => {
  if (!shouldHandleNavKey(event)) return
  showNext(-shownNumber.value)
})
onKeyStroke('d', (event) => {
  if (!shouldHandleNavKey(event)) return
  showNext(shownNumber.value)
})

const clickCategory = (uuid: string, category: Category): void => {
  if (!isClassified(uuid, category)) addClassification(uuid, category)
  else removeClassification(uuid, category)
}
</script>

<template>
  <div
    ref="container"
    view-container
  >
    <div view-header>
      <div class="i-fa6-solid:table my-auto" />
      <div class="font-bold">
        Entries
      </div>
      <div class="grow" />
      <div class="text-sm my-auto pr-4 flex">
        <div class="font-bold">
          {{ nInPageLabeled }}/{{ shown.length }}&nbsp;
        </div>
        in page labeled
      </div>
      <div
        v-if="selectors.length !== 0"
        class="text-sm my-auto pr-4 flex"
      >
        #matched:&nbsp;
        <div class="font-bold">
          {{ matched.length }}
        </div>
      </div>
      <div class="text-sm my-auto pr-4 flex">
        #entries:&nbsp;
        <div class="font-bold">
          {{ visualizations.length }}
        </div>
      </div>
    </div>
    <div
      v-if="shown.length !== 0"
      ref="content"
      class="scroll-smooth overflow-auto"
    >
      <VDataEntry
        v-for="(d, i) in shown"
        :key="d.uuid"
        :datum="d"
        :index="startIndex + i + 1"
        class="m-1 flex-1 basis-4/5"
      >
        <div class="my-2 flex flex-col gap-2 w-100">
          <div class="flex gap-2">
            <button
              btn
              class="text-xl flex flex-1 gap-2 items-center"
              title="This is a visualization"
              :ring="isClassified(d.uuid, Category.Vis) ? '2 black dark:white' : ''"
              @click="clickCategory(d.uuid, Category.Vis)"
            >
              <div class="i-fa6-solid:check" />
              <div>Vis</div>
            </button>
            <button
              btn-warn
              class="text-xl flex flex-1 gap-2 items-center"
              title="This is not a visualization"
              :ring="isClassified(d.uuid, Category.NotVis) ? '2 black dark:white' : ''"
              @click="clickCategory(d.uuid, Category.NotVis)"
            >
              <div class="i-fa6-solid:xmark" />
              <div>Not Vis</div>
            </button>
          </div>
          <div class="flex gap-2">
            <button
              btn
              class="text-xl flex flex-1 gap-2 items-center"
              title="This is a map"
              :ring="isClassified(d.uuid, Category.Map) ? '2 black dark:white' : ''"
              @click="clickCategory(d.uuid, Category.Map)"
            >
              <div class="i-fa6-solid:check" />
              <div>Map</div>
            </button>
            <button
              btn-warn
              class="text-xl flex flex-1 gap-2 items-center"
              title="This is not a map"
              :ring="isClassified(d.uuid, Category.NotMap) ? '2 black dark:white' : ''"
              @click="clickCategory(d.uuid, Category.NotMap)"
            >
              <div class="i-fa6-solid:xmark" />
              <div>Not Map</div>
            </button>
          </div>
          <div class="flex gap-2">
            <button
              btn
              class="text-xl flex flex-1 gap-2 items-center"
              title="This is mainly a text block"
              :ring="isClassified(d.uuid, Category.Text) ? '2 black dark:white' : ''"
              @click="clickCategory(d.uuid, Category.Text)"
            >
              <div class="i-fa6-solid:check" />
              <div>Text</div>
            </button>
            <button
              btn-warn
              class="text-xl flex flex-1 gap-2 items-center"
              title="This is not a mainly a text block"
              :ring="isClassified(d.uuid, Category.NotText) ? '2 black dark:white' : ''"
              @click="clickCategory(d.uuid, Category.NotText)"
            >
              <div class="i-fa6-solid:xmark" />
              <div>Not Text</div>
            </button>
          </div>
          <div class="flex gap-2">
            <button
              btn
              class="text-xl flex flex-1 gap-2 items-center"
              title="This is mainly a table"
              :ring="isClassified(d.uuid, Category.Table) ? '2 black dark:white' : ''"
              @click="clickCategory(d.uuid, Category.Table)"
            >
              <div class="i-fa6-solid:check" />
              <div>Table</div>
            </button>
            <button
              btn-warn
              class="text-xl flex flex-1 gap-2 items-center"
              title="This is not a mainly a table"
              :ring="isClassified(d.uuid, Category.NotTable) ? '2 black dark:white' : ''"
              @click="clickCategory(d.uuid, Category.NotTable)"
            >
              <div class="i-fa6-solid:xmark" />
              <div>Not Table</div>
            </button>
          </div>
          <div class="flex gap-2">
            <button
              btn-neutral
              class="text-xl flex flex-1 gap-2 items-center"
              title="Not sure if the annotation is accurate"
              :ring="isClassified(d.uuid, Category.Unsure) ? '2 black dark:white' : ''"
              @click="clickCategory(d.uuid, Category.Unsure)"
            >
              <div class="i-fa6-solid:question" />
              <div>Unsure</div>
            </button>
            <button
              btn-neutral
              class="text-xl flex flex-1 gap-2 items-center"
              bg="blue-400 hover:blue-500"
              :ring="isClassified(d.uuid, Category.Confident) ? '2 black dark:white' : ''"
              title="Confident that the annotation is accurate"
              @click="clickCategory(d.uuid, Category.Confident)"
            >
              <div>Confident</div>
            </button>
          </div>
        </div>
      </VDataEntry>
      <div class="m-1 flex gap-1">
        <button
          btn
          :title="`Show previous ${shownNumber} entries`"
          :disabled="startIndex === 0"
          @click="showNext(-shownNumber)"
        >
          <div>previous {{ shownNumber }} {{ shownNumber === 1 ? 'entry' : 'entries' }}</div>
        </button>
        <button
          btn
          :title="`Show next ${shownNumber} entries`"
          :disabled="startIndex + shownNumber >= matched.length"
          @click="showNext(shownNumber)"
        >
          <div>next {{ shownNumber }} {{ shownNumber === 1 ? 'entry' : 'entries' }}</div>
        </button>
        <button
          btn
          title="goto first unlabeled"
          @click="gotoUnlabeled"
        >
          <div>goto first unlabeled</div>
        </button>
      </div>
    </div>
    <div
      v-else
      class="text-xl m-auto"
    >
      No Entries Matched
    </div>
  </div>
</template>
