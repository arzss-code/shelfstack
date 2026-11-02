<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

await navigateTo('/account/profile', { replace: true })
</script>

<template>
  <div class="min-h-screen bg-brand-canvas flex items-center justify-center p-8">
    <div class="flex items-center gap-2 text-xs text-brand-muted">
      <i class="pi pi-spin pi-spinner text-sm" />
      <span>Mengalihkan ke profil akun...</span>
    </div>
  </div>
</template>
