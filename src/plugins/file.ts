import { useFileDialog } from '@vueuse/core'
import { saveAs } from 'file-saver'

export const saveJsonFile = (
  data: unknown,
  filename: string,
): void => {
  const json = JSON.stringify(data)
  const blob = new Blob([json], { type: 'application/json' })
  saveAs(blob, filename)
}

export const parseJsonFile = (file: File): Promise<unknown> => (
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const { result } = event.target as FileReader
        resolve(JSON.parse(result as string) as unknown)
      }
      catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsText(file)
  })
)

/** Open a JSON file picker. Resolves `null` when the user cancels. */
export const uploadJsonFile = (): Promise<unknown> => {
  const { open, onChange, onCancel } = useFileDialog({
    accept: 'application/json,.json',
    multiple: false,
    reset: true,
  })

  return new Promise((resolve, reject) => {
    let settled = false

    onCancel(() => {
      if (settled) return
      settled = true
      resolve(null)
    })

    onChange(async (files) => {
      const file = files?.[0]
      // `reset: true` may emit `null` before the dialog opens; ignore that.
      if (!file || settled) return
      settled = true
      try {
        resolve(await parseJsonFile(file))
      }
      catch (error) {
        reject(error)
      }
    })

    open()
  })
}
