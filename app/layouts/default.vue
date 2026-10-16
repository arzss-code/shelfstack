<script setup lang="ts">
import AppNavbar from '~/components/AppNavbar.vue'
import AppFooter from '~/components/AppFooter.vue'
import CartDrawer from '~/features/cart/components/CartDrawer.vue'
import { useCartStore } from '~/features/cart/stores/cart'

// Sinkron ulang keranjang dari localStorage setiap mount layout.
// initCart di setup store tidak cukup untuk full page load (SSR + hidrasi),
// sehingga refresh atau URL langsung ke /cart dan /checkout tampil kosong
// meski data tersimpan. Idempoten: hanya membaca dan menetapkan ulang.
onMounted(() => {
  useCartStore().initCart()
})
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

    <!-- Global Slide-over Cart Drawer -->
    <CartDrawer />

    <!-- Modernist Inverted Footer -->
    <AppFooter />
  </div>
</template>
