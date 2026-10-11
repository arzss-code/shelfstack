import { describe, it, expect } from 'vitest'
import {
  escapeCsvCell,
  generateOrdersCsv,
  parseExportDateRange,
  type OrderCsvRow,
} from '~/utils/csv'

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

describe('Rentang Tanggal Ekspor (parseExportDateRange)', () => {
  it('menerima rentang valid dan menghitung batas inklusif-akhir dengan benar', () => {
    const res = parseExportDateRange('2026-10-01', '2026-10-08')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.range.fromIso).toBe('2026-10-01T00:00:00.000Z')
      expect(res.range.toExclusiveIso).toBe('2026-10-09T00:00:00.000Z')
    }
  })

  it('mengizinkan batas satu sisi (hanya mulai atau hanya akhir)', () => {
    const onlyFrom = parseExportDateRange('2026-10-01', '')
    expect(onlyFrom.ok).toBe(true)
    if (onlyFrom.ok) {
      expect(onlyFrom.range.fromIso).toBe('2026-10-01T00:00:00.000Z')
      expect(onlyFrom.range.toExclusiveIso).toBeNull()
    }

    const onlyTo = parseExportDateRange(undefined, '2026-10-08')
    expect(onlyTo.ok).toBe(true)
    if (onlyTo.ok) {
      expect(onlyTo.range.fromIso).toBeNull()
      expect(onlyTo.range.toExclusiveIso).toBe('2026-10-09T00:00:00.000Z')
    }
  })

  it('menolak format selain YYYY-MM-DD dengan pesan yang jelas', () => {
    const res = parseExportDateRange('08-10-2026', '2026/10/09')
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error).toContain('YYYY-MM-DD')
    }
  })

  it('menolak tanggal kalender yang tidak ada (mis. 30 Februari)', () => {
    const res = parseExportDateRange('2026-02-30', '')
    expect(res.ok).toBe(false)
  })

  it('menolak tanggal mulai yang setelah tanggal akhir', () => {
    const res = parseExportDateRange('2026-10-09', '2026-10-01')
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error).toContain('tidak boleh setelah tanggal akhir')
    }
  })
})
