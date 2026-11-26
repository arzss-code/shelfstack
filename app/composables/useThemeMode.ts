import { computed, ref, type Ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'shelfstack-theme'
let isSystemListenerBound = false

function applyThemeClass(mode: ThemeMode) {
  if (!import.meta.client || typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

function readSavedTheme(): ThemeMode | null {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return saved === 'dark' || saved === 'light' ? saved : null
  } catch {
    return null
  }
}

export function useThemeMode() {
  let theme: Ref<ThemeMode>
  try {
    theme = useState<ThemeMode>('shelfstack-theme', () => 'light')
  } catch {
    theme = ref<ThemeMode>('light')
  }

  const isDark = computed(() => theme.value === 'dark')

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    applyThemeClass(mode)
    if (import.meta.client) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, mode)
      } catch {
        // Ignore storage quota / privacy mode failures
      }
    }
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  function initTheme() {
    if (!import.meta.client) return
    const saved = readSavedTheme()
    const mediaQuery =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null

    const initial: ThemeMode = saved ?? (mediaQuery?.matches ? 'dark' : 'light')
    theme.value = initial
    applyThemeClass(initial)

    if (mediaQuery && !isSystemListenerBound && typeof mediaQuery.addEventListener === 'function') {
      isSystemListenerBound = true
      mediaQuery.addEventListener('change', (event) => {
        if (readSavedTheme()) return
        const next: ThemeMode = event.matches ? 'dark' : 'light'
        theme.value = next
        applyThemeClass(next)
      })
    }
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
  }
}
