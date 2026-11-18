<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
await navigateTo(
  { path: '/account/points', query: route.query },
  { redirectCode: 301, replace: true },
)
</script>

<template>
  <div class="py-12 text-center text-xs text-brand-muted">
    Mengalihkan ke halaman Koin &amp; Rewards...
  </div>
</template>
