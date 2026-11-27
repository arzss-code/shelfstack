import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { sortTableRows, useClientTableSort } from '~/composables/useClientTableSort'

describe('useClientTableSort composable & sortTableRows helper', () => {
  const sampleRows = [
    { id: 2, name: 'Kabel Braided', price: 150000, date: '2026-11-20T10:00:00Z' },
    { id: 1, name: 'Lampu Meja', price: 420000, date: '2026-11-22T10:00:00Z' },
    { id: 3, name: 'Alas Meja', price: 210000, date: null as string | null },
  ]

  const accessors = {
    name: (r: (typeof sampleRows)[number]) => r.name,
    price: (r: (typeof sampleRows)[number]) => r.price,
    date: (r: (typeof sampleRows)[number]) => (r.date ? new Date(r.date).getTime() : null),
  }

  it('mengurutkan string dan angka secara asc & desc serta menempatkan null di akhir', () => {
    const ascNames = sortTableRows(sampleRows, 'name', 'asc', accessors)
    expect(ascNames.map((r) => r.name)).toEqual(['Alas Meja', 'Kabel Braided', 'Lampu Meja'])

    const descPrices = sortTableRows(sampleRows, 'price', 'desc', accessors)
    expect(descPrices.map((r) => r.price)).toEqual([420000, 210000, 150000])

    const ascDates = sortTableRows(sampleRows, 'date', 'asc', accessors)
    expect(ascDates[2]?.id).toBe(3)

    const descDates = sortTableRows(sampleRows, 'date', 'desc', accessors)
    expect(descDates[2]?.id).toBe(3)
  })

  it('mengelola state aria-sort dan reset ke urutan awal saat direction null', () => {
    const rows = ref(sampleRows)
    const { sortKey, sortDirection, sortedItems, onSortChange, getAriaSort } = useClientTableSort(
      rows,
      accessors,
    )

    expect(getAriaSort('price')).toBe('none')
    expect(sortedItems.value.map((r) => r.id)).toEqual([2, 1, 3])

    onSortChange({ key: 'price', direction: 'asc' })
    expect(sortKey.value).toBe('price')
    expect(sortDirection.value).toBe('asc')
    expect(getAriaSort('price')).toBe('ascending')
    expect(sortedItems.value.map((r) => r.price)).toEqual([150000, 210000, 420000])

    onSortChange({ key: 'price', direction: null })
    expect(getAriaSort('price')).toBe('none')
    expect(sortedItems.value.map((r) => r.id)).toEqual([2, 1, 3])
  })
})
