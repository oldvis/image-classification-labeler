<script setup lang="ts">
import type { Annotation } from '~/stores/annotation'
import { groupBy } from 'lodash'
import { storeToRefs } from 'pinia'
import { saveJsonFile, uploadJsonFile } from '~/plugins/file'
import { AnnotationType, Category, useStore as useAnnotationStore } from '~/stores/annotation'
import { useStore as useVisStore } from '~/stores/visualization'

const annotationStore = useAnnotationStore()
const { annotations, labeledUuids } = storeToRefs(annotationStore)
const { visualizations } = storeToRefs(useVisStore())

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
  annotations.value = (await uploadJsonFile()) as Annotation[]
}
</script>

<template>
  <div
    class="flex gap-1 px-1"
    border="~ gray-200"
  >
    <div class="flex gap-1 text-sm">
      <div class="i-fa6-solid:list-check my-auto" />
      <div class="font-bold my-auto">
        Progress
      </div>
    </div>
    <div class="flex gap-1 text-sm grow">
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
        <div v-if="i === 0" class="border-l my-1" />
        <div class="flex gap-1 my-auto grow">
          {{ d.title }}
          <div class="font-bold">
            {{ d.value }}
          </div>
        </div>
        <div class="border-l my-1" />
      </template>
    </div>
    <div class="flex gap-1 my-1">
      <button btn @click="save">
        download
      </button>
      <button btn @click="upload">
        upload
      </button>
    </div>
  </div>
</template>
