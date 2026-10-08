import { describe, it, expect } from 'vitest'
import { escapeCsvCell, generateOrdersCsv, type OrderCsvRow } from '~/utils/csv'

describe('CSV Order Export Utility', () => {
  it('escapes cells containing commas, quotes, and special characters', () => {
    expect(escapeCsvCell('Normal Text')).toBe('"Normal Text"')
    expect(escapeCsvCell('Text, with comma')).toBe('"Text, with comma"')
    expect(escapeCsvCell('Text with "quotes"')).toBe('"Text with ""quotes"""')
    expect(escapeCsvCell(null)).toBe('""')
    expect(escapeCsvCell(undefined)).toBe('""')
    expect(escapeCsvCell(150000)).toBe('"150000"')
  })

  it('generates CSV string with proper BOM and header row', () => {
    const csv = generateOrdersCsv([])

    // Should start with UTF-8 BOM
    expect(csv.startsWith('\uFEFF')).toBe(true)
    // Should contain headers
    expect(csv).toContain('ID Pesanan')
    expect(csv).toContain('Nama Pelanggan')
    expect(csv).toContain('Total (IDR)')
  })

  it('correctly maps order rows into comma-separated values', () => {
    const mockRows: OrderCsvRow[] = [
      {
        id: 'ord-001',
        created_at: '2026-10-08T09:00:00Z',
        customer_name: 'Budi, Santoso',
        city: 'Jakarta',
        phone: '08123456789',
        status: 'paid',
        item_count: 2,
        total_idr: 250000,
      },
      {
        id: 'ord-002',
        created_at: '2026-10-08T10:00:00Z',
        customer_name: 'Dewi "Sari"',
        city: 'Surabaya',
        phone: '08987654321',
        status: 'pending',
        item_count: 1,
        total_idr: 100000,
      },
    ]

    const csv = generateOrdersCsv(mockRows)

    expect(csv).toContain('"ord-001"')
    expect(csv).toContain('"Budi, Santoso"')
    expect(csv).toContain('"Dewi ""Sari"""')
    expect(csv).toContain('"250000"')
    expect(csv).toContain('"100000"')
  })
})
