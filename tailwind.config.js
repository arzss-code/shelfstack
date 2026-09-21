/** @type {import('tailwindcss').Config} */
export default {
  // Ikut OS (prefers-color-scheme), sama seperti PrimeVue darkModeSelector: 'system'.
  // Jangan pakai 'class' agar tidak tabrakan: satu sumber kebenaran mode gelap.
  darkMode: 'media',
  content: [
    './app/**/*.{js,vue,ts}',
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Token brand storefront (DESIGN.md). Nilai hidup di main.css sebagai
        // CSS variable + override dark-mode. Ganti warna cukup di SATU tempat.
        brand: {
          canvas: 'var(--brand-canvas)',
          ink: 'var(--brand-ink)',
          onink: 'var(--brand-onink)',
          inkhover: 'var(--brand-inkhover)',
          body: 'var(--brand-body)',
          muted: 'var(--brand-muted)',
          faint: 'var(--brand-faint)',
          hair: 'var(--brand-hair)',
          hairsoft: 'var(--brand-hairsoft)',
          soft: 'var(--brand-soft)',
          cobalt: 'var(--brand-cobalt)',
          cobaltdeep: 'var(--brand-cobaltdeep)',
          strip: 'var(--brand-strip)',
        },
        primary: {
          50: 'var(--p-primary-50)',
          100: 'var(--p-primary-100)',
          200: 'var(--p-primary-200)',
          300: 'var(--p-primary-300)',
          400: 'var(--p-primary-400)',
          500: 'var(--p-primary-500)',
          600: 'var(--p-primary-600)',
          700: 'var(--p-primary-700)',
          800: 'var(--p-primary-800)',
          900: 'var(--p-primary-900)',
          950: 'var(--p-primary-950)',
        },
        surface: {
          0: 'var(--p-surface-0)',
          50: 'var(--p-surface-50)',
          100: 'var(--p-surface-100)',
          200: 'var(--p-surface-200)',
          300: 'var(--p-surface-300)',
          400: 'var(--p-surface-400)',
          500: 'var(--p-surface-500)',
          600: 'var(--p-surface-600)',
          700: 'var(--p-surface-700)',
          800: 'var(--p-surface-800)',
          900: 'var(--p-surface-900)',
          950: 'var(--p-surface-950)',
        },
      },
    },
  },
  plugins: [],
}
