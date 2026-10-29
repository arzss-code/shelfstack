<script setup lang="ts">
import AppNavbar from '~/components/AppNavbar.vue'
import AppFooter from '~/components/AppFooter.vue'
import CartDrawer from '~/features/cart/components/CartDrawer.vue'
import { useCartStore } from '~/features/cart/stores/cart'
import { useWishlistStore } from '~/features/wishlist/stores/wishlist'
import { useNotificationStore } from '~/features/notifications/stores/notifications'

// Sinkron ulang keranjang, wishlist, & notifikasi setiap mount layout.
// Di Nuxt 4 SSR, hidrasi browser memerlukan pemulihan state persisten pada lifecycle onMounted.
onMounted(() => {
  useCartStore().initCart()
  useWishlistStore().initWishlist()
  useNotificationStore().initNotifications()
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
