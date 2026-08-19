import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['**/*.spec.ts', '**/*.test.ts'],
    exclude: ['node_modules', '.nuxt', 'dist', 'playwright', 'tests/e2e'],
  },
})
