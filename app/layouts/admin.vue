<script setup lang="ts">
import AppNavbar from '~/components/AppNavbar.vue'
import AppFooter from '~/components/AppFooter.vue'
</script>

<template>
  <div
    class="flex min-h-screen bg-brand-canvas text-brand-ink selection:bg-brand-accent selection:text-white transition-colors duration-200"
  >
    <!-- Modernist Admin Sidebar -->
    <aside
      class="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-2 border-r border-brand-hair bg-brand-canvas-soft p-5 md:flex"
    >
      <NuxtLink
        to="/"
        class="mb-6 flex items-center gap-2.5 px-2 py-2 no-underline text-brand-ink group"
      >
        <AppLogo variant="mark-only" size="md" />
        <div class="flex flex-col">
          <span class="font-display text-sm font-bold tracking-tight text-brand-ink"
            >ShelfStack</span
          >
          <span class="text-[10px] font-medium text-brand-muted uppercase tracking-wider"
            >Admin Workspace</span
          >
        </div>
      </NuxtLink>

      <nav class="flex flex-col gap-1.5" aria-label="Navigasi Menu Admin">
        <NuxtLink
          to="/admin/products"
          class="rounded-full px-4 py-2.5 text-xs font-semibold no-underline transition-all flex items-center gap-2.5 text-brand-muted hover:text-brand-ink hover:bg-brand-canvas"
          active-class="!bg-brand-ink !text-brand-onink shadow-whisper"
        >
          <i class="pi pi-th-large text-xs" />
          <span>Kelola Produk</span>
        </NuxtLink>

        <NuxtLink
          to="/admin/activities"
          class="rounded-full px-4 py-2.5 text-xs font-semibold no-underline transition-all flex items-center gap-2.5 text-brand-muted hover:text-brand-ink hover:bg-brand-canvas"
          active-class="!bg-brand-ink !text-brand-onink shadow-whisper"
        >
          <i class="pi pi-history text-xs" />
          <span>Activity Log</span>
        </NuxtLink>
      </nav>

      <div class="mt-auto pt-4 border-t border-brand-hairsoft">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-brand-muted no-underline hover:bg-brand-canvas hover:text-brand-ink transition-colors"
        >
          <i class="pi pi-arrow-left text-xs" />
          <span>Kembali ke Etalase</span>
        </NuxtLink>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <AppNavbar />
      <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <slot />
      </main>
      <AppFooter />
    </div>
  </div>
</template>
