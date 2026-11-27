import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_ACTIONS,
  NO_FILTER,
  distinctEntityTypes,
  filterActivities,
  formatActivityAgent,
  formatActivityEntityLabel,
  formatActivityIp,
  isFiltering,
  type ActivityLog,
} from '~/features/activities/utils/activity-filter'

function makeLog(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    action: 'CREATE',
    browser: null,
    created_at: '2026-10-16T10:00:00.000Z',
    description: 'Produk dibuat',
    entity_id: 1,
    entity_type: 'product',
    ip_address: null,
    new_data: null,
    old_data: null,
    platform: null,
    ...overrides,
  }
}

describe('Filter & Format log aktivitas admin (D-04)', () => {
  const logs = [
    makeLog({
      id: 'a1',
      entity_type: 'product',
      action: 'CREATE',
      created_at: '2026-10-16T10:00:00.000Z',
      description: 'Menambahkan keyboard',
      ip_address: '127.0.0.1 (Localhost)',
    }),
    makeLog({
      id: 'a2',
      entity_type: 'product',
      action: 'UPDATE',
      created_at: '2026-10-18T10:00:00.000Z',
      description: 'Stok diperbarui',
    }),
    makeLog({
      id: 'a3',
      entity_type: 'order',
      action: 'UPDATE',
      created_at: '2026-10-27T10:00:00.000Z',
      description: 'Status pesanan diperbarui menjadi: shipped',
      new_data: { order_id: 'ord-abc-123' },
    }),
    makeLog({
      id: 'a4',
      entity_type: 'order',
      action: 'DELETE',
      created_at: '2026-10-30T10:00:00.000Z',
      description: 'Pesanan dibatalkan',
    }),
  ]

  it('tanpa filter mengembalikan semua baris', () => {
    expect(filterActivities(logs, NO_FILTER)).toHaveLength(4)
  })

  it('filter entitas saja', () => {
    const result = filterActivities(logs, { entity: 'order', action: '' })
    expect(result.map((r) => r.id)).toEqual(['a3', 'a4'])
  })

  it('filter aksi saja', () => {
    const result = filterActivities(logs, { entity: '', action: 'UPDATE' })
    expect(result.map((r) => r.id)).toEqual(['a2', 'a3'])
  })

  it('kombinasi entitas dan aksi', () => {
    const result = filterActivities(logs, { entity: 'product', action: 'UPDATE' })
    expect(result.map((r) => r.id)).toEqual(['a2'])
  })

  it('filter kata kunci dan rentang tanggal', () => {
    expect(
      filterActivities(logs, { entity: '', action: '', search: 'ord-abc-123' }).map((r) => r.id),
    ).toEqual(['a3'])

    expect(
      filterActivities(logs, {
        entity: '',
        action: '',
        fromDate: '2026-10-27',
        toDate: '2026-10-30',
      }).map((r) => r.id),
    ).toEqual(['a3', 'a4'])
  })

  it('memformat entitas, IP, dan browser/OS tanpa menampilkan - • -', () => {
    expect(formatActivityEntityLabel('return_request')).toBe('Komplain & Retur')
    expect(formatActivityEntityLabel('order')).toBe('Pesanan')
    expect(formatActivityIp(null)).toBe('Sistem')
    expect(formatActivityIp('127.0.0.1 (Localhost)')).toBe('127.0.0.1 (Localhost)')
    expect(formatActivityAgent(null, null)).toBe('Sistem Otomatis')
    expect(formatActivityAgent('Edge', 'Windows')).toBe('Edge · Windows')
  })

  it('kombinasi tanpa hasil mengembalikan array kosong', () => {
    expect(filterActivities(logs, { entity: 'refund', action: '' })).toEqual([])
  })

  it('daftar kosong tetap kosong', () => {
    expect(filterActivities([], { entity: 'order', action: 'UPDATE' })).toEqual([])
  })

  it('daftar entitas unik terurut untuk opsi dropdown', () => {
    expect(distinctEntityTypes(logs)).toEqual(['order', 'product'])
  })

  it('entitas kosong tidak masuk opsi', () => {
    const withBlank = [...logs, makeLog({ id: 'a5', entity_type: '' })]
    expect(distinctEntityTypes(withBlank)).toEqual(['order', 'product'])
  })

  it('status filter aktif terdeteksi benar termasuk pencarian dan rentang tanggal', () => {
    expect(isFiltering(NO_FILTER)).toBe(false)
    expect(isFiltering({ entity: 'order', action: '' })).toBe(true)
    expect(isFiltering({ entity: '', action: 'DELETE' })).toBe(true)
    expect(isFiltering({ entity: '', action: '', search: 'shipped' })).toBe(true)
    expect(isFiltering({ entity: '', action: '', fromDate: '2026-10-27' })).toBe(true)
  })

  it('daftar aksi sesuai enum activity_action', () => {
    expect([...ACTIVITY_ACTIONS]).toEqual(['CREATE', 'UPDATE', 'DELETE', 'RESTORE'])
  })
})
