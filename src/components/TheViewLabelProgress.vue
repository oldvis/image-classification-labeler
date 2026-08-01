<script setup lang="ts">
import { groupBy } from 'lodash'
import { storeToRefs } from 'pinia'
import { saveJsonFile, uploadJsonFile } from '~/plugins/file'
import { AnnotationType, Category, isAnnotationArray, useStore as useAnnotationStore } from '~/stores/annotation'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useVisStore } from '~/stores/visualization'

const annotationStore = useAnnotationStore()
const { annotations, labeledUuids } = storeToRefs(annotationStore)
const { visualizations } = storeToRefs(useVisStore())
const { addErrorMessage, addSuccessMessage } = useMessageStore()

// Group classification labels by value.
const labelsByValue = computed(() => {
  const clfLabels = annotations.value
    .filter((d) => d.type === AnnotationType.Classification)
  return groupBy(clfLabels, 'value')
})

const nVis = computed(() => (labelsByValue.value[Category.Vis]?.length ?? 0))
const nNotVis = computed(() => (labelsByValue.value[Category.NotVis]?.length ?? 0))
const nMap = computed(() => (labelsByValue.value[Category.Map]?.length ?? 0))
const nNotMap = computed(() => (labelsByValue.value[Category.NotMap]?.length ?? 0))
const nText = computed(() => (labelsByValue.value[Category.Text]?.length ?? 0))
const nNotText = computed(() => (labelsByValue.value[Category.NotText]?.length ?? 0))
const nTable = computed(() => (labelsByValue.value[Category.Table]?.length ?? 0))
const nNotTable = computed(() => (labelsByValue.value[Category.NotTable]?.length ?? 0))
const nUnsure = computed(() => (labelsByValue.value[Category.Unsure]?.length ?? 0))
const nConfident = computed(() => (labelsByValue.value[Category.Confident]?.length ?? 0))
const nUnlabeled = computed(() => (visualizations.value.length - labeledUuids.value.size))

const save = () => {
  saveJsonFile(annotations.value, 'annotations.json')
}
const upload = async () => {
  try {
    const data = await uploadJsonFile()
    if (data === null) return
    if (!isAnnotationArray(data)) {
      addErrorMessage('Upload failed: file is not an annotations array')
      return
    }
    annotations.value = data
    addSuccessMessage('Annotations uploaded')
  }
  catch {
    addErrorMessage('Upload failed: invalid JSON')
  }
}
</script>

<template>
  <div
    class="px-1 flex gap-1"
    border="~ gray-200"
  >
    <div class="text-sm flex gap-1">
      <div class="i-fa6-solid:list-check my-auto" />
      <div class="font-bold my-auto">
        Progress
      </div>
    </div>
    <div class="text-sm flex grow gap-1">
      <template
        v-for="(d, i) in [
          { title: '#Vis/Not:', value: `${nVis} / ${nNotVis}` },
          { title: '#Map/Not:', value: `${nMap} / ${nNotMap}` },
          { title: '#Text/Not:', value: `${nText} / ${nNotText}` },
          { title: '#Table/Not:', value: `${nTable} / ${nNotTable}` },
          { title: '#Unsure:', value: `${nUnsure}` },
          { title: '#Not-Labeled:', value: `${nUnlabeled}` },
          { title: '#Confident:', value: `${nConfident}` },
        ]" :key="d.title"
      >
        <div v-if="i === 0" class="my-1 border-l border-gray-200" />
        <div class="my-auto flex grow gap-1">
          {{ d.title }}
          <div class="font-bold">
            {{ d.value }}
          </div>
        </div>
        <div class="my-1 border-l border-gray-200" />
      </template>
    </div>
    <div class="my-1 flex gap-1">
      <button btn @click="save">
        download
      </button>
      <button btn @click="upload">
        upload
      </button>
    </div>
  </div>
</template>
