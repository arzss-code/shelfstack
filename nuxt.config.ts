export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: true,
  },

  css: ['primeicons/primeicons.css'],

  modules: [
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
    '/api/orders/**/payment-token': {
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
})
