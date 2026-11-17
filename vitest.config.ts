import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  resolve: {
    alias: {
      '#supabase/server': fileURLToPath(
        new URL('./runtime/server/services/index.js', import.meta.resolve('@nuxtjs/supabase')),
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['node_modules', '.nuxt', '.kilo', 'dist', 'playwright', 'tests/e2e', 'services/**'],
  },
})
