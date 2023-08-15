import { acceptHMRUpdate, defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { groupBy } from 'lodash'
import { useStore as useUserStore } from './user'
import annotations from '~/assets/annotations.json'

export enum AnnotationType {
  Classification = 'Classification',
}

export enum Category {
  Vis = 'Vis',
  NotVis = 'NotVis',
  Map = 'Map',
  NotMap = 'NotMap',
  Text = 'Text',
  NotText = 'NotText',
  Table = 'Table',
  NotTable = 'NotTable',
  Unsure = 'Unsure',
  Confident = 'Confident',
}

export interface Annotation {
  /** The type of annotation. */
  type: AnnotationType
  /** The uuid of the annotation. */
  uuid: string
  /** The uuid of the subject the annotation is associated with. */
  subject: string
  /** The uuid of the user providing the annotation. */
  user: string | null
  /** The annotation content. */
  value: unknown
  /** The time the annotation is finished. */
  time: string
}

export const useStore = defineStore('annotation', {
  state: () => ({
    annotations: annotations as Annotation[],
  }),
  getters: {
    /** The annotations grouped by subject uuid. */
    labelsByUuid(): Record<string, Annotation[]> {
      return groupBy(this.annotations, 'subject')
    },
    /** The uuids of labeled data objects. */
    labeledUuids(): Set<string> {
      return new Set(Object.keys(this.labelsByUuid))
    },
    /** The uuids of data objects labeled unsure. */
    unsureUuids(): Set<string> {
      return new Set(this.annotations
        .filter((d) => d.type === AnnotationType.Classification && d.value === Category.Unsure)
        .map((d) => d.subject))
    },
  },
  actions: {
    /** Try adding a classification annotation. */
    addClassification(subject: string, value: Category): void {
      const userStore = useUserStore()
      const type = AnnotationType.Classification
      const user = userStore.uuid

      /** Whether to replace old annotation. */
      const index = this.annotations.findIndex((d) => (
        d.type === type
          && d.subject === subject
          && (
            ((value === Category.Vis || value === Category.NotVis)
              && (d.value === Category.Vis || d.value === Category.NotVis))
            || ((value === Category.Map || value === Category.NotMap)
              && (d.value === Category.Map || d.value === Category.NotMap))
            || ((value === Category.Text || value === Category.NotText)
              && (d.value === Category.Text || d.value === Category.NotText))
            || ((value === Category.Table || value === Category.NotTable)
              && (d.value === Category.Table || d.value === Category.NotTable))
          )
      ))
      const replace = index !== -1
      const annotation: Annotation = {
        type,
        uuid: uuidv4(),
        subject,
        user,
        value,
        time: new Date().toISOString(),
      }
      if (!replace) this.annotations.push(annotation)
      else this.annotations[index] = annotation
    },
    /** Try removing a classification annotation. */
    removeClassification(subject: string, value: Category): void {
      const type = AnnotationType.Classification

      /** Whether to replace old annotation. */
      const index = this.annotations.findIndex((d) => (
        d.type === type
          && d.subject === subject
          && d.value === value
      ))
      if (index !== -1) {
        this.annotations.splice(index, 1)
      }
    },
    /** Check if a data entry is labeled */
    isLabeled(uuid: string): boolean {
      return this.labeledUuids.has(uuid)
    },
  },
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
