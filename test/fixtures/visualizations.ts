import type { Visualization } from '~/plugins/visualization'

export const makeVisualization = (
  overrides: Partial<Visualization> & Pick<Visualization, 'uuid'>,
): Visualization => ({
  authors: ['Author A'],
  displayName: `Entry ${overrides.uuid}`,
  publishDate: 1850,
  viewUrl: 'https://example.com/view',
  downloadUrl: 'https://example.com/img.png',
  languages: ['English'],
  tags: ['chart'],
  abstract: null,
  rights: 'public',
  source: {
    name: 'TestSource',
    url: 'https://example.com',
    accessDate: '2024-01-01',
  },
  ...overrides,
})

export const fixtureVisualizations: Visualization[] = [
  makeVisualization({ uuid: 'vis-a', displayName: 'Alpha Chart', tags: ['map'] }),
  makeVisualization({ uuid: 'vis-b', displayName: 'Beta Table', authors: ['Author B'], tags: ['table'] }),
  makeVisualization({ uuid: 'vis-c', displayName: 'Gamma Plot', tags: ['chart'] }),
  makeVisualization({ uuid: 'vis-d', displayName: 'Delta Map', tags: ['map'] }),
]
