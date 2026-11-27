export interface ServiceWorkerRegistrationOptions {
  bypassTestGuard?: boolean
  navigatorRef?: Navigator
}

export function shouldSkipServiceWorkerRegistration(): boolean {
  if (import.meta.test || import.meta.dev) {
    return true
  }
  if ('process' in globalThis && globalThis.process && typeof globalThis.process === 'object') {
    const proc = globalThis.process
    if ('env' in proc && proc.env && typeof proc.env === 'object' && 'NODE_ENV' in proc.env) {
      return proc.env.NODE_ENV === 'test'
    }
  }
  return false
}

export async function registerServiceWorker(
  options: ServiceWorkerRegistrationOptions = {},
): Promise<ServiceWorkerRegistration | null> {
  if (!options.bypassTestGuard && shouldSkipServiceWorkerRegistration()) {
    return null
  }

  const nav = options.navigatorRef ?? (typeof navigator !== 'undefined' ? navigator : undefined)
  if (!nav || !('serviceWorker' in nav) || typeof nav.serviceWorker?.register !== 'function') {
    return null
  }

  try {
    return await nav.serviceWorker.register('/sw.js', { scope: '/' })
  } catch {
    return null
  }
}

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') {
    return
  }

  // Purge previously registered dev service workers so local assets stay fresh
  if (
    import.meta.dev &&
    !import.meta.test &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  ) {
    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        registrations.forEach((registration) => void registration.unregister()),
      )
    return
  }

  if (shouldSkipServiceWorkerRegistration()) {
    return
  }

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  const runRegistration = () => {
    void registerServiceWorker()
  }

  if (typeof document !== 'undefined' && document.readyState === 'complete') {
    runRegistration()
    return
  }

  window.addEventListener('load', runRegistration, { once: true })
})
