import type { Annotation, Category } from '~/stores/annotation'
import { AnnotationType } from '~/stores/annotation'

export const makeAnnotation = (
  subject: string,
  value: Category,
  overrides: Partial<Annotation> = {},
): Annotation => ({
  type: AnnotationType.Classification,
  uuid: `ann-${subject}-${value}`,
  subject,
  user: 'user-1',
  value,
  time: '2024-01-01T00:00:00.000Z',
  ...overrides,
})
