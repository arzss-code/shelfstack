export function useMidtransSnap() {
  const config = useRuntimeConfig()
  const isLoaded = ref(false)

  const loadSnapScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!import.meta.client) return resolve()

      const windowAny = window as unknown as {
        snap?: { pay: (token: string, options?: unknown) => void }
      }
      if (windowAny.snap) {
        isLoaded.value = true
        return resolve()
      }

      const snapUrl =
        (config.public.midtransSnapUrl as string) || 'https://app.sandbox.midtrans.com/snap/snap.js'
      const clientKey = (config.public.midtransClientKey as string) || ''

      const existingScript = document.querySelector('script[src*="snap.js"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          isLoaded.value = true
          resolve()
        })
        return
      }

      const script = document.createElement('script')
      script.src = snapUrl
      if (clientKey) {
        script.setAttribute('data-client-key', clientKey)
      }
      script.async = true
      script.onload = () => {
        isLoaded.value = true
        resolve()
      }
      script.onerror = (err) => {
        console.error('Failed to load Midtrans Snap script:', err)
        reject(err)
      }
      document.head.appendChild(script)
    })
  }

  const pay = async (
    token: string,
    callbacks?: {
      onSuccess?: (result: unknown) => void
      onPending?: (result: unknown) => void
      onError?: (result: unknown) => void
      onClose?: () => void
    },
  ) => {
    await loadSnapScript()
    const windowAny = window as unknown as {
      snap?: { pay: (token: string, options?: unknown) => void }
    }
    if (windowAny.snap) {
      windowAny.snap.pay(token, callbacks)
    } else {
      console.warn('Midtrans Snap SDK is not loaded.')
    }
  }

  return {
    isLoaded,
    loadSnapScript,
    pay,
  }
}
