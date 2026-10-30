import { describe, it, expect } from 'vitest'
import {
  INDONESIA_PROVINCES,
  INDONESIA_CITIES,
  getCitiesByProvince,
  getCityById,
  searchLocations,
  POPULAR_CITIES,
} from '../../shared/data/locations/indonesia-regions'
import { locationQuerySchema } from '../../shared/schemas/location'

describe('Indonesian Administrative Master Data (SHF-LOC-01)', () => {
  it('covers all 38 provinces in Indonesia including new DOB Papua provinces', () => {
    expect(INDONESIA_PROVINCES).toHaveLength(38)

    const provinceNames = INDONESIA_PROVINCES.map((p) => p.name)
    expect(provinceNames).toContain('DKI Jakarta')
    expect(provinceNames).toContain('Jawa Barat')
    expect(provinceNames).toContain('Jawa Timur')
    expect(provinceNames).toContain('Jawa Tengah')
    expect(provinceNames).toContain('DI Yogyakarta')
    expect(provinceNames).toContain('Bali')
    expect(provinceNames).toContain('Sumatera Utara')
    expect(provinceNames).toContain('Papua Selatan')
    expect(provinceNames).toContain('Papua Tengah')
    expect(provinceNames).toContain('Papua Pegunungan')
    expect(provinceNames).toContain('Papua Barat Daya')
  })

  it('contains over 500 official cities and regencies across Indonesia', () => {
    expect(INDONESIA_CITIES.length).toBeGreaterThanOrEqual(514)

    const dkiCities = getCitiesByProvince('31')
    expect(dkiCities).toHaveLength(6)
    const cityNames = dkiCities.map((c) => c.name)
    expect(cityNames).toContain('Kota Jakarta Selatan')
    expect(cityNames).toContain('Kota Jakarta Pusat')
    expect(cityNames).toContain('Kabupaten Kepulauan Seribu')
  })

  it('finds city by unique ID', () => {
    const jaksel = getCityById('3171')
    expect(jaksel).toBeDefined()
    expect(jaksel?.name).toBe('Kota Jakarta Selatan')
    expect(jaksel?.provinceName).toBe('DKI Jakarta')
    expect(jaksel?.postalCode).toBe('12110')
  })

  it('performs case-insensitive fuzzy search by city name', () => {
    const results = searchLocations('bandung', 10)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((c) => c.name.includes('Bandung'))).toBe(true)

    const surabaya = searchLocations('surabaya', 5)
    expect(surabaya.length).toBeGreaterThan(0)
    expect(surabaya[0]?.name).toBe('Kota Surabaya')
  })

  it('performs search by postal code', () => {
    const results = searchLocations('40115', 5)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((c) => c.name === 'Kota Bandung')).toBe(true)
  })

  it('provides popular metropolitan cities for quick chips', () => {
    expect(POPULAR_CITIES.length).toBeGreaterThanOrEqual(8)
    const popNames = POPULAR_CITIES.map((c) => c.name)
    expect(popNames).toContain('Jakarta Pusat')
    expect(popNames).toContain('Surabaya')
    expect(popNames).toContain('Bandung')
  })

  it('validates location query schema parameters', () => {
    const valid = locationQuerySchema.safeParse({ q: 'Jakarta', limit: 15 })
    expect(valid.success).toBe(true)

    const validProvince = locationQuerySchema.safeParse({ province_id: '32' })
    expect(valid.success).toBe(true)

    const invalidLimit = locationQuerySchema.safeParse({ limit: -5 })
    expect(invalidLimit.success).toBe(false)
  })
})
