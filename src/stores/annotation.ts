import { acceptHMRUpdate, defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { computed, markRaw, reactive, shallowRef } from 'vue'
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

const classificationPairId = (value: Category): string | null => {
  if (value === Category.Vis || value === Category.NotVis) return 'vis'
  if (value === Category.Map || value === Category.NotMap) return 'map'
  if (value === Category.Text || value === Category.NotText) return 'text'
  if (value === Category.Table || value === Category.NotTable) return 'table'
  return null
}

/**
 * Validate uploaded annotations against the loaded dataset.
 *
 * Subject membership is enforced here (not in progress counters): `#Not-Labeled`
 * is `visualizations.length - labeledCount`, which goes negative or otherwise
 * misreports if annotations reference subjects outside the loaded catalog.
 * Upload is the boundary where untrusted files enter; keep that invariant there
 * so UI stats can stay O(1).
 *
 * Also rejects duplicate annotation uuids, duplicate subject+value rows, and
 * contradictory same-pair classifications (e.g. Vis and NotVis on one subject).
 */
export const parseUploadedAnnotations = (
  value: unknown,
  knownSubjects: ReadonlySet<string>,
): { ok: true, data: Annotation[] } | { ok: false, error: string } => {
  const parsed = annotationsSchema.safeParse(value)
  if (!parsed.success) {
    return { ok: false, error: 'Upload failed: file is not an annotations array' }
  }

  const seenUuids = new Set<string>()
  const seenSubjectValues = new Set<string>()
  const seenPairs = new Map<string, Category>()

  for (const annotation of parsed.data) {
    if (!knownSubjects.has(annotation.subject)) {
      return { ok: false, error: 'Upload failed: annotation subject is not in the dataset' }
    }
    if (seenUuids.has(annotation.uuid)) {
      return { ok: false, error: 'Upload failed: duplicate annotation uuid' }
    }
    seenUuids.add(annotation.uuid)

    const subjectValueKey = `${annotation.subject}:${annotation.value}`
    if (seenSubjectValues.has(subjectValueKey)) {
      return { ok: false, error: 'Upload failed: duplicate classification for the same subject' }
    }
    seenSubjectValues.add(subjectValueKey)

    const pairId = classificationPairId(annotation.value)
    if (pairId !== null) {
      const pairKey = `${annotation.subject}:${pairId}`
      const existing = seenPairs.get(pairKey)
      if (existing !== undefined && existing !== annotation.value) {
        return {
          ok: false,
          error: 'Upload failed: contradictory classifications for the same subject',
        }
      }
      seenPairs.set(pairKey, annotation.value)
    }
  }

  return { ok: true, data: parsed.data }
}

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

const emptyCountByValue = (): Record<Category, number> => ({
  [Category.Vis]: 0,
  [Category.NotVis]: 0,
  [Category.Map]: 0,
  [Category.NotMap]: 0,
  [Category.Text]: 0,
  [Category.NotText]: 0,
  [Category.Table]: 0,
  [Category.NotTable]: 0,
  [Category.Unsure]: 0,
  [Category.Confident]: 0,
})

const bumpCount = (
  countByValue: Record<Category, number>,
  value: Category,
  delta: number,
): void => {
  countByValue[value] += delta
}

const toRawAnnotations = (annotations: Annotation[]): Annotation[] => (
  markRaw(annotations.map((annotation) => markRaw(annotation)))
)

const buildIndexes = (annotations: Annotation[]) => {
  const labelsBySubject: Record<string, Annotation[]> = {}
  const labeledSubjectUuids = new Set<string>()
  const unsureSubjectUuids = new Set<string>()
  const uuidToIndex = new Map<string, number>()
  const countByValue = emptyCountByValue()

  for (let i = 0; i < annotations.length; i += 1) {
    const annotation = annotations[i]
    uuidToIndex.set(annotation.uuid, i)
    labeledSubjectUuids.add(annotation.subject)
    bumpCount(countByValue, annotation.value, 1)
    if (annotation.type === AnnotationType.Classification
      && annotation.value === Category.Unsure) {
      unsureSubjectUuids.add(annotation.subject)
    }
    const list = labelsBySubject[annotation.subject]
    if (list === undefined) {
      labelsBySubject[annotation.subject] = [annotation]
    }
    else {
      list.push(annotation)
    }
  }

  return {
    labelsBySubject,
    labeledSubjectUuids,
    unsureSubjectUuids,
    uuidToIndex: markRaw(uuidToIndex),
    countByValue,
  }
}

/** O(1) remove from the raw annotations list (order is not significant). */
const removeAnnotationAt = (
  annotations: Annotation[],
  uuidToIndex: Map<string, number>,
  annIndex: number,
  uuid: string,
): void => {
  const last = annotations.length - 1
  if (annIndex !== last) {
    const moved = annotations[last]
    annotations[annIndex] = moved
    uuidToIndex.set(moved.uuid, annIndex)
  }
  annotations.pop()
  uuidToIndex.delete(uuid)
}

const clearRecord = (record: Record<string, unknown>): void => {
  for (const key of Object.keys(record)) {
    delete record[key]
  }
}

/**
 * Annotation store (setup form: only returned members are public).
 *
 * Public: `annotations` (download/upload), `classificationCountByValue`,
 * `labeledCount`, `isClassified` / `isLabeled` / `isUnsure`, mutators.
 * Private: `labelsBySubject`, labeled/unsure Sets, `uuidToIndex`, `countByValue`.
 *
 * Hot-path design for large catalogs (~13k visualizations / ~46k annotations):
 * keep `annotations` + `uuidToIndex` markRaw (export only), maintain reactive
 * indexes incrementally on add/remove, and remove flat-list rows with O(1)
 * swap-pop. Do not re-`groupBy` / rescan all annotations on each click.
 *
 * Typical cost on real assets (see `e2e/label-latency.spec.ts`):
 * - add/removeClassification → category ring: well under 50ms (often <1ms)
 * - isClassified: O(#labels on that subject); isLabeled / isUnsure: O(1)
 * - classificationCountByValue / labeledCount reads: O(1)
 * - setAnnotations: cold path, O(n) index rebuild on load/upload
 *
 * Related: https://github.com/oldvis/image-taxonomy-labeler
 * (`packages/ui/src/label-tasks/useCommon.ts`) uses the same incremental-index
 * idea; this store also markRaws the flat list and uses O(1) remove.
 */
export const useStore = defineStore('annotation', () => {
  /** Flat export/download list — markRaw; see store doc above. */
  const annotations = shallowRef<Annotation[]>(markRaw([]))

  /** Per-subject labels (ring / isClassified). */
  const labelsBySubject = reactive<Record<string, Annotation[]>>({})
  const labeledSubjectUuids = reactive(new Set<string>())
  const unsureSubjectUuids = reactive(new Set<string>())
  /** Internal flat-list index — never returned. */
  let uuidToIndex: Map<string, number> = markRaw(new Map())
  const countByValue = reactive(emptyCountByValue())

  /** O(1) progress-strip counts. */
  const classificationCountByValue = computed(() => countByValue)
  /** O(1) `#Not-Labeled` helper: visualizations.length - labeledCount. */
  const labeledCount = computed(() => labeledSubjectUuids.size)

  /** Hot path (ring): O(#labels on subject). */
  const isClassified = (uuid: string, category: Category): boolean => {
    const subjectLabels = labelsBySubject[uuid]
    if (subjectLabels === undefined) return false
    return subjectLabels.some((d) => (
      d.type === AnnotationType.Classification && d.value === category
    ))
  }

  /** Hot path (filters / in-page labeled): O(1). */
  const isLabeled = (uuid: string): boolean => labeledSubjectUuids.has(uuid)

  /** Hot path (Unsure filter): O(1). */
  const isUnsure = (uuid: string): boolean => unsureSubjectUuids.has(uuid)

  /** Cold path (load/upload): O(n) rebuild of all indexes. */
  const setAnnotations = (next: Annotation[]): void => {
    const raw = toRawAnnotations(next)
    annotations.value = raw
    const indexes = buildIndexes(raw)

    clearRecord(labelsBySubject)
    Object.assign(labelsBySubject, indexes.labelsBySubject)

    labeledSubjectUuids.clear()
    for (const uuid of indexes.labeledSubjectUuids) {
      labeledSubjectUuids.add(uuid)
    }
    unsureSubjectUuids.clear()
    for (const uuid of indexes.unsureSubjectUuids) {
      unsureSubjectUuids.add(uuid)
    }

    uuidToIndex = indexes.uuidToIndex
    Object.assign(countByValue, indexes.countByValue)
  }

  /** Hot path (label click): incremental index update; ring typically <1ms in e2e. */
  const addClassification = (subject: string, value: Category): void => {
    const userStore = useUserStore()
    const type = AnnotationType.Classification
    const user = userStore.uuid
    const annotation = markRaw({
      type,
      uuid: uuidv4(),
      subject,
      user,
      value,
      time: new Date().toISOString(),
    } satisfies Annotation)

    const subjectLabels = labelsBySubject[subject] ?? []
    const replaceAt = subjectLabels.findIndex((d) => (
      d.type === type && sameClassificationPair(d.value, value)
    ))

    if (replaceAt === -1) {
      annotations.value.push(annotation)
      uuidToIndex.set(annotation.uuid, annotations.value.length - 1)
      // New array reference so Vue tracks the subject update without deep-proxying rows.
      labelsBySubject[subject] = [...subjectLabels, annotation]
      labeledSubjectUuids.add(subject)
      bumpCount(countByValue, value, 1)
      if (value === Category.Unsure) {
        unsureSubjectUuids.add(subject)
      }
      return
    }

    const previous = subjectLabels[replaceAt]
    const annIndex = uuidToIndex.get(previous.uuid)
    if (annIndex === undefined) {
      // Index drifted; recover rather than corrupting state.
      setAnnotations([...annotations.value.filter((d) => d.uuid !== previous.uuid), annotation])
      return
    }

    annotations.value[annIndex] = annotation
    uuidToIndex.delete(previous.uuid)
    uuidToIndex.set(annotation.uuid, annIndex)
    const nextLabels = subjectLabels.slice()
    nextLabels[replaceAt] = annotation
    labelsBySubject[subject] = nextLabels
    bumpCount(countByValue, previous.value, -1)
    bumpCount(countByValue, value, 1)

    if (previous.value === Category.Unsure && value !== Category.Unsure) {
      const stillUnsure = nextLabels.some((d) => (
        d.uuid !== annotation.uuid && d.value === Category.Unsure
      ))
      if (!stillUnsure) {
        unsureSubjectUuids.delete(subject)
      }
    }
    if (value === Category.Unsure) {
      unsureSubjectUuids.add(subject)
    }
  }

  /** Hot path (toggle off): O(1) flat-list remove + incremental indexes. */
  const removeClassification = (subject: string, value: Category): void => {
    const type = AnnotationType.Classification
    const subjectLabels = labelsBySubject[subject]
    if (subjectLabels === undefined) return

    const labelIndex = subjectLabels.findIndex((d) => (
      d.type === type && d.value === value
    ))
    if (labelIndex === -1) return

    const previous = subjectLabels[labelIndex]
    const annIndex = uuidToIndex.get(previous.uuid)
    if (annIndex === undefined) {
      setAnnotations(annotations.value.filter((d) => d.uuid !== previous.uuid))
      return
    }

    removeAnnotationAt(annotations.value, uuidToIndex, annIndex, previous.uuid)

    const nextLabels = subjectLabels.slice()
    nextLabels.splice(labelIndex, 1)
    bumpCount(countByValue, value, -1)
    if (nextLabels.length === 0) {
      delete labelsBySubject[subject]
      labeledSubjectUuids.delete(subject)
      unsureSubjectUuids.delete(subject)
      return
    }
    labelsBySubject[subject] = nextLabels

    if (value === Category.Unsure) {
      const stillUnsure = nextLabels.some((d) => d.value === Category.Unsure)
      if (!stillUnsure) {
        unsureSubjectUuids.delete(subject)
      }
    }
  }

  return {
    annotations,
    classificationCountByValue,
    labeledCount,
    isClassified,
    isLabeled,
    isUnsure,
    setAnnotations,
    addClassification,
    removeClassification,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
