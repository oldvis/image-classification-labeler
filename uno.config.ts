import { createRequire } from 'node:module'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind4,
} from 'unocss'

// Node 25+ rejects bare JSON ESM imports used by UnoCSS's auto icon loader.
const require = createRequire(import.meta.url)

/**
 * Shared strip geometry — same padding/height for nav, selectors, entries,
 * image footer, and progress so controls never sit flush to the bar edges.
 */
const barRow = 'px-2 py-1.5 min-h-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm'
/** Chrome controls (buttons, pills, chips, inputs) share one height. */
const chromeControl = 'h-6 box-border text-sm leading-none'
const chromeBtn = `base-btn inline-flex items-center justify-center ${chromeControl} px-2.5 py-0 rounded border`
/** Large classification pair buttons — only intentional size exception. */
const labelBtn = 'base-btn inline-flex items-center justify-center box-border min-h-9 px-3 py-1.5 rounded text-base leading-none border'

export default defineConfig({
  shortcuts: [
    ['base-btn', 'leading-none cursor-pointer disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1'],
    ['btn', `${chromeBtn} bg-teal-600 text-white border-teal-700 hover:bg-teal-700 disabled:bg-gray-600 disabled:opacity-50 disabled:border-transparent`],
    ['btn-warn', `${chromeBtn} bg-red-600 text-white border-red-800 hover:bg-red-700 disabled:opacity-50 disabled:border-transparent`],
    ['btn-neutral', `${chromeBtn} bg-neutral-600 text-white border-neutral-700 hover:bg-neutral-700 disabled:opacity-50 disabled:border-transparent`],
    ['btn-secondary', `${chromeBtn} border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700`],
    ['btn-ghost', `${chromeBtn} border-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-800`],
    ['btn-label', `${labelBtn} bg-teal-600 text-white border-teal-700 hover:bg-teal-700`],
    ['btn-label-warn', `${labelBtn} bg-red-600 text-white border-red-800 hover:bg-red-700`],
    ['btn-label-neutral', `${labelBtn} bg-neutral-600 text-white border-neutral-700 hover:bg-neutral-700`],
    ['icon-btn', 'base-btn inline-flex items-center justify-center p-1 text-sm select-none opacity-75 transition hover:opacity-100 hover:text-teal-600'],
    // Subtle key hint; inherits button text color via border-current.
    ['kbd', 'ml-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded border border-current px-0.5 text-[10px] leading-none font-mono opacity-55'],
    ['pill', `base-btn inline-flex items-center justify-center ${chromeControl} px-2 py-0 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700`],
    ['pill-on', 'pill border-teal-600 bg-teal-50 text-teal-800 font-semibold dark:border-teal-500 dark:bg-teal-900/40 dark:text-teal-200'],
    ['chip', `inline-flex ${chromeControl} max-h-6 items-center gap-1 px-2 rounded border border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200`],
    ['strip-label', 'text-sm text-gray-500 font-semibold leading-none dark:text-gray-400'],
    ['strip-meta', 'text-sm text-gray-600 leading-none dark:text-gray-300'],
    ['strip-meta-em', 'font-semibold text-gray-900 dark:text-gray-100'],
    // Middot between strip stats (mockup pattern).
    ['strip-sep', 'text-gray-300 shrink-0 select-none dark:text-gray-600'],
    ['input-area', `${chromeControl} px-2 py-0 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded`],
    // Dialog field: slightly taller than strip inputs for comfortable typing.
    ['dialog-field', 'h-8 w-full box-border rounded border border-gray-300 bg-white px-2 text-sm leading-none outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-gray-600 dark:bg-gray-950 dark:placeholder-gray-500'],
    ['dialog-panel', 'w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded border border-gray-200 bg-white shadow-md dark:border-gray-600 dark:bg-gray-900'],
    ['dialog-body', 'flex flex-col gap-2 p-3'],
    ['dialog-backdrop', 'fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 dark:bg-black/50'],
    ['status-strip', `${barRow} bg-gray-50 dark:bg-gray-900`],
    ['view-container', 'border border-gray-200 dark:border-gray-700 rounded flex flex-col overflow-hidden bg-white dark:bg-gray-900'],
    ['view-header', `${barRow} border-b border-gray-200 dark:border-gray-700`],
  ],
  presets: [
    presetWind4(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        'fa6-solid': () => require('@iconify-json/fa6-solid/icons.json'),
        'fa6-regular': () => require('@iconify-json/fa6-regular/icons.json'),
        'fa6-brands': () => require('@iconify-json/fa6-brands/icons.json'),
      },
    }),
  ],
})
