<script setup lang="ts">
import { isFocusedElementEditable, onKeyStroke, useElementVisibility } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { Category, useStore as useAnnotationStore } from '~/stores/annotation'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useSelectorStore } from '~/stores/selector'
import { useStore as useVisStore } from '~/stores/visualization'

type LabelTone = 'yes' | 'no' | 'neutral' | 'confident'

interface LabelControl {
  category: Category
  key: string
  label: string
  title: string
  tone: LabelTone
  icon?: 'check' | 'xmark' | 'question'
}

/** Mockup map: odd = affirmative column, even = negative; 9/0 = Unsure/Confident. */
const labelControls: LabelControl[] = [
  { category: Category.Vis, key: '1', label: 'Vis', title: 'This is a visualization', tone: 'yes', icon: 'check' },
  { category: Category.NotVis, key: '2', label: 'Not Vis', title: 'This is not a visualization', tone: 'no', icon: 'xmark' },
  { category: Category.Map, key: '3', label: 'Map', title: 'This is a map', tone: 'yes', icon: 'check' },
  { category: Category.NotMap, key: '4', label: 'Not Map', title: 'This is not a map', tone: 'no', icon: 'xmark' },
  { category: Category.Text, key: '5', label: 'Text', title: 'This is mainly a text block', tone: 'yes', icon: 'check' },
  { category: Category.NotText, key: '6', label: 'Not Text', title: 'This is not a mainly a text block', tone: 'no', icon: 'xmark' },
  { category: Category.Table, key: '7', label: 'Table', title: 'This is mainly a table', tone: 'yes', icon: 'check' },
  { category: Category.NotTable, key: '8', label: 'Not Table', title: 'This is not a mainly a table', tone: 'no', icon: 'xmark' },
  { category: Category.Unsure, key: '9', label: 'Unsure', title: 'Not sure if the annotation is accurate', tone: 'neutral', icon: 'question' },
  { category: Category.Confident, key: '0', label: 'Confident', title: 'Confident that the annotation is accurate', tone: 'confident' },
]

const labelRows = computed(() => {
  const rows: LabelControl[][] = []
  for (let i = 0; i < labelControls.length; i += 2) {
    rows.push(labelControls.slice(i, i + 2))
  }
  return rows
})

const categoryByKey = Object.fromEntries(
  labelControls.map((control) => [control.key, control.category]),
) as Record<string, Category>

const labelButtonClass = (tone: LabelTone): string => {
  if (tone === 'yes') return 'btn-label'
  if (tone === 'no') return 'btn-label-warn'
  if (tone === 'confident') return 'btn-label-confident'
  return 'btn-label-neutral'
}

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

const {
  isClassified,
  isLabeled,
  addClassification,
  removeClassification,
} = useAnnotationStore()
const nInPageLabeled = computed(() => (
  shown.value.filter((d) => isLabeled(d.uuid)).length
))

const { addSuccessMessage } = useMessageStore()

const gotoUnlabeled = (): void => {
  const index = matched.value.findIndex((d) => !isLabeled(d.uuid))
  if (index === -1) {
    addSuccessMessage('No unlabeled entries left')
    return
  }
  startIndex.value = index
  if (content.value !== null) {
    content.value.scrollTop = 0
  }
}

const container = ref<HTMLDivElement | null>(null)
const isVisible = useElementVisibility(container)

const shouldHandleHotkey = (event: KeyboardEvent): boolean => (
  isVisible.value
  && !event.metaKey
  && !event.ctrlKey
  && !event.altKey
  && !isFocusedElementEditable()
)

const clickCategory = (uuid: string, category: Category): void => {
  if (!isClassified(uuid, category)) addClassification(uuid, category)
  else removeClassification(uuid, category)
}

/** Apply a label hotkey to the first shown entry (paging shows one by default). */
const applyCategoryHotkey = (category: Category): void => {
  const entry = shown.value[0]
  if (entry === undefined) return
  clickCategory(entry.uuid, category)
}

onKeyStroke('a', (event) => {
  if (!shouldHandleHotkey(event)) return
  event.preventDefault()
  showNext(-shownNumber.value)
})
onKeyStroke('d', (event) => {
  if (!shouldHandleHotkey(event)) return
  event.preventDefault()
  showNext(shownNumber.value)
})

