import { saveAs } from 'file-saver'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseJsonFile, saveJsonFile, uploadJsonFile } from '~/plugins/file'

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

describe('file plugin', () => {
  beforeEach(() => {
    vi.mocked(saveAs).mockReset()
  })

  it('saveJsonFile stringifies data and saves annotations.json blob', () => {
    const data = [{ subject: 'vis-a', value: 'Vis' }]
    saveJsonFile(data, 'annotations.json')

    expect(saveAs).toHaveBeenCalledTimes(1)
    const [blob, filename] = vi.mocked(saveAs).mock.calls[0]
    expect(filename).toBe('annotations.json')
    expect(blob).toBeInstanceOf(Blob)
    expect((blob as Blob).type).toBe('application/json')
  })

  it('parseJsonFile reads a File into a JS value', async () => {
    const payload = [{ subject: 'vis-a', value: 'Vis' }]
    const file = new File([JSON.stringify(payload)], 'annotations.json', {
      type: 'application/json',
    })

    await expect(parseJsonFile(file)).resolves.toEqual(payload)
  })

  it('parseJsonFile rejects invalid JSON', async () => {
    const file = new File(['{'], 'bad.json', { type: 'application/json' })
    await expect(parseJsonFile(file)).rejects.toThrow()
  })

  it('uploadJsonFile sets accept and resolves null on cancel', async () => {
    const click = vi.fn()
    const input = {
      type: '',
      accept: '',
      multiple: true,
      webkitdirectory: false,
      value: '',
      files: null as FileList | null,
      click,
      onchange: null as ((e: Event) => void) | null,
      oncancel: null as (() => void) | null,
    }
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(
      input as unknown as HTMLInputElement,
    )

    const pending = uploadJsonFile()
    expect(input.type).toBe('file')
    expect(input.accept).toBe('application/json,.json')
    expect(input.multiple).toBe(false)
    expect(click).toHaveBeenCalledTimes(1)

    input.oncancel?.()
    await expect(pending).resolves.toBeNull()

    createElement.mockRestore()
  })
})
