<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | ShelfStack` : 'ShelfStack'
  },
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=2' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png?v=2' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png?v=2' },
  ],
})
</script>

<template>
  <div>
    <UiToastHost />
    <UiConfirmHost />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
