import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Catalog Search Debounce Invariants', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('delays query sync until user stops typing for 300ms', () => {
    const syncQueryMock = vi.fn()
    let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

    const handleSearchUpdate = (val: string) => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer)
      }
      searchDebounceTimer = setTimeout(() => {
        syncQueryMock(val)
      }, 300)
    }

    // User types quickly: "k", "ke", "key", "keyb"
    handleSearchUpdate('k')
    vi.advanceTimersByTime(100)
    expect(syncQueryMock).not.toHaveBeenCalled()

    handleSearchUpdate('ke')
    vi.advanceTimersByTime(100)
    expect(syncQueryMock).not.toHaveBeenCalled()

    handleSearchUpdate('key')
    vi.advanceTimersByTime(100)
    expect(syncQueryMock).not.toHaveBeenCalled()

    handleSearchUpdate('keyb')
    // Advance full 300ms
    vi.advanceTimersByTime(300)

    expect(syncQueryMock).toHaveBeenCalledTimes(1)
    expect(syncQueryMock).toHaveBeenCalledWith('keyb')
  })

  it('immediately cancels debounce timer on clearSearch', () => {
    const syncQueryMock = vi.fn()
    let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

    const handleSearchUpdate = (val: string) => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
      searchDebounceTimer = setTimeout(() => syncQueryMock(val), 300)
    }

    const clearSearch = () => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
      syncQueryMock('')
    }

    handleSearchUpdate('headphones')
    vi.advanceTimersByTime(150)
    clearSearch()

    // Clear fires immediately
    expect(syncQueryMock).toHaveBeenCalledTimes(1)
    expect(syncQueryMock).toHaveBeenCalledWith('')

    // Further timer tick should not fire again
    vi.advanceTimersByTime(300)
    expect(syncQueryMock).toHaveBeenCalledTimes(1)
  })
})

describe('Stock Movements Audit Ledger Formatting Invariants', () => {
  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'order_fulfillment':
        return 'Pesanan Diproses'
      case 'order_cancelled_restock':
        return 'Restock Pembatalan'
      case 'manual_adjustment':
        return 'Penyesuaian Admin'
      default:
        return reason.replace(/_/g, ' ')
    }
  }

  const formatDelta = (delta: number) => {
    return delta > 0 ? `+${delta}` : `${delta}`
  }

  it('maps known stock movement reasons to Indonesian business labels', () => {
    expect(getReasonLabel('order_fulfillment')).toBe('Pesanan Diproses')
    expect(getReasonLabel('order_cancelled_restock')).toBe('Restock Pembatalan')
    expect(getReasonLabel('manual_adjustment')).toBe('Penyesuaian Admin')
    expect(getReasonLabel('warehouse_damaged_loss')).toBe('warehouse damaged loss')
  })

  it('formats positive and negative inventory deltas with proper prefixes', () => {
    expect(formatDelta(-5)).toBe('-5')
    expect(formatDelta(10)).toBe('+10')
    expect(formatDelta(0)).toBe('0')
  })
})

describe('Product Gallery Multi-Image Resolution Invariants', () => {
  const resolveGalleryImages = (imageUrl: string | null, galleryUrls?: string[]) => {
    const list: string[] = []
    if (imageUrl) {
      list.push(imageUrl)
    }
    if (galleryUrls && Array.isArray(galleryUrls)) {
      for (const url of galleryUrls) {
        if (url && !list.includes(url)) {
          list.push(url)
        }
      }
    }
    return list
  }

  it('returns single main image when no extra gallery URLs exist', () => {
    const images = resolveGalleryImages('https://images.local/p1.png')
    expect(images).toEqual(['https://images.local/p1.png'])
  })

  it('deduplicates main image from galleryUrls and appends angle shots', () => {
    const images = resolveGalleryImages('https://images.local/p1.png', [
      'https://images.local/p1.png', // duplicate
      'https://images.local/p1-angle-2.png',
      'https://images.local/p1-angle-3.png',
    ])
    expect(images).toHaveLength(3)
    expect(images).toEqual([
      'https://images.local/p1.png',
      'https://images.local/p1-angle-2.png',
      'https://images.local/p1-angle-3.png',
    ])
  })

  it('handles null image_url gracefully', () => {
    const images = resolveGalleryImages(null, ['https://images.local/extra.png'])
    expect(images).toEqual(['https://images.local/extra.png'])
  })
})
