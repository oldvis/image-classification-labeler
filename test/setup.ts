/**
 * Keeps interface tests fast and deterministic.
 * Real seed JSON is loaded only via mocked fetch in plugin tests;
 * store/UI tests patch Pinia state in helpers.
 */
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
