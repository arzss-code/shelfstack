<script setup lang="ts">
import AppNavbar from '~/components/AppNavbar.vue'
import AppFooter from '~/components/AppFooter.vue'
</script>

<template>
  <div
    class="storefront flex flex-col min-h-screen bg-brand-canvas text-brand-ink selection:bg-brand-accent selection:text-white transition-colors duration-200"
  >
    <!-- Floating Stadium Navbar -->
    <AppNavbar />

    <!-- Main Content Area -->
    <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <slot />
    </main>

    <!-- Modernist Inverted Footer -->
    <AppFooter />
  </div>
</template>
