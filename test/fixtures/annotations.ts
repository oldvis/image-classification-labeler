import type { Category, useStore as useAnnotationStore } from '~/stores/annotation'

type AnnotationRow = ReturnType<typeof useAnnotationStore>['annotations'][number]

export const makeAnnotation = (
  subject: string,
  value: Category,
  overrides: Partial<AnnotationRow> = {},
): AnnotationRow => ({
  type: 'Classification' as AnnotationRow['type'],
  uuid: `ann-${subject}-${value}`,
  subject,
  user: 'user-1',
  value,
  time: '2024-01-01T00:00:00.000Z',
  ...overrides,
})
