import { iso6393 } from 'iso-639-3'
import { z } from 'zod'
import rawVisualizationsUrl from '~/assets/visualizations.json?url'

const timePointSchema = z.object({
  year: z.number(),
  month: z.number().optional(),
  day: z.number().optional(),
})

const rawVisualizationSchema = z.object({
  uuid: z.string().min(1),
  authors: z.array(z.string()).nullable(),
  displayName: z.string().nullable(),
  publishDate: z.union([
    timePointSchema,
    z.tuple([timePointSchema, timePointSchema]),
  ]).nullable(),
  viewUrl: z.string(),
  downloadUrl: z.string(),
  md5: z.string().optional(),
  phash: z.string().optional(),
  resolution: z.tuple([z.number(), z.number()]).optional(),
  fileSize: z.number().optional(),
  languages: z.array(z.string()).nullable(),
  tags: z.array(z.string()),
  abstract: z.string().nullable(),
  rights: z.string(),
  source: z.object({
    name: z.string(),
    url: z.string(),
    accessDate: z.string(),
  }),
})

const rawVisualizationsSchema = z.array(rawVisualizationSchema)

type RawVisualization = z.infer<typeof rawVisualizationSchema>

export interface Visualization extends Omit<
  RawVisualization,
  'publishDate' | 'languages' | 'displayName'
> {
  /** Null in the raw asset is normalized to empty string. */
  displayName: string
  /** Originally stored as { year: number }. Converted to integer. */
  publishDate: number | null
  /** Originally stored in ISO format. Converted to full name. */
  languages: string[]
}

const iso6393ToName: Record<string, string> = {
  ...Object.fromEntries(iso6393.map((d) => [d.iso6393, d.name])),
  sla: 'Slavic',
  pra: 'Prakrit',
  ota: 'Ottoman Turkish',
  ang: 'Old English',
  swa: 'Swahili',
  ell: 'Modern Greek',
}

const getPublishYear = (
  publishDate: RawVisualization['publishDate'],
): number | null => {
  if (publishDate === null) return null
  if (Array.isArray(publishDate)) return publishDate[0].year
  return publishDate.year
}

const getLanguageFullNames = (languages: string[]): string[] => (
  languages?.map((lang: string) => {
    if (lang in iso6393ToName) {
      return iso6393ToName[lang]
    }
    return (new Intl.DisplayNames(['en'], { type: 'language' })).of(lang)
  }).filter((d) => d !== undefined) as string[] ?? []
)

export const loadVisualizations = async (): Promise<Visualization[]> => {
  const response = await fetch(rawVisualizationsUrl)
  if (!response.ok) {
    throw new Error(`Failed to load visualizations (${response.status})`)
  }
  const parsed = rawVisualizationsSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new Error('Failed to load visualizations: invalid visualizations JSON')
  }
  return parsed.data.map((d) => ({
    ...d,
    displayName: d.displayName ?? '',
    publishDate: getPublishYear(d.publishDate),
    languages: getLanguageFullNames(d.languages ?? []),
  }))
}
