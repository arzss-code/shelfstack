<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'
import { extractAuthUserId } from '~~/shared/utils/auth'
import { useCategories } from '~/composables/useCategories'
import { useCartStore } from '~/features/cart/stores/cart'
import { useWishlistStore } from '~/features/wishlist/stores/wishlist'
import { useNotificationStore } from '~/features/notifications/stores/notifications'
import NotificationBell from '~/components/notifications/NotificationBell.vue'
import NavbarSearchBar from '~/components/navbar/NavbarSearchBar.vue'
import NavbarUserMenu from '~/components/navbar/NavbarUserMenu.vue'
import NavbarMobileDrawer from '~/components/navbar/NavbarMobileDrawer.vue'
import AppLogo from './AppLogo.vue'

const { user, profile, isAdmin, isLoggedIn, fetchProfile, signOut } = useAuth()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const notificationStore = useNotificationStore()
const {
  categories: dynamicCategories,
  categoryMap: dynamicCategoryMap,
  fetchCategories,
} = useCategories()
const router = useRouter()

const isMobileMenuOpen = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('Semua Kategori')

const dropdownCategories = computed(() => [
  'Semua Kategori',
  ...dynamicCategories.value.map((c) => c.name),
])

const subNavCategories = computed(() => [
  { name: 'Semua Produk', path: '/katalog' },
  ...dynamicCategories.value.map((c) => ({
    name: c.name,
    path: `/katalog?category=${c.slug}`,
  })),
])

const displayName = computed(
  () => profile.value?.full_name || user.value?.email?.split('@')[0] || 'Pengguna',
)
const initial = computed(() => displayName.value.charAt(0).toUpperCase() || '?')

const handleSearch = () => {
  const q = searchQuery.value.trim()
  router.push(q ? { path: '/katalog', query: { q } } : '/katalog')
  isMobileMenuOpen.value = false
}

const selectCategory = (cat: string) => {
  selectedCategory.value = cat
  const catSlug = dynamicCategoryMap.value[cat]
  router.push(catSlug ? { path: '/katalog', query: { category: catSlug } } : '/katalog')
}

onMounted(() => {
  fetchProfile().catch(() => {})
  fetchCategories().catch(() => {})
})

onBeforeUnmount(() => {
  notificationStore.cleanupRealtimeListener()
})

watch(
  () => extractAuthUserId(user.value),
  (userId) => {
    if (userId) {
      notificationStore.fetchNotifications(true)
      notificationStore.setupRealtimeListener(userId)
    } else {
      notificationStore.cleanupRealtimeListener()
    }
  },
  { immediate: true },
)

const handleLogout = async () => {
  isMobileMenuOpen.value = false
  notificationStore.cleanupRealtimeListener()
  await signOut()
  router.push('/')
}
</script>

