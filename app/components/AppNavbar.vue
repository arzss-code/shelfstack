<script setup lang="ts">
// Navbar Component
</script>

<template>
  <header
    class="sticky top-0 z-20 flex justify-center px-8 py-4 bg-surface-0/80 dark:bg-surface-950/80 border-b border-surface-200 dark:border-surface-800 shadow-sm backdrop-blur-md"
  >
    <div class="flex items-center justify-between w-full max-w-[1200px]">
      <!-- Brand Logo -->
      <NuxtLink
        to="/"
        class="flex items-center gap-3 text-surface-900 dark:text-surface-0 no-underline group"
      >
        <div
          class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white group-hover:scale-105 transition-transform shadow-sm"
        >
          <i class="pi pi-box text-lg" />
        </div>
        <h2 class="m-0 text-lg font-bold tracking-tight">Simple Product CRUD</h2>
      </NuxtLink>

      <!-- Navigation Links -->
      <nav class="flex items-center gap-8">
        <NuxtLink v-slot="{ href, navigate, isActive }" to="/" custom>
          <a
            :href="href || undefined"
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-semibold transition-colors',
              isActive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-surface-0 dark:hover:bg-surface-800',
            ]"
            @click="navigate"
          >
            Beranda
          </a>
        </NuxtLink>
        <NuxtLink v-slot="{ href, navigate, isActive }" to="/admin/activities" custom>
          <a
            :href="href || undefined"
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-semibold transition-colors',
              isActive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-surface-0 dark:hover:bg-surface-800',
            ]"
            @click="navigate"
          >
            Activity Log
          </a>
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
