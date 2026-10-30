import { z } from 'zod'

export const locationQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  province_id: z.string().trim().max(10).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30).optional(),
})

export type LocationQuery = z.infer<typeof locationQuerySchema>

export const locationSelectionSchema = z.object({
  cityId: z.string().min(1),
  cityName: z.string().min(1),
  provinceId: z.string().min(1),
  provinceName: z.string().min(1),
  postalCode: z.string().min(5).max(10),
  type: z.enum(['Kota', 'Kabupaten']).optional(),
})

export type LocationSelection = z.infer<typeof locationSelectionSchema>
