<script setup lang="ts">
// Layout admin (Fase 1: shell + guard. Diisi penuh Fase 4: Dashboard, Orders, Products).
// Setiap halaman admin wajib: definePageMeta({ layout: 'admin', middleware: 'admin' })
</script>

<template>
  <div
    class="flex min-h-screen bg-surface-50 text-surface-900 transition-colors dark:bg-surface-950 dark:text-surface-0"
  >
    <!-- Sidebar (diisi penuh Fase 4: Dashboard, Orders, Products) -->
    <aside
      class="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-surface-200 p-4 md:flex dark:border-surface-800"
    >
      <NuxtLink to="/" class="mb-4 flex items-center gap-3 px-2 py-2 no-underline">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <i class="pi pi-box text-lg" />
        </div>
        <span class="text-base font-bold tracking-tight">ShelfStack Admin</span>
      </NuxtLink>

      <NuxtLink
        to="/admin/products"
        class="rounded-md px-3 py-2 text-sm font-semibold no-underline"
        active-class="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
      >
        Produk
      </NuxtLink>

      <NuxtLink
        to="/admin/activities"
        class="rounded-md px-3 py-2 text-sm font-semibold no-underline"
        active-class="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
      >
        Activity Log
      </NuxtLink>

      <div class="mt-auto">
        <NuxtLink
          to="/"
          class="block rounded-md px-3 py-2 text-sm text-surface-500 no-underline hover:bg-surface-100 dark:hover:bg-surface-800"
        >
          ← Kembali ke Toko
        </NuxtLink>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <AppNavbar />
      <main class="flex flex-1 justify-center p-8">
        <div class="w-full max-w-[1200px]">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
