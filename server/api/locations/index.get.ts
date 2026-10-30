import { locationQuerySchema } from '../../../shared/schemas/location'
import {
  INDONESIA_PROVINCES,
  POPULAR_CITIES,
  getCitiesByProvince,
  searchLocations,
} from '../../../shared/data/locations/indonesia-regions'
import { successResponse, errorResponse } from '../../utils/response'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const parsed = locationQuerySchema.safeParse(query)

  if (!parsed.success) {
    return errorResponse(
      event,
      'Parameter pencarian wilayah tidak valid',
      parsed.error.flatten().fieldErrors,
      400,
    )
  }

  const { q, province_id, limit = 30 } = parsed.data

  // 1. Jika ada query pencarian kata kunci
  if (q && q.trim().length >= 2) {
    const matched = searchLocations(q.trim(), limit)
    return successResponse('Pencarian wilayah berhasil', {
      results: matched,
      count: matched.length,
    })
  }

  // 2. Jika filter berdasarkan ID provinsi
  if (province_id) {
    const cities = getCitiesByProvince(province_id)
    return successResponse('Daftar kota dalam provinsi berhasil dimuat', {
      cities,
      count: cities.length,
    })
  }

  // 3. Default: kembalikan 38 provinsi dan daftar kota populer
  return successResponse('Daftar provinsi dan kota populer berhasil dimuat', {
    provinces: INDONESIA_PROVINCES,
    popular_cities: POPULAR_CITIES,
    total_provinces: INDONESIA_PROVINCES.length,
  })
})
