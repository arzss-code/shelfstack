import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['.kilo/**', '.nuxt/**', '.output/**', 'node_modules/**'],
  },
  {
    files: ['scripts/load-test/**'],
    languageOptions: {
      globals: {
        __ENV: 'readonly',
      },
    },
  },
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
      },
    },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-useless-catch': 'off',
      'vue/html-self-closing': 'off',
    },
  },
)
