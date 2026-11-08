/**
 * Composable utilitas untuk siklus hidup polling dan sinkronisasi
 * status pesanan pending saat tab browser aktif/fokus.
 */

export function useOrderPolling(syncFn: () => Promise<void> | void, intervalMs = 4000) {
  let pollInterval: ReturnType<typeof setInterval> | null = null

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  const startPolling = () => {
    if (pollInterval || !import.meta.client) return
    pollInterval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        await syncFn()
      }
    }, intervalMs)
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      syncFn()
    }
  }

  const setupVisibilityListeners = () => {
    if (import.meta.client) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleVisibilityChange)
    }
  }

  const teardownVisibilityListeners = () => {
    stopPolling()
    if (import.meta.client) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }

  return {
    startPolling,
    stopPolling,
    setupVisibilityListeners,
    teardownVisibilityListeners,
  }
}
