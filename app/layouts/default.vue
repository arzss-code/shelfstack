<script setup lang="ts"></script>

<template>
  <div
    class="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-0 transition-colors"
  >
    <AppNavbar />

    <!-- Main Content Container -->
    <main class="flex-1 flex justify-center p-8">
      <div class="w-full max-w-[1200px]">
        <slot />
      </div>
    </main>
  </div>
</template>
