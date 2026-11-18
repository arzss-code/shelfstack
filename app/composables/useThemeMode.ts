import { computed, ref, type Ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'shelfstack-theme'

function applyThemeClass(mode: ThemeMode) {
  if (!import.meta.client || typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', mode === 'dark')
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
    let initial: ThemeMode = 'light'
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      if (saved === 'dark' || saved === 'light') {
        initial = saved
      } else if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ) {
        initial = 'dark'
      }
    } catch {
      initial = 'light'
    }
    theme.value = initial
    applyThemeClass(initial)
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme,
  }
}