<template>
  <header class="w-full bg-white sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.05)] select-none">
    <!-- LAYER 1: Top Announcement Bar (Inverted Ink Strip) -->
    <div class="bg-brand-ink text-white py-1.5 border-b border-white/10 hidden sm:block">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2.5">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" aria-hidden="true" />
          <p class="tracking-wide m-0 text-[11px] sm:text-xs flex items-center gap-2.5">
            <span>Gratis Ongkir min. belanja Rp500.000</span>
            <span class="h-3 w-px bg-white/20" aria-hidden="true" />
            <span>Garansi Pengembalian 30 Hari</span>
            <span class="h-3 w-px bg-white/20" aria-hidden="true" />
            <span>Koleksi Produk Original</span>
          </p>
        </div>
        <div class="hidden sm:flex items-center gap-4 text-white/70 text-[11px]">
          <NuxtLink to="/help" class="hover:text-white transition-colors no-underline">
            Pusat Bantuan
          </NuxtLink>
          <NuxtLink to="/tracking" class="hover:text-white transition-colors no-underline">
            Lacak Pesanan
          </NuxtLink>
          <span class="text-white/40">IDR (Rp)</span>
        </div>
      </div>
    </div>

    <!-- LAYER 2: Main E-Commerce Header Bar -->
    <div class="w-full bg-white border-b border-brand-hair">
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between gap-4 sm:gap-6"
      >
        <!-- Brand Logo -->
        <NuxtLink
          to="/"
          class="flex items-center no-underline group shrink-0"
          aria-label="ShelfStack beranda"
        >
          <AppLogo size="md" />
        </NuxtLink>

        <!-- Center Search Bar -->
        <NavbarSearchBar
          v-model:search-query="searchQuery"
          :selected-category="selectedCategory"
          :dropdown-categories="dropdownCategories"
          @search="handleSearch"
          @select-category="selectCategory"
        />

        <!-- Right Commerce Actions -->
        <div class="flex items-center gap-1 sm:gap-2 shrink-0">
          <!-- Notification Bell -->
          <template v-if="isLoggedIn && user">
            <NotificationBell variant="light" />
          </template>

          <!-- Wishlist Icon Button -->
          <UiTooltip text="Wishlist" position="bottom" align="center">
            <NuxtLink
              to="/wishlist"
              class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-brand-ink hover:bg-brand-canvas-soft transition-colors active:scale-95 no-underline cursor-pointer"
              :aria-label="
                wishlistStore.totalItems > 0
                  ? `Wishlist (${wishlistStore.totalItems} item)`
                  : 'Wishlist'
              "
            >
              <i class="pi pi-heart text-base sm:text-lg text-brand-ink" />
              <span
                v-if="wishlistStore.totalItems > 0"
                class="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-4 h-4 sm:min-w-[17px] sm:h-[17px] px-1 rounded-full bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-2 ring-white tabular-nums shadow-xs leading-none"
                aria-hidden="true"
              >
                {{ wishlistStore.totalItems > 99 ? '99+' : wishlistStore.totalItems }}
              </span>
            </NuxtLink>
          </UiTooltip>

          <!-- Cart Icon Button -->
          <UiTooltip position="bottom" align="end">
            <button
              type="button"
              class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-brand-ink hover:bg-brand-canvas-soft transition-colors active:scale-95 cursor-pointer"
              :aria-label="
                cartStore.totalItems > 0
                  ? `Buka Keranjang Belanja (${cartStore.totalItems} item)`
                  : 'Buka Keranjang Belanja'
              "
              @click="cartStore.openDrawer"
            >
              <i class="pi pi-shopping-bag text-base sm:text-lg text-brand-ink" />
              <span
                v-if="cartStore.totalItems > 0"
                class="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-4 h-4 sm:min-w-[17px] sm:h-[17px] px-1 rounded-full bg-brand-ink text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-2 ring-white tabular-nums shadow-xs leading-none"
                aria-hidden="true"
              >
                {{ cartStore.totalItems > 99 ? '99+' : cartStore.totalItems }}
              </span>
            </button>

            <template #content>
              <div v-if="cartStore.totalItems > 0" class="space-y-1 min-w-[190px]">
                <div
                  class="flex items-center justify-between gap-3 text-[11px] font-medium text-zinc-300"
                >
                  <span>Subtotal ({{ cartStore.totalItems }} item)</span>
                </div>
                <div class="flex items-baseline justify-between gap-3">
                  <span
                    class="font-display text-sm font-bold text-white tabular-nums tracking-tight"
                  >
                    {{ cartStore.formattedTotalPrice }}
                  </span>
                  <span class="text-[10px] text-blue-400 font-semibold flex items-center gap-0.5">
                    Buka <i class="pi pi-arrow-right text-[8px]" />
                  </span>
                </div>
              </div>
              <div
                v-else
                class="text-[11px] text-zinc-300 flex items-center gap-2 py-0.5 min-w-[170px]"
              >
                <i class="pi pi-shopping-bag text-xs text-zinc-400" />
                <span>Keranjang belanja kosong</span>
              </div>
            </template>
          </UiTooltip>

          <!-- User Authentication Section -->
          <NavbarUserMenu
            :is-logged-in="isLoggedIn"
            :has-user="Boolean(user)"
            :user-email="user?.email"
            :avatar-url="profile?.avatar_url"
            :is-admin="isAdmin"
            :display-name="displayName"
            :initial="initial"
            @logout="handleLogout"
          />

          <!-- Mobile Hamburger Trigger -->
          <button
            type="button"
            class="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-brand-canvas-soft text-brand-ink transition-colors cursor-pointer active:scale-95"
            aria-label="Buka menu navigasi"
            :aria-expanded="isMobileMenuOpen"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <i
              :class="isMobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'"
              class="text-base text-brand-ink"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- LAYER 3: Sub-Navigation Category Ribbon Bar -->
    <div
      class="w-full bg-brand-canvas-soft border-b border-brand-hairsoft py-2 overflow-x-auto [scrollbar-width:none]"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <nav
          class="flex items-center gap-1 sm:gap-2 whitespace-nowrap text-xs font-medium"
          aria-label="Kategori Utama"
        >
          <NuxtLink
            v-for="cat in subNavCategories"
            :key="cat.name"
            :to="cat.path"
            class="px-3 py-1 rounded-full text-brand-muted hover:text-brand-ink hover:bg-white transition-colors no-underline"
          >
            {{ cat.name }}
          </NuxtLink>

          <NuxtLink
            to="/promos"
            class="px-3 py-1 rounded-full text-brand-accent font-semibold hover:bg-white transition-colors no-underline flex items-center gap-1"
          >
            <span>Voucher &amp; Promo</span>
            <span
              class="bg-brand-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
              >%</span
            >
          </NuxtLink>
        </nav>
      </div>
    </div>

    <!-- Mobile Drawer View -->
    <NavbarMobileDrawer
      v-model:open="isMobileMenuOpen"
      v-model:search-query="searchQuery"
      :wishlist-count="wishlistStore.totalItems"
      :unread-notifications-count="notificationStore.unreadCount"
      :is-logged-in="isLoggedIn"
      :is-admin="isAdmin"
      @search="handleSearch"
      @logout="handleLogout"
    />
  </header>
</template>
