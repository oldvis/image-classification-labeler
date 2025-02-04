import type { IFuseOptions } from 'fuse.js'
import type { Visualization } from '~/plugins/visualization'
import Fuse from 'fuse.js'
import { isEqual } from 'lodash'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { useStore as useAnnotationStore } from './annotation'

export enum SelectorType {
  /** The type of selectors that follow Fuse.js options schema. */
  Fuse = 'Fuse',
  /** The type of selectors that search for unlabeled entries. */
  Unlabeled = 'Unlabeled',
  /** The type of selectors that search for labeled entries. */
  Labeled = 'Labeled',
  /** The type of selectors that search for unsure entries. */
  Unsure = 'Unsure',
}

export interface Selector<Type extends SelectorType = SelectorType> {
  /** The type of the selector. */
  type: Type
  /** The query selector. */
  query: (Type extends SelectorType.Fuse
    ? {
        pattern: string
        options: IFuseOptions<Visualization>
      }
    : null)
  /** The uuid of the selector. */
  uuid: string
}

const buildSearchSelector = (
  pattern: string,
  options: IFuseOptions<Visualization>,
): Selector<SelectorType.Fuse> => ({
  type: SelectorType.Fuse,
  query: { pattern, options },
  uuid: uuidv4(),
})

const buildUnlabeledSelector = (
): Selector<SelectorType.Unlabeled> => ({
  type: SelectorType.Unlabeled,
  query: null,
  uuid: uuidv4(),
})

const buildLabeledSelector = (
): Selector<SelectorType.Labeled> => ({
  type: SelectorType.Labeled,
  query: null,
  uuid: uuidv4(),
})

const buildUnsureSelector = (
): Selector<SelectorType.Unsure> => ({
  type: SelectorType.Unsure,
  query: null,
  uuid: uuidv4(),
})

/** Apply a selector to the data entries. */
const applySelector = (
  data: Visualization[],
  selector: Selector,
): Visualization[] => {
  if (selector.type === SelectorType.Fuse) {
    const { query } = selector as Selector<SelectorType.Fuse>
    const fuse = new Fuse(data, query.options)
    return fuse.search(query.pattern).map((d) => d.item)
  }
  if (selector.type === SelectorType.Unlabeled) {
    const annotationStore = useAnnotationStore()
    const { labeledUuids } = storeToRefs(annotationStore)
    return data.filter((d) => !labeledUuids.value.has(d.uuid))
  }
  if (selector.type === SelectorType.Labeled) {
    const annotationStore = useAnnotationStore()
    const { labeledUuids } = storeToRefs(annotationStore)
    return data.filter((d) => labeledUuids.value.has(d.uuid))
  }
  if (selector.type === SelectorType.Unsure) {
    const annotationStore = useAnnotationStore()
    const { unsureUuids } = storeToRefs(annotationStore)
    return data.filter((d) => unsureUuids.value.has(d.uuid))
  }
  return []
}

export const useStore = defineStore('selectors', {
  state: () => ({
    selectors: [] as Selector[],
  }),
  actions: {
    /** Add/Remove a selector of unlabeled data entries. */
    toggleUnlabeledSelector(): void {
      this.toggleSelector(buildUnlabeledSelector())
    },
    /** Add/Remove a selector of unlabeled data entries. */
    toggleLabeledSelector(): void {
      this.toggleSelector(buildLabeledSelector())
    },
    /** Add/Remove a selector of unlabeled data entries. */
    toggleUnsureSelector(): void {
      this.toggleSelector(buildUnsureSelector())
    },
    /** Add/Remove a selector checking datum[field] in closed range [left, right]. */
    addSearchSelector(pattern: string): void {
      const options = {
        threshold: 0,
        keys: ['uuid', 'authors', 'displayName', 'publishDate', 'tags'],
      }
      this.selectors.push(buildSearchSelector(pattern, options))
    },
    /**
     * Add/Remove a selector if selector(s)
     * with the same query don't/do exist.
     */
    toggleSelector(selector: Selector): void {
      const match = this.selectors
        .find((d) => (
          selector.type === d.type
          && isEqual(selector.query, d.query)
        ))
      if (match === undefined) this.selectors.push(selector)
      else this.removeSelector(match.uuid)
    },
    /** Remove selector by uuid. */
    removeSelector(uuid: string): void {
      const index = this.selectors.findIndex((d) => d.uuid === uuid)
      this.selectors.splice(index, 1)
    },
    /** Apply a selector to the data entries. */
    applySelector,
    /** Apply all the stored selector to the data entries. */
    applySelectors(data: Visualization[]): Visualization[] {
      let kept = data
      this.selectors.forEach((d) => {
        kept = this.applySelector(kept, d)
      })
      return kept
    },
  },
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
