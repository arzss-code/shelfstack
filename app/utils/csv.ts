export interface OrderCsvRow {
  id: string
  created_at: string
  customer_name: string
  city: string
  phone: string
  status: string
  item_count: number
  total_idr: number
}

export interface ExportDateRange {
  fromIso: string | null
  toExclusiveIso: string | null
}

export type ExportDateRangeResult =
  { ok: true; range: ExportDateRange } | { ok: false; error: string }

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function parseCalendarDate(value: string): Date | null {
  const match = DATE_PATTERN.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return date
}

/**
 * Memvalidasi rentang tanggal ekspor (format YYYY-MM-DD).
 * Batas akhir bersifat inklusif: dikonversi ke awal hari berikutnya (eksklusif)
 * agar query `gte/lt` mencakup seluruh hari terakhir.
 */
export function parseExportDateRange(from: unknown, to: unknown): ExportDateRangeResult {
  const fromText = typeof from === 'string' ? from.trim() : ''
  const toText = typeof to === 'string' ? to.trim() : ''

  if (fromText && !DATE_PATTERN.test(fromText)) {
    return { ok: false, error: 'Format tanggal mulai harus YYYY-MM-DD.' }
  }
  if (toText && !DATE_PATTERN.test(toText)) {
    return { ok: false, error: 'Format tanggal akhir harus YYYY-MM-DD.' }
  }

  const fromDate = fromText ? parseCalendarDate(fromText) : null
  const toDate = toText ? parseCalendarDate(toText) : null

  if (fromText && !fromDate) {
    return { ok: false, error: 'Tanggal mulai tidak valid.' }
  }
  if (toText && !toDate) {
    return { ok: false, error: 'Tanggal akhir tidak valid.' }
  }
  if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
    return { ok: false, error: 'Tanggal mulai tidak boleh setelah tanggal akhir.' }
  }

  return {
    ok: true,
    range: {
      fromIso: fromDate ? fromDate.toISOString() : null,
      toExclusiveIso: toDate ? new Date(toDate.getTime() + 86_400_000).toISOString() : null,
    },
  }
}

/**
 * Escapes a cell value according to RFC 4180 standard
 */
export function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""'
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

/**
 * Formats order records into UTF-8 CSV string with BOM for Excel compatibility
 */
export function generateOrdersCsv(rows: OrderCsvRow[]): string {
  const headers = [
    'ID Pesanan',
    'Tanggal',
    'Nama Pelanggan',
    'Kota',
    'No Telepon',
    'Status',
    'Jumlah Item',
    'Total (IDR)',
  ]

  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) =>
      [
        row.id,
        row.created_at,
        row.customer_name,
        row.city,
        row.phone,
        row.status,
        row.item_count,
        row.total_idr,
      ]
        .map(escapeCsvCell)
        .join(','),
    ),
  ]

  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
  return '\uFEFF' + lines.join('\r\n')
}
