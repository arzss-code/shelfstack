import { computed, ref, type Ref } from 'vue'

export type SortDirection = 'asc' | 'desc' | null
export type SortValue = string | number | boolean | null | undefined

export interface TableSortState {
  key: string | null
  direction: SortDirection
}

export type SortAccessors<T> = Record<string, (row: T) => SortValue>

/**
 * Mengurutkan array baris tabel secara deterministik dan imutabel.
 * Nilai kosong (null/undefined/'') selalu ditempatkan di akhir.
 */
export function sortTableRows<T>(
  rows: readonly T[],
  key: string | null,
  direction: SortDirection,
  accessors: SortAccessors<T>,
): T[] {
  if (!key || !direction || !accessors[key]) return [...rows]

  const getter = accessors[key]
  const factor = direction === 'desc' ? -1 : 1

  return [...rows].sort((a, b) => {
    const valA = getter(a)
    const valB = getter(b)
    const emptyA = valA === null || valA === undefined || valA === ''
    const emptyB = valB === null || valB === undefined || valB === ''

    if (emptyA && emptyB) return 0
    if (emptyA) return 1
    if (emptyB) return -1

    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * factor
    }
    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      return (Number(valA) - Number(valB)) * factor
    }

    return String(valA).localeCompare(String(valB), 'id', { numeric: true }) * factor
  })
}

/**
 * Composable ringan untuk menyediakan sorting kolom tabel beserta atribut `aria-sort` WCAG AA.
 */
export function useClientTableSort<T>(
  source: Ref<readonly T[]> | (() => readonly T[]),
  accessors: SortAccessors<T>,
  initial: TableSortState = { key: null, direction: null },
) {
  const sortKey = ref<string | null>(initial.key)
  const sortDirection = ref<SortDirection>(initial.direction)

  const sortedItems = computed(() => {
    const rows = typeof source === 'function' ? source() : source.value
    return sortTableRows(rows, sortKey.value, sortDirection.value, accessors)
  })

  const onSortChange = (payload: { key: string | null; direction: SortDirection }) => {
    sortKey.value = payload.direction ? payload.key : null
    sortDirection.value = payload.direction
  }

  const resetSort = () => {
    sortKey.value = null
    sortDirection.value = null
  }

  const getAriaSort = (key: string): 'ascending' | 'descending' | 'none' => {
    if (sortKey.value !== key || !sortDirection.value) return 'none'
    return sortDirection.value === 'asc' ? 'ascending' : 'descending'
  }

  return {
    sortKey,
    sortDirection,
    sortedItems,
    onSortChange,
    resetSort,
    getAriaSort,
  }
}
