<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { saveJsonFile, uploadJsonFile } from '~/plugins/file'
import {
  Category,
  parseUploadedAnnotations,
  useStore as useAnnotationStore,
} from '~/stores/annotation'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useVisStore } from '~/stores/visualization'

const annotationStore = useAnnotationStore()
const { annotations, labeledCount, classificationCountByValue } = storeToRefs(annotationStore)
const { visualizations } = storeToRefs(useVisStore())
const { addErrorMessage, addSuccessMessage } = useMessageStore()
const showDetails = ref(false)

const nVis = computed(() => classificationCountByValue.value[Category.Vis])
const nNotVis = computed(() => classificationCountByValue.value[Category.NotVis])
const nMap = computed(() => classificationCountByValue.value[Category.Map])
const nNotMap = computed(() => classificationCountByValue.value[Category.NotMap])
const nText = computed(() => classificationCountByValue.value[Category.Text])
const nNotText = computed(() => classificationCountByValue.value[Category.NotText])
const nTable = computed(() => classificationCountByValue.value[Category.Table])
const nNotTable = computed(() => classificationCountByValue.value[Category.NotTable])
const nUnsure = computed(() => classificationCountByValue.value[Category.Unsure])
const nConfident = computed(() => classificationCountByValue.value[Category.Confident])
const nUnlabeled = computed(() => (visualizations.value.length - labeledCount.value))

const save = () => {
  saveJsonFile(annotations.value, 'annotations.json')
}
const upload = async () => {
  try {
    const data = await uploadJsonFile()
    if (data === null) return
    const knownSubjects = new Set(visualizations.value.map((d) => d.uuid))
    const parsed = parseUploadedAnnotations(data, knownSubjects)
    if (!parsed.ok) {
      addErrorMessage(parsed.error)
      return
    }
    annotationStore.setAnnotations(parsed.data)
    addSuccessMessage('Annotations uploaded')
  }
  catch {
    addErrorMessage('Upload failed: invalid JSON')
  }
}
</script>

<template>
  <div status-strip>
    <div class="flex shrink-0 gap-1.5 items-center">
      <div class="i-fa6-solid:list-check text-gray-500 my-auto" />
      <div strip-label>
        Progress
      </div>
    </div>
    <div class="strip-meta flex grow flex-wrap gap-x-1.5 gap-y-1 min-w-0 items-center">
      <span>
        Labeled
        <span strip-meta-em>{{ labeledCount }}</span>
        /
        <span strip-meta-em>{{ visualizations.length }}</span>
      </span>
      <span
        strip-sep
        aria-hidden="true"
      >·</span>
      <span>
        Unlabeled
        <span strip-meta-em>{{ nUnlabeled }}</span>
      </span>
      <span
        strip-sep
        aria-hidden="true"
      >|</span>
      <span>
        Unsure
        <span strip-meta-em>{{ nUnsure }}</span>
      </span>
      <span
        strip-sep
        aria-hidden="true"
      >·</span>
      <span>
        Confident
        <span strip-meta-em>{{ nConfident }}</span>
      </span>
      <button
        type="button"
        class="btn-ghost ml-1"
        :title="showDetails ? 'Hide category pair counts' : 'Show category pair counts'"
        @click="showDetails = !showDetails"
      >
        {{ showDetails ? 'Hide Details' : 'Details' }}
      </button>
      <template v-if="showDetails">
        <span>Vis/Not <span strip-meta-em>{{ nVis }} / {{ nNotVis }}</span></span>
        <span
          strip-sep
          aria-hidden="true"
        >·</span>
        <span>Map/Not <span strip-meta-em>{{ nMap }} / {{ nNotMap }}</span></span>
        <span
          strip-sep
          aria-hidden="true"
        >·</span>
        <span>Text/Not <span strip-meta-em>{{ nText }} / {{ nNotText }}</span></span>
        <span
          strip-sep
          aria-hidden="true"
        >·</span>
        <span>Table/Not <span strip-meta-em>{{ nTable }} / {{ nNotTable }}</span></span>
      </template>
    </div>
    <div class="ml-auto flex shrink-0 gap-1">
      <button
        btn-secondary
        title="Download annotations.json (not saved in the browser)"
        @click="save"
      >
        Download
      </button>
      <button
        btn-secondary
        title="Upload annotations.json (replaces current annotations)"
        @click="upload"
      >
        Upload
      </button>
    </div>
  </div>
</template>
