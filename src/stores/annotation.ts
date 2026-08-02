import { groupBy } from 'lodash'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import annotationsUrl from '~/assets/annotations.json?url'
import { useStore as useUserStore } from './user'

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
  value: Category
  /** The time the annotation is finished. */
  time: string
}

export const annotationSchema = z.object({
  type: z.enum(AnnotationType),
  uuid: z.string().min(1),
  subject: z.string().min(1),
  user: z.string().nullable(),
  value: z.enum(Category),
  time: z.string().min(1),
})

export const annotationsSchema = z.array(annotationSchema)

export const isAnnotationArray = (value: unknown): value is Annotation[] => (
  annotationsSchema.safeParse(value).success
)

export const loadAnnotations = async (): Promise<Annotation[]> => {
  const response = await fetch(annotationsUrl)
  if (!response.ok) {
    throw new Error(`Failed to load annotations (${response.status})`)
  }
  const parsed = annotationsSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new Error('Failed to load annotations: invalid annotations JSON')
  }
  return parsed.data
}

/** Whether two classification values are the same replace-pair (Vis/NotVis, …). */
export const sameClassificationPair = (a: Category, b: Category): boolean => (
  ((a === Category.Vis || a === Category.NotVis)
    && (b === Category.Vis || b === Category.NotVis))
  || ((a === Category.Map || a === Category.NotMap)
    && (b === Category.Map || b === Category.NotMap))
  || ((a === Category.Text || a === Category.NotText)
    && (b === Category.Text || b === Category.NotText))
  || ((a === Category.Table || a === Category.NotTable)
    && (b === Category.Table || b === Category.NotTable))
)

export const useStore = defineStore('annotation', {
  state: () => ({
    annotations: [] as Annotation[],
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
        && sameClassificationPair(d.value, value)
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
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
