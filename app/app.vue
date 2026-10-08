<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | ShelfStack` : 'ShelfStack'
  },
})
</script>

<template>
  <div>
    <Toast position="bottom-left" />
    <ConfirmDialog />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
