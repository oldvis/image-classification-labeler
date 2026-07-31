/**
 * Keeps interface tests fast and deterministic before dependency upgrades.
 * Real seed JSON assets are mocked; stores are reset in test helpers.
 */
import { vi } from 'vitest'
import { fixtureVisualizations } from './fixtures/visualizations'

const memoryStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: memoryStorage,
  configurable: true,
})

vi.mock('~/assets/annotations.json', () => ({ default: [] }))
vi.mock('~/assets/visualizations.json', () => ({
  default: fixtureVisualizations.map((d) => ({
    ...d,
    // plugin expects raw TimePoint / ISO language codes before mapping
    publishDate: d.publishDate === null ? null : { year: d.publishDate },
    languages: ['eng'],
  })),
}))
