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

export const uploadJsonFile = () => new Promise<unknown>((resolve, reject) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.onchange = async (e) => {
    const target = e.target as HTMLInputElement
    if (target.files === null) {
      resolve(null)
      return
    }
    try {
      resolve(await parseJsonFile(target.files[0]))
    }
    catch (error) {
      reject(error)
    }
  }
  input.click()
})