for (const key of Object.keys(categoryByKey)) {
  onKeyStroke(key, (event) => {
    if (!shouldHandleHotkey(event)) return
    event.preventDefault()
    applyCategoryHotkey(categoryByKey[key]!)
  })
}

const positionLabel = computed(() => {
  if (matched.value.length === 0) return '0 / 0'
  return `${startIndex.value + 1} / ${matched.value.length}`
})
</script>

<template>
  <div
    ref="container"
    view-container
    class="border-t-0 rounded-t-none grow min-h-0"
  >
    <div
      data-testid="entries-stats"
      view-header
    >
      <div class="i-fa6-solid:images text-gray-500 shrink-0" />
      <div strip-label>
        Entries
      </div>
      <div class="grow" />
      <div class="strip-meta flex flex-wrap gap-x-1.5 gap-y-1 items-center">
        <span>
          <span strip-meta-em>{{ nInPageLabeled }}/{{ shown.length }}</span>
          labeled on page
        </span>
        <template v-if="selectors.length !== 0">
          <span
            strip-sep
            aria-hidden="true"
          >·</span>
          <span>
            <span strip-meta-em>{{ matched.length }}</span>
            matched
          </span>
        </template>
        <span
          strip-sep
          aria-hidden="true"
        >·</span>
        <span>
          <span strip-meta-em>{{ visualizations.length }}</span>
          entries
        </span>
      </div>
    </div>
    <div
      v-if="shown.length !== 0"
      ref="content"
      class="scroll-smooth flex grow flex-col min-h-0 overflow-auto"
    >
      <VDataEntry
        v-for="d in shown"
        :key="d.uuid"
        :datum="d"
        class="grow min-h-0"
      >
        <div class="flex flex-col gap-1.5 w-full">
          <div
            v-for="(row, rowIndex) in labelRows"
            :key="rowIndex"
            class="flex gap-1.5"
          >
            <button
              v-for="control in row"
              :key="control.category"
              type="button"
              class="flex flex-1 gap-1.5 items-center justify-center"
              :class="labelButtonClass(control.tone)"
              :title="`${control.title} (${control.key})`"
              :ring="isClassified(d.uuid, control.category) ? '2 black dark:white' : ''"
              @click="clickCategory(d.uuid, control.category)"
            >
              <div
                v-if="control.icon === 'check'"
                class="i-fa6-solid:check"
              />
              <div
                v-else-if="control.icon === 'xmark'"
                class="i-fa6-solid:xmark"
              />
              <div
                v-else-if="control.icon === 'question'"
                class="i-fa6-solid:question"
              />
              <div>{{ control.label }}</div>
              <span
                kbd
                aria-hidden="true"
              >{{ control.key }}</span>
            </button>
          </div>
        </div>
        <template #image-footer>
          <!--
            `contents` so the cluster + position are strip flex children (ml-auto works).
            Buttons stay in an inner gap-1 group — same density as pills / Download·Upload.
          -->
          <div class="contents">
            <div class="flex flex-wrap gap-1 items-center">
              <button
                type="button"
                btn-secondary
                :title="`Show previous ${shownNumber} entries (A)`"
                :disabled="startIndex === 0"
                @click="showNext(-shownNumber)"
              >
                Previous
                <span
                  kbd
                  aria-hidden="true"
                >A</span>
              </button>
              <button
                type="button"
                btn-secondary
                :title="`Show next ${shownNumber} entries (D)`"
                :disabled="startIndex + shownNumber >= matched.length"
                @click="showNext(shownNumber)"
              >
                Next
                <span
                  kbd
                  aria-hidden="true"
                >D</span>
              </button>
              <button
                type="button"
                btn-secondary
                title="Go to First Unlabeled"
                @click="gotoUnlabeled"
              >
                Go to First Unlabeled
              </button>
            </div>
            <span class="strip-meta ml-auto">
              {{ positionLabel }}
            </span>
          </div>
        </template>
      </VDataEntry>
    </div>
    <div
      v-else
      class="text-xl m-auto"
    >
      No Entries Matched
    </div>
  </div>
</template>
