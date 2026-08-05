import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VDataEntry from '~/components/VDataEntry.vue'
import { useStore as useMessageStore } from '~/stores/message'
import { makeVisualization } from '../fixtures/visualizations'
import { createTestPinia } from '../helpers/pinia'

const mountEntry = (datum: ReturnType<typeof makeVisualization>) => {
  const pinia = createTestPinia()
  return mount(VDataEntry, {
    props: { datum },
    global: {
      plugins: [pinia],
      stubs: { VObjectInspector: true },
    },
  })
}

describe('vDataEntry', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('does not show the entry index under the title', () => {
    const wrapper = mountEntry(makeVisualization({
      uuid: 'v1',
      displayName: 'Trade chart',
    }))

    expect(wrapper.text()).toContain('Trade chart')
    expect(wrapper.text()).not.toMatch(/#\d+/)
  })

  it('does not throw when downloadUrl is malformed and hides the image', () => {
    const wrapper = mountEntry(makeVisualization({
      uuid: 'v1',
      downloadUrl: 'not a url',
      viewUrl: 'https://example.com/view',
    }))

    expect(wrapper.text()).toContain('missing or invalid')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('explains HTTP-only images instead of rendering them', () => {
    const wrapper = mountEntry(makeVisualization({
      uuid: 'v1',
      downloadUrl: 'http://example.com/img.png',
      viewUrl: 'https://example.com/view',
    }))

    expect(wrapper.text()).toContain('served over HTTP')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('shows a loading state until the image loads or fails', async () => {
    const wrapper = mountEntry(makeVisualization({
      uuid: 'v1',
      downloadUrl: 'https://example.com/img.png',
    }))

    expect(wrapper.text()).toContain('Loading image')
    expect(wrapper.find('img').exists()).toBe(true)
    await wrapper.find('img').trigger('load')
    expect(wrapper.text()).not.toContain('Loading image')
  })

  it('shows a fallback when the image fails to load', async () => {
    const wrapper = mountEntry(makeVisualization({
      uuid: 'v1',
      downloadUrl: 'https://example.com/img.png',
      viewUrl: 'https://example.com/view',
    }))

    expect(wrapper.find('img').exists()).toBe(true)
    await wrapper.find('img').trigger('error')
    expect(wrapper.text()).toContain('Image failed to load')
    expect(wrapper.find('img').exists()).toBe(false)
    const url = wrapper.find('a[href="https://example.com/view"]')
    expect(url.exists()).toBe(true)
    expect(url.text()).toBe('URL')
    expect(url.attributes('target')).toBe('_blank')
    expect(url.attributes('rel')).toBe('noopener noreferrer')
  })

  it('falls back to downloadUrl in the error link when viewUrl is missing', async () => {
    const wrapper = mountEntry(makeVisualization({
      uuid: 'v1',
      downloadUrl: 'https://example.com/img.png',
      viewUrl: '',
    }))

    await wrapper.find('img').trigger('error')
    expect(wrapper.find('a[href="https://example.com/img.png"]').text()).toBe('URL')
  })

  it('disables the url link when viewUrl is not http(s)', () => {
    const wrapper = mountEntry(makeVisualization({
      uuid: 'v1',
      viewUrl: 'javascript:alert(1)',
      downloadUrl: 'https://example.com/img.png',
    }))

    expect(wrapper.find('a[title="Open original URL in a new tab"]').exists()).toBe(false)
    expect(wrapper.find('[title="Original URL is missing or invalid"]').exists()).toBe(true)
  })

  it('encodes the Google search query and sets relnoopener', () => {
    const wrapper = mountEntry(makeVisualization({
      uuid: 'v1',
      displayName: 'A & B',
    }))

    const google = wrapper.find('a[title="Search title in Google"]')
    expect(google.attributes('href')).toBe('https://www.google.com/search?q=A%20%26%20B')
    expect(google.attributes('rel')).toBe('noopener noreferrer')
  })

  it('reports copy failure when clipboard is unsupported', async () => {
    const wrapper = mountEntry(makeVisualization({ uuid: 'v1' }))
    const messages = useMessageStore()

    await wrapper.find('button[title="Copy raw metadata of this entry"]').trigger('click')
    await Promise.resolve()

    expect(messages.messages.some((d) => d.content.includes('Failed to copy metadata'))).toBe(true)
  })
})
