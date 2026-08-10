<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk
      ? `${titleChunk} | Simple Product CRUD`
      : "Simple Product CRUD";
  },
});
</script>

<template>
  <div>
    <Toast />
    <ConfirmDialog />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
