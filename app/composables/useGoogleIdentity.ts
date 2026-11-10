import { ref, computed } from 'vue'

export interface GoogleIdentityCallbackResponse {
  credential?: string
  select_by?: string
}

export interface GoogleIdentityInitOptions {
  onSuccess: (idToken: string) => Promise<void> | void
  onError?: (error: Error) => void
  autoSelect?: boolean
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleIdentityCallbackResponse) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          prompt: (notification?: (notification: unknown) => void) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              logo_alignment?: 'left' | 'center'
              width?: number | string
              locale?: string
            },
          ) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

/**
 * Composable Google Identity Services (GIS).
 * Menggunakan ID Token flow (OIDC) agar origin Google tetap berada pada domain aplikasi
 * (localhost atau custom domain) tanpa me-redirect pengguna ke subdomain Supabase.
 */
export function useGoogleIdentity() {
  const googleClientId = computed<string>(() => {
    try {
      const config = useRuntimeConfig()
      return (config.public?.googleClientId as string) || ''
    } catch {
      return ''
    }
  })

  const isConfigured = computed(() => {
    return googleClientId.value.trim().length > 0
  })

  const isGisLoaded = ref(false)
  const isInitializing = ref(false)

  const loadGisScript = async (): Promise<boolean> => {
    if (!import.meta.client) return false

    if (window.google?.accounts?.id) {
      isGisLoaded.value = true
      return true
    }

    // Periksa apakah tag script sudah ada di DOM
    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (existingScript) {
      const { promise, resolve } = Promise.withResolvers<boolean>()
      existingScript.addEventListener('load', () => {
        isGisLoaded.value = true
        resolve(true)
      })
      existingScript.addEventListener('error', () => resolve(false))
      return promise
    }

    const { promise, resolve } = Promise.withResolvers<boolean>()
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      isGisLoaded.value = true
      resolve(true)
    }
    script.onerror = () => {
      isGisLoaded.value = false
      resolve(false)
    }
    document.head.appendChild(script)
    return promise
  }

  const initGoogleIdentity = async (options: GoogleIdentityInitOptions): Promise<boolean> => {
    if (!import.meta.client || !isConfigured.value) return false

    isInitializing.value = true
    try {
      const loaded = await loadGisScript()
      if (!loaded || !window.google?.accounts?.id) {
        return false
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId.value,
        auto_select: options.autoSelect ?? false,
        cancel_on_tap_outside: true,
        callback: async (response: GoogleIdentityCallbackResponse) => {
          if (response.credential) {
            await options.onSuccess(response.credential)
          } else if (options.onError) {
            options.onError(new Error('Kredensial ID Token dari Google tidak ditemukan.'))
          }
        },
      })

      return true
    } finally {
      isInitializing.value = false
    }
  }

  const renderButton = (
    element: HTMLElement | null,
    buttonOptions: Parameters<
      NonNullable<
        NonNullable<NonNullable<NonNullable<Window['google']>['accounts']>['id']>['renderButton']
      >
    >[1] = {},
  ) => {
    if (!import.meta.client || !element || !window.google?.accounts?.id) return

    window.google.accounts.id.renderButton(element, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      locale: 'id',
      ...buttonOptions,
    })
  }

  const promptOneTap = () => {
    if (!import.meta.client || !window.google?.accounts?.id) return
    window.google.accounts.id.prompt()
  }

  return {
    googleClientId,
    isConfigured,
    isGisLoaded,
    isInitializing,
    loadGisScript,
    initGoogleIdentity,
    renderButton,
    promptOneTap,
  }
}
