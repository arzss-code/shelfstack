import { z } from 'zod'

export const locationQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  province_id: z.string().trim().max(10).optional(),
  city_id: z.string().trim().max(10).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30).optional(),
})

export type LocationQuery = z.infer<typeof locationQuerySchema>

export const administrativeSelectionSchema = z.object({
  provinceId: z.string().min(1),
  provinceName: z.string().min(1),
  cityId: z.string().min(1),
  cityName: z.string().min(1),
  districtId: z.string().min(1),
  districtName: z.string().min(1),
  postalCode: z.string().min(5).max(10),
  displayLabel: z.string().min(1),
})

export type AdministrativeSelection = z.infer<typeof administrativeSelectionSchema>

// Backward compatibility alias
export const locationSelectionSchema = administrativeSelectionSchema
export type LocationSelection = AdministrativeSelection
