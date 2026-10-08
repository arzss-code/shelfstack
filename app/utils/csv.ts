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
