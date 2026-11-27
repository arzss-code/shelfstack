import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const requireFromTestUtils = createRequire(import.meta.resolve('@nuxt/test-utils'))

export default defineVitestConfig({
  resolve: {
    alias: {
      '#supabase/server': fileURLToPath(
        new URL('./runtime/server/services/index.js', import.meta.resolve('@nuxtjs/supabase')),
      ),
      h3: join(dirname(requireFromTestUtils.resolve('h3/package.json')), 'dist/index.mjs'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['node_modules', '.nuxt', '.kilo', 'dist', 'playwright', 'tests/e2e', 'services/**'],
  },
})
