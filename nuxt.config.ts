import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const NoirPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{zinc.50}',
      100: '{zinc.100}',
      200: '{zinc.200}',
      300: '{zinc.300}',
      400: '{zinc.400}',
      500: '{zinc.500}',
      600: '{zinc.600}',
      700: '{zinc.700}',
      800: '{zinc.800}',
      900: '{zinc.900}',
      950: '{zinc.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{zinc.950}',
          inverseColor: '#ffffff',
          hoverColor: '{zinc.900}',
          activeColor: '{zinc.800}',
        },
        highlight: {
          background: '{zinc.950}',
          focusBackground: '{zinc.700}',
          color: '#ffffff',
          focusColor: '#ffffff',
        },
      },
      dark: {
        primary: {
          color: '{zinc.50}',
          inverseColor: '{zinc.950}',
          hoverColor: '{zinc.100}',
          activeColor: '{zinc.200}',
        },
        highlight: {
          background: 'rgba(250, 250, 250, .16)',
          focusBackground: 'rgba(250, 250, 250, .24)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
  components: {
    toast: {
      root: {
        blur: '0',
      },
      colorScheme: {
        light: {
          root: {
            blur: '0',
          },
        },
        dark: {
          root: {
            blur: '0',
          },
        },
      },
    },
  },
})

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: true,
  },

  css: ['primeicons/primeicons.css'],

  modules: [
    '@primevue/nuxt-module',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    '@nuxt/image',
    'nuxt-security',
  ],

  supabase: {
    redirect: false,
  },

  imports: {
    dirs: ['features/**/composables', 'features/**/stores'],
  },

  runtimeConfig: {
    midtransServerKey: process.env.MIDTRANS_SERVER_KEY || '',
    midtransApiUrl:
      process.env.MIDTRANS_API_URL || 'https://app.sandbox.midtrans.com/snap/v1/transactions',
    public: {
      enableMidtransSandbox: process.env.NUXT_PUBLIC_ENABLE_MIDTRANS_SANDBOX === 'true',
      midtransClientKey: process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
      midtransSnapUrl:
        process.env.NUXT_PUBLIC_MIDTRANS_SNAP_URL ||
        'https://app.sandbox.midtrans.com/snap/snap.js',
    },
  },

  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': [
          "'self'",
          'data:',
          'https://*.supabase.co',
          'https://lh3.googleusercontent.com',
          'https://images.unsplash.com',
          'https://*.midtrans.com',
        ],
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          'https://app.sandbox.midtrans.com',
          'https://app.midtrans.com',
          'https://*.midtrans.com',
        ],
        'connect-src': [
          "'self'",
          'https://*.supabase.co',
          'wss://*.supabase.co',
          'https://app.sandbox.midtrans.com',
          'https://api.sandbox.midtrans.com',
          'https://app.midtrans.com',
          'https://api.midtrans.com',
          'https://*.midtrans.com',
        ],
        'frame-src': [
          "'self'",
          'https://app.sandbox.midtrans.com',
          'https://app.midtrans.com',
          'https://*.midtrans.com',
        ],
      },
    },
  },

  routeRules: {
    // Exempt payment webhook to prevent dropping legitimate gateway notifications/retries
    '/api/midtrans/notification': {
      security: {
        rateLimiter: false,
      },
    },
    // Sensitive mutation endpoints: protected against abuse/fraud attempts
    '/api/checkout': {
      security: {
        rateLimiter: {
          tokensPerInterval: 20,
          interval: 60000,
        },
      },
    },
    '/api/orders/**/snap-token': {
      security: {
        rateLimiter: {
          tokensPerInterval: 30,
          interval: 60000,
        },
      },
    },
    '/api/orders/**/cancel': {
      security: {
        rateLimiter: {
          tokensPerInterval: 20,
          interval: 60000,
        },
      },
    },
    '/api/orders/**/refund': {
      security: {
        rateLimiter: {
          tokensPerInterval: 10,
          interval: 60000,
        },
      },
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  // Abaikan nested worktree Kilo (.kilo/) agar Vite watcher + HMR tidak melambat.
  vite: {
    server: {
      watch: {
        ignored: ['**/.kilo/**'],
      },
    },
  },

  primevue: {
    options: {
      theme: {
        preset: NoirPreset,
        options: {
          darkModeSelector: 'system',
          cssLayer: {
            name: 'primevue',
            order: 'tailwind-base, primevue, tailwind-utilities',
          },
        },
      },
    },
    components: {
      include: '*',
    },
  },
})
