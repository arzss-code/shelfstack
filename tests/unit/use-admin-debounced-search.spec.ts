import { ref, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminDebouncedSearch, isAbortError } from '~/composables/useAdminDebouncedSearch'

describe('useAdminDebouncedSearch composable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces non-empty 1+ character updates by 300ms and collapses rapid typing', async () => {
    const query = ref('')
    const onSearch = vi.fn()

    useAdminDebouncedSearch(query, onSearch)

    query.value = 's'
    await nextTick()
    expect(onSearch).not.toHaveBeenCalled()

    vi.advanceTimersByTime(150)
    query.value = 'si'
    await nextTick()
    vi.advanceTimersByTime(150)
    query.value = 'siti'
    await nextTick()

    expect(onSearch).not.toHaveBeenCalled()

    vi.advanceTimersByTime(299)
    expect(onSearch).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('triggers immediately with 0ms delay when search query is cleared', async () => {
    const query = ref('siti')
    const onSearch = vi.fn()

    useAdminDebouncedSearch(query, onSearch)

    query.value = 'sit'
    await nextTick()
    query.value = ''
    await nextTick()

    expect(onSearch).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(500)
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('cancels pending debounce timer and triggers immediately when triggerNow() is called', async () => {
    const query = ref('')
    const onSearch = vi.fn()

    const { triggerNow } = useAdminDebouncedSearch(query, onSearch)

    query.value = 'budi'
    await nextTick()
    triggerNow()

    expect(onSearch).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(500)
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it('aborts previous in-flight signal and tracks latest active request token', () => {
    const query = ref('')
    const { beginRequest, isLatestRequest, finishRequest, cancelAll } = useAdminDebouncedSearch(
      query,
      vi.fn(),
    )

    const req1 = beginRequest()
    expect(req1.signal.aborted).toBe(false)
    expect(isLatestRequest(req1.token)).toBe(true)

    const req2 = beginRequest()
    expect(req1.signal.aborted).toBe(true)
    expect(isLatestRequest(req1.token)).toBe(false)
    expect(req2.signal.aborted).toBe(false)
    expect(isLatestRequest(req2.token)).toBe(true)

    finishRequest(req1.token)
    expect(isLatestRequest(req2.token)).toBe(true)

    cancelAll()
    expect(req2.signal.aborted).toBe(true)
  })

  it('recognizes AbortError across native DOMException and wrapped cause errors', () => {
    const abortErr = new DOMException('Aborted', 'AbortError')
    const wrappedErr = Object.assign(new Error('Fetch aborted'), { cause: abortErr })
    const networkErr = new Error('Network failure')

    expect(isAbortError(abortErr)).toBe(true)
    expect(isAbortError(wrappedErr)).toBe(true)
    expect(isAbortError(networkErr)).toBe(false)
    expect(isAbortError(null)).toBe(false)
  })

  it('ignores whitespace-only transitions and handles runAbortable + clearQuery cleanly', async () => {
    const query = ref('')
    const onSearch = vi.fn()
    const onError = vi.fn()
    const loading = ref(false)

    const { runAbortable, clearQuery } = useAdminDebouncedSearch(query, onSearch)

    query.value = '   '
    await nextTick()
    vi.advanceTimersByTime(350)
    expect(onSearch).not.toHaveBeenCalled()

    query.value = ''
    await nextTick()
    expect(onSearch).not.toHaveBeenCalled()

    query.value = 'kursi'
    await nextTick()
    clearQuery()
    await nextTick()
    vi.advanceTimersByTime(350)
    expect(query.value).toBe('')
    expect(onSearch).not.toHaveBeenCalled()

    let rejectFirst!: (reason?: unknown) => void
    const firstPromise = runAbortable(
      loading,
      ({ signal }) =>
        new Promise((_resolve, reject) => {
          rejectFirst = reject
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
      onError,
    )
    expect(loading.value).toBe(true)

    let resolveSecond!: () => void
    const secondPromise = runAbortable(
      loading,
      () =>
        new Promise<void>((resolve) => {
          resolveSecond = resolve
        }),
      onError,
    )

    rejectFirst(new Error('late stale failure'))
    await firstPromise
    expect(loading.value).toBe(true)
    expect(onError).not.toHaveBeenCalled()

    resolveSecond()
    await secondPromise
    expect(loading.value).toBe(false)
  })
})
