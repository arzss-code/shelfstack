import { describe, it, expect } from 'vitest'
import { calculateDeliveryEta } from '~~/shared/utils/shipping-eta'

describe('calculateDeliveryEta', () => {
  it('calculates instant delivery correctly for same-day delivery', () => {
    const fixedDate = new Date(2026, 10, 15, 10, 0, 0) // 15 Nov 2026
    const result = calculateDeliveryEta('instant', fixedDate)

    expect(result.service).toBe('instant')
    expect(result.minDays).toBe(0)
    expect(result.maxDays).toBe(0)
    expect(result.label).toBe('Tiba Hari Ini')
    expect(result.arrivalRange).toBe('Hari Ini (15 Nov)')
    expect(result.badgeText).toBe('Tiba Hari Ini (15 Nov)')
    expect(result.etaDescription).toContain('3 - 6 jam')
    expect(result.etaDescription).not.toContain('—') // Anti-slop: no em dash
  })

  it('calculates express / next day delivery correctly', () => {
    const fixedDate = new Date(2026, 10, 15, 14, 0, 0) // 15 Nov 2026
    const result = calculateDeliveryEta('express', fixedDate)

    expect(result.service).toBe('express')
    expect(result.minDays).toBe(1)
    expect(result.maxDays).toBe(1)
    expect(result.arrivalRange).toBe('16 Nov')
    expect(result.badgeText).toBe('Tiba 16 Nov')
    expect(result.etaDescription).toContain('16 Nov')
    expect(result.badgeText).not.toContain('—')
  })

  it('supports alias next_day for express service', () => {
    const fixedDate = new Date(2026, 10, 15)
    const result = calculateDeliveryEta('next_day', fixedDate)

    expect(result.service).toBe('express')
    expect(result.minDays).toBe(1)
  })

  it('calculates reguler delivery with date range in same month', () => {
    const fixedDate = new Date(2026, 10, 15) // 15 Nov 2026
    const result = calculateDeliveryEta('reguler', fixedDate)

    expect(result.service).toBe('reguler')
    expect(result.minDays).toBe(2)
    expect(result.maxDays).toBe(3)
    expect(result.label).toBe('2 - 3 Hari Kerja')
    expect(result.arrivalRange).toBe('17 - 18 Nov')
    expect(result.badgeText).toBe('Tiba 17 - 18 Nov')
    expect(result.etaDescription).toContain('17 Nov -')
  })

  it('calculates delivery crossing month boundary between min and max dates', () => {
    const fixedDate = new Date(2026, 10, 28) // 28 Nov 2026 (Nov has 30 days)
    // For reguler: minDays = 2 (30 Nov), maxDays = 3 (1 Des)
    const result = calculateDeliveryEta('reguler', fixedDate)

    expect(result.service).toBe('reguler')
    expect(result.minDays).toBe(2)
    expect(result.maxDays).toBe(3)
    expect(result.arrivalRange).toBe('30 Nov - 1 Des')
    expect(result.badgeText).toBe('Tiba 30 Nov - 1 Des')
  })

  it('calculates cargo delivery correctly', () => {
    const fixedDate = new Date(2026, 10, 10) // 10 Nov 2026
    const result = calculateDeliveryEta('cargo', fixedDate)

    expect(result.service).toBe('cargo')
    expect(result.minDays).toBe(4)
    expect(result.maxDays).toBe(7)
    expect(result.label).toBe('4 - 7 Hari Kerja')
    expect(result.arrivalRange).toBe('14 - 17 Nov')
    expect(result.badgeText).toBe('Tiba 14 - 17 Nov')
  })

  it('falls back to reguler for null or empty service input', () => {
    const resultNull = calculateDeliveryEta(null)
    expect(resultNull.service).toBe('reguler')

    const resultEmpty = calculateDeliveryEta('')
    expect(resultEmpty.service).toBe('reguler')
  })
})
