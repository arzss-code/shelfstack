export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: true,
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'id',
      },
      title: 'ShelfStack',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'ShelfStack: Curated Archival Department Store' },
        { name: 'theme-color', content: '#141414' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { property: 'og:site_name', content: 'ShelfStack' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'id_ID' },
      ],
      link: [
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&display=swap',
        },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=2' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png?v=2' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=2' },
      ],
    },
  },

  css: ['primeicons/primeicons.css', '~/assets/css/print-documents.css'],

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
    orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://127.0.0.1:4000',
    internalServiceKey: process.env.INTERNAL_SERVICE_KEY || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    emailFrom: process.env.EMAIL_FROM || 'ShelfStack <noreply@shelfstack.atsiilaarya.me>',
    emailProvider: process.env.EMAIL_PROVIDER || '',
    public: {
      enableMidtransSandbox: process.env.NUXT_PUBLIC_ENABLE_MIDTRANS_SANDBOX === 'true',
      midtransClientKey: process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
      midtransSnapUrl:
        process.env.NUXT_PUBLIC_MIDTRANS_SNAP_URL ||
        'https://app.sandbox.midtrans.com/snap/snap.js',
      googleClientId:
        process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
    },
  },

  security: {
    // Nonaktifkan rateLimiter default modul nuxt-security pada level global agar navigasi
    // storefront dan runner pengujian otomatis tidak terkena pembatasan HTTP 429.
    // Proteksi rateLimiter tetap ditegakkan secara granular pada endpoint sensitif via routeRules.
    rateLimiter: false,
    headers: {
      contentSecurityPolicy: {
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://accounts.google.com/gsi/',
        ],
        'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
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
          'https://accounts.google.com',
          'https://accounts.google.com/gsi/',
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
          'https://accounts.google.com',
          'https://accounts.google.com/gsi/',
        ],
        'frame-src': [
          "'self'",
          'https://app.sandbox.midtrans.com',
          'https://app.midtrans.com',
          'https://*.midtrans.com',
          'https://accounts.google.com',
          'https://accounts.google.com/gsi/',
        ],
        'worker-src': ["'self'"],
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
    '/api/coupons/validate': {
      security: {
        rateLimiter: {
          tokensPerInterval: 20,
          interval: 60000,
        },
      },
    },
    '/api/returns/upload': {
      security: {
        rateLimiter: {
          tokensPerInterval: 10,
          interval: 60000,
        },
      },
    },
    '/api/support/upload': {
      security: {
        rateLimiter: {
          tokensPerInterval: 15,
          interval: 60000,
        },
      },
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'search',
    },
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
