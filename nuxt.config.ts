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
        { name: 'color-scheme', content: 'light dark' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { property: 'og:site_name', content: 'ShelfStack' },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'id_ID' },
      ],
      link: [
        { rel: 'manifest', href: '/site.webmanifest' },
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
    '@nuxt/fonts',
    '@nuxt/image',
    'nuxt-security',
  ],

  fonts: {
    families: [{ name: 'DM Sans', provider: 'google', weights: [400, 500, 600, 700] }],
  },

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
    appUrl:
      process.env.APP_URL ||
      process.env.NUXT_PUBLIC_SITE_URL ||
      'https://shelfstack.atsiilaarya.me',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@shelfstack.atsiilaarya.me',
    public: {
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL ||
        process.env.APP_URL ||
        'https://shelfstack.atsiilaarya.me',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@shelfstack.atsiilaarya.me',
      enableMidtransSandbox: process.env.NUXT_PUBLIC_ENABLE_MIDTRANS_SANDBOX === 'true',
      enableMidtrans: process.env.NUXT_PUBLIC_ENABLE_MIDTRANS_SANDBOX === 'true',
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
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'SAMEORIGIN',
      referrerPolicy: 'strict-origin-when-cross-origin',
      xXSSProtection: '0',
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
    // Prevent browsers or proxies from caching the service worker script across deploys
    '/sw.js': {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
      },
    },
    // Exempt payment webhook to prevent dropping legitimate gateway notifications/retries
    '/api/midtrans/notification': {
      security: {
        rateLimiter: false,
      },
    },
    // Authentication endpoints: brute-force mitigation (E-08)
    '/api/auth/**': {
      security: {
        rateLimiter: {
          tokensPerInterval: 5,
          interval: 60000,
        },
      },
    },
    // Checkout & Order creation: prevent spamming orders (E-08)
    '/api/orders': {
      security: {
        rateLimiter: {
          tokensPerInterval: 10,
          interval: 60000,
        },
      },
    },
    // Instant search: throttle rapid autocomplete requests (E-08)
    '/api/products/search-instant': {
      security: {
        rateLimiter: {
          tokensPerInterval: 30,
          interval: 60000,
        },
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
    // Public tracking lookup: prevent IDOR enumeration and scraping
    '/api/tracking/**': {
      security: {
        rateLimiter: {
          tokensPerInterval: 20,
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
