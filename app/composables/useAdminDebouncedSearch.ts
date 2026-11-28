import { getCurrentScope, onScopeDispose, watch, type Ref } from 'vue'

const DEFAULT_DEBOUNCE_MS = 300

export interface ActiveRequestHandle {
  token: number
  signal: AbortSignal
}

/**
 * Determine whether an unknown caught error came from an aborted fetch/AbortController.
 */
export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const record = err as { name?: unknown; cause?: unknown }
  if (record.name === 'AbortError') return true
  if (record.cause && typeof record.cause === 'object') {
    return (record.cause as { name?: unknown }).name === 'AbortError'
  }
  return false
}

/**
 * Track overlapping async fetches with automatic AbortController cancellation,
 * stale-response guarding, and shared loading/error lifecycle handling.
 */
export function useAbortableRequest() {
  let activeController: AbortController | null = null
  let latestToken = 0

  function beginRequest(): ActiveRequestHandle {
    if (activeController) {
      activeController.abort()
    }
    latestToken += 1
    activeController = new AbortController()
    return {
      token: latestToken,
      signal: activeController.signal,
    }
  }

  function isLatestRequest(token: number): boolean {
    return token === latestToken
  }

  function finishRequest(token: number) {
    if (token === latestToken) {
      activeController = null
    }
  }

  function abortActiveRequest() {
    latestToken += 1
    if (activeController) {
      activeController.abort()
      activeController = null
    }
  }

  async function runAbortable(
    loadingRef: Ref<boolean>,
    executor: (ctx: { signal: AbortSignal; isCurrent: () => boolean }) => Promise<void>,
    onError?: (err: unknown) => void,
  ): Promise<void> {
    const { token, signal } = beginRequest()
    loadingRef.value = true
    try {
      await executor({ signal, isCurrent: () => isLatestRequest(token) })
    } catch (err: unknown) {
      if (isAbortError(err) || signal.aborted || !isLatestRequest(token)) return
      onError?.(err)
    } finally {
      finishRequest(token)
      if (isLatestRequest(token)) {
        loadingRef.value = false
      }
    }
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      abortActiveRequest()
    })
  }

  return {
    beginRequest,
    isLatestRequest,
    finishRequest,
    abortActiveRequest,
    runAbortable,
  }
}

/**
 * Shared debounced server search and request cancellation controller for admin list views.
 * Triggers after 300ms for 1+ chars and immediately (0ms) when cleared to empty.
 */
export function useAdminDebouncedSearch(searchQuery: Ref<string>, onSearch: () => void) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let suppressNext = false
  const abortable = useAbortableRequest()

  function clearDebounceTimer() {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  function cancelAll() {
    clearDebounceTimer()
    abortable.abortActiveRequest()
  }

  function triggerNow() {
    clearDebounceTimer()
    onSearch()
  }

  function skipNextWatch() {
    clearDebounceTimer()
    suppressNext = true
  }

  function clearQuery() {
    clearDebounceTimer()
    if (searchQuery.value !== '') {
      suppressNext = true
      searchQuery.value = ''
    }
  }

  watch(searchQuery, (nextValue, prevValue) => {
    if (suppressNext) {
      suppressNext = false
      return
    }
    if (nextValue.trim() === (prevValue ?? '').trim()) {
      return
    }

    clearDebounceTimer()
    if (nextValue.trim() === '') {
      onSearch()
      return
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null
      onSearch()
    }, DEFAULT_DEBOUNCE_MS)
  })

  if (getCurrentScope()) {
    onScopeDispose(() => {
      cancelAll()
    })
  }

  return {
    ...abortable,
    cancelAll,
    triggerNow,
    skipNextWatch,
    clearQuery,
  }
}
