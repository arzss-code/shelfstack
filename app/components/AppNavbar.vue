<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'
import { extractAuthUserId } from '~~/shared/utils/auth'
import { useCategories } from '~/composables/useCategories'
import { useCartStore } from '~/features/cart/stores/cart'
import { useWishlistStore } from '~/features/wishlist/stores/wishlist'
import { useNotificationStore } from '~/features/notifications/stores/notifications'
import NotificationBell from '~/components/notifications/NotificationBell.vue'
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
const isCategoryDropdownOpen = ref(false)
const isUserMenuOpen = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('Semua Kategori')

// Daftar dropdown kategori termasuk opsi "Semua Kategori" di awal
const dropdownCategories = computed(() => [
  'Semua Kategori',
  ...dynamicCategories.value.map((c) => c.name),
])

// Sub-nav pita kategori: dibangun dinamis dari data
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
  if (searchQuery.value.trim()) {
    router.push({ path: '/katalog', query: { q: searchQuery.value.trim() } })
  } else {
    router.push('/katalog')
  }
  isMobileMenuOpen.value = false
}

const selectCategory = (cat: string) => {
  selectedCategory.value = cat
  isCategoryDropdownOpen.value = false
  const catSlug = dynamicCategoryMap.value[cat]
  if (catSlug) {
    router.push({ path: '/katalog', query: { category: catSlug } })
  } else {
    router.push('/katalog')
  }
}

const categoryDropdownRef = ref<HTMLElement | null>(null)
const userMenuRef = ref<HTMLElement | null>(null)

function handleNavClickOutside(event: MouseEvent) {
  const target = event.target as Node | null
  if (!target) return
  if (
    isCategoryDropdownOpen.value &&
    categoryDropdownRef.value &&
    !categoryDropdownRef.value.contains(target)
  ) {
    isCategoryDropdownOpen.value = false
  }
  if (isUserMenuOpen.value && userMenuRef.value && !userMenuRef.value.contains(target)) {
    isUserMenuOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('pointerdown', handleNavClickOutside, { passive: true })
  fetchProfile().catch(() => {})
  await fetchCategories().catch(() => {})

  const currentUserId = extractAuthUserId(user.value)
  if (currentUserId) {
    await notificationStore.fetchNotifications(true)
    notificationStore.setupRealtimeListener(currentUserId)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleNavClickOutside)
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
  isUserMenuOpen.value = false
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
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
          <p class="tracking-wide m-0 text-[11px] sm:text-xs">
            Gratis Ongkir min. belanja Rp500.000 · Garansi Pengembalian 30 Hari · Koleksi Produk
            Original
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
        <!-- Brand Logo (Single clean anchor) -->
        <NuxtLink
          to="/"
          class="flex items-center no-underline group shrink-0"
          aria-label="ShelfStack beranda"
        >
          <AppLogo size="md" />
        </NuxtLink>

        <!-- Center Search Bar (Contains the single unified Category Dropdown) -->
        <div class="flex-1 max-w-2xl mx-2 sm:mx-6 hidden md:block">
          <form
            class="relative flex items-center w-full h-11 bg-brand-field hover:bg-brand-canvas-soft rounded-full px-2 border border-brand-hair focus-within:border-brand-ink focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-ink/20 transition-all shadow-whisper"
            @submit.prevent="handleSearch"
          >
            <!-- Single Category Dropdown Button -->
            <div ref="categoryDropdownRef" class="relative shrink-0">
              <button
                type="button"
                class="whitespace-nowrap flex items-center gap-1.5 text-xs text-brand-ink font-semibold px-3 py-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                @click="isCategoryDropdownOpen = !isCategoryDropdownOpen"
              >
                <span>{{ selectedCategory }}</span>
                <svg
                  class="w-3 h-3 text-brand-muted shrink-0 transition-transform duration-200 origin-center"
                  :class="{ 'rotate-180': isCategoryDropdownOpen }"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <!-- Category Dropdown List -->
              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="transform scale-95 opacity-0 -translate-y-1"
                enter-to-class="transform scale-100 opacity-100 translate-y-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="transform scale-100 opacity-100 translate-y-0"
                leave-to-class="transform scale-95 opacity-0 -translate-y-1"
              >
                <div
                  v-if="isCategoryDropdownOpen"
                  class="absolute left-0 top-full mt-2 w-56 max-h-64 overflow-y-auto bg-brand-canvas border border-brand-hair rounded-card shadow-floating p-1.5 z-50"
                >
                  <button
                    v-for="cat in dropdownCategories"
                    :key="cat"
                    type="button"
                    class="w-full text-left px-3 py-2 text-xs font-medium text-brand-ink hover:bg-brand-canvas-soft rounded-field transition-colors flex items-center justify-between cursor-pointer border-0"
                    @click="selectCategory(cat)"
                  >
                    <span>{{ cat }}</span>
                    <i
                      v-if="selectedCategory === cat"
                      class="pi pi-check text-[10px] text-brand-accent font-bold"
                    />
                  </button>
                </div>
              </Transition>
            </div>

            <span class="w-px h-5 bg-brand-hair mx-1 shrink-0" />

            <input
              v-model="searchQuery"
              type="text"
              class="w-full bg-transparent px-3 text-xs sm:text-sm text-brand-ink placeholder:text-brand-faint focus:outline-none"
              placeholder="Cari produk kebutuhan kerja, rumah, audio, furnitur..."
            />

            <UiTooltip text="Cari produk" position="bottom">
              <button
                type="submit"
                class="w-8 h-8 rounded-full bg-brand-ink text-white flex items-center justify-center shrink-0 hover:bg-brand-inkhover transition-colors cursor-pointer shadow-whisper"
                aria-label="Cari produk"
              >
                <i class="pi pi-search text-xs" />
              </button>
            </UiTooltip>
          </form>
        </div>

        <!-- Right Commerce Actions -->
        <div class="flex items-center gap-1 sm:gap-2 shrink-0">
          <!-- Notification Bell in Main Header (when logged in) -->
          <template v-if="isLoggedIn && user">
            <NotificationBell variant="light" />
          </template>

          <!-- Wishlist Icon Button with UiTooltip -->
          <UiTooltip text="Wishlist" position="bottom" align="center">
            <NuxtLink
              to="/wishlist"
              class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-brand-ink hover:bg-brand-canvas-soft transition-colors active:scale-95 no-underline cursor-pointer"
              aria-label="Wishlist"
            >
              <i class="pi pi-heart text-base sm:text-lg text-brand-ink" />
              <span
                v-if="wishlistStore.totalItems > 0"
                class="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-4 h-4 sm:min-w-[17px] sm:h-[17px] px-1 rounded-full bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-2 ring-white tabular-nums shadow-xs leading-none"
              >
                {{ wishlistStore.totalItems > 99 ? '99+' : wishlistStore.totalItems }}
              </span>
            </NuxtLink>
          </UiTooltip>

          <!-- Cart Icon Button with UiTooltip -->
          <UiTooltip position="bottom" align="end">
            <button
              type="button"
              class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-brand-ink hover:bg-brand-canvas-soft transition-colors active:scale-95 cursor-pointer"
              aria-label="Buka Keranjang Belanja"
              @click="cartStore.openDrawer"
            >
              <i class="pi pi-shopping-bag text-base sm:text-lg text-brand-ink" />
              <span
                v-if="cartStore.totalItems > 0"
                class="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-4 h-4 sm:min-w-[17px] sm:h-[17px] px-1 rounded-full bg-brand-ink text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-2 ring-white tabular-nums shadow-xs leading-none"
              >
                {{ cartStore.totalItems > 99 ? '99+' : cartStore.totalItems }}
              </span>
            </button>

            <!-- Rich Popover Content Slot -->
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

          <!-- User Authentication Section (Compact Right Layout) -->
          <div ref="userMenuRef" class="relative">
            <template v-if="isLoggedIn && user">
              <button
                type="button"
                class="flex items-center gap-1.5 p-1 sm:pl-1 sm:pr-2.5 sm:py-1 rounded-full hover:bg-brand-canvas-soft transition-colors cursor-pointer border border-brand-hair active:scale-95"
                @click="isUserMenuOpen = !isUserMenuOpen"
              >
                <span
                  class="w-7 h-7 rounded-full bg-brand-ink text-white text-xs font-bold flex items-center justify-center shrink-0"
                >
                  {{ initial }}
                </span>
                <svg
                  class="w-3 h-3 text-brand-muted shrink-0 transition-transform duration-200 hidden sm:block"
                  :class="{ 'rotate-180': isUserMenuOpen }"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <!-- User Popup Menu -->
              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="transform scale-95 opacity-0 -translate-y-1"
                enter-to-class="transform scale-100 opacity-100 translate-y-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="transform scale-100 opacity-100 translate-y-0"
                leave-to-class="transform scale-95 opacity-0 -translate-y-1"
              >
                <div
                  v-if="isUserMenuOpen"
                  class="absolute right-0 top-full mt-2 w-48 bg-brand-canvas border border-brand-hair rounded-card shadow-floating p-1.5 z-50"
                >
                  <div class="px-3 py-2 border-b border-brand-hairsoft mb-1">
                    <p class="text-xs font-bold text-brand-ink m-0 truncate">{{ displayName }}</p>
                    <p class="text-[10px] text-brand-muted m-0 truncate">{{ user.email }}</p>
                  </div>
                  <NuxtLink
                    to="/orders"
                    class="block px-3 py-2 text-xs text-brand-ink hover:bg-brand-canvas-soft rounded-field no-underline font-medium transition-colors"
                    @click="isUserMenuOpen = false"
                  >
                    Pesanan Saya
                  </NuxtLink>
                  <NuxtLink
                    to="/katalog"
                    class="block px-3 py-2 text-xs text-brand-ink hover:bg-brand-canvas-soft rounded-field no-underline transition-colors"
                    @click="isUserMenuOpen = false"
                  >
                    Katalog Belanja
                  </NuxtLink>
                  <NuxtLink
                    v-if="isAdmin"
                    to="/admin/products"
                    class="block px-3 py-2 text-xs text-brand-ink hover:bg-brand-canvas-soft rounded-field no-underline font-semibold transition-colors"
                    @click="isUserMenuOpen = false"
                  >
                    Dashboard Admin
                  </NuxtLink>
                  <button
                    type="button"
                    class="w-full text-left px-3 py-2 text-xs text-brand-danger hover:bg-brand-danger-tint rounded-field cursor-pointer border-t border-brand-hairsoft mt-1 transition-colors border-0"
                    @click="handleLogout"
                  >
                    Keluar
                  </button>
                </div>
              </Transition>
            </template>

            <template v-else>
              <NuxtLink
                to="/auth/login"
                class="px-4 py-1.5 rounded-full bg-brand-ink text-white hover:bg-brand-inkhover text-xs font-semibold no-underline transition-colors shadow-whisper inline-flex items-center"
              >
                Masuk
              </NuxtLink>
            </template>
          </div>

          <!-- Mobile Hamburger Trigger -->
          <button
            type="button"
            class="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-brand-canvas-soft text-brand-ink transition-colors cursor-pointer active:scale-95"
            aria-label="Buka menu navigasi"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <i
              :class="isMobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'"
              class="text-base text-brand-ink"
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
    <div
      v-if="isMobileMenuOpen"
      class="md:hidden w-full bg-white border-b border-brand-hair px-4 py-4 space-y-4 shadow-floating animate-fadeIn"
    >
      <!-- Mobile Search Form -->
      <form
        class="flex items-center gap-2 bg-brand-field rounded-full px-3 py-1.5 border border-brand-hair"
        @submit.prevent="handleSearch"
      >
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari produk..."
          class="w-full bg-transparent text-xs text-brand-ink placeholder-brand-faint focus:outline-none"
        />
        <button
          type="submit"
          class="w-6 h-6 rounded-full bg-brand-ink text-white flex items-center justify-center shrink-0"
        >
          <i class="pi pi-search text-[10px]" />
        </button>
      </form>

      <!-- Mobile Links -->
      <nav class="flex flex-col gap-2 text-xs font-semibold" aria-label="Navigasi Mobile">
        <NuxtLink
          to="/"
          class="py-2 text-brand-ink no-underline border-b border-brand-hairsoft"
          @click="isMobileMenuOpen = false"
        >
          Beranda
        </NuxtLink>
        <NuxtLink
          to="/katalog"
          class="py-2 text-brand-ink no-underline border-b border-brand-hairsoft"
          @click="isMobileMenuOpen = false"
        >
          Katalog Lengkap
        </NuxtLink>
        <NuxtLink
          to="/promos"
          class="py-2 text-brand-accent no-underline border-b border-brand-hairsoft flex items-center justify-between font-semibold"
          @click="isMobileMenuOpen = false"
        >
          <span class="flex items-center gap-2">
            <i class="pi pi-ticket text-sm" />
            <span>Voucher &amp; Promo</span>
          </span>
          <span
            class="bg-brand-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
          >
            %
          </span>
        </NuxtLink>
        <NuxtLink
          to="/wishlist"
          class="py-2 text-brand-ink no-underline border-b border-brand-hairsoft flex items-center justify-between"
          @click="isMobileMenuOpen = false"
        >
          <span>Wishlist</span>
          <span
            v-if="wishlistStore.totalItems > 0"
            class="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold"
          >
            {{ wishlistStore.totalItems }}
          </span>
        </NuxtLink>
        <NuxtLink
          v-if="isLoggedIn"
          to="/notifications"
          class="py-2 text-brand-ink no-underline border-b border-brand-hairsoft flex items-center justify-between"
          @click="isMobileMenuOpen = false"
        >
          <span class="flex items-center gap-2">
            <i class="pi pi-bell text-sm text-brand-ink" />
            <span>Notifikasi</span>
          </span>
          <span
            v-if="notificationStore.unreadCount > 0"
            class="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold tabular-nums"
          >
            {{ notificationStore.unreadCount }}
          </span>
        </NuxtLink>
        <NuxtLink
          v-if="isLoggedIn"
          to="/orders"
          class="py-2 text-brand-ink no-underline border-b border-brand-hairsoft"
          @click="isMobileMenuOpen = false"
        >
          Pesanan Saya
        </NuxtLink>
        <NuxtLink
          to="/help"
          class="py-2 text-brand-ink no-underline border-b border-brand-hairsoft"
          @click="isMobileMenuOpen = false"
        >
          Pusat Bantuan
        </NuxtLink>
        <NuxtLink
          to="/tracking"
          class="py-2 text-brand-ink no-underline border-b border-brand-hairsoft"
          @click="isMobileMenuOpen = false"
        >
          Lacak Pesanan
        </NuxtLink>
        <NuxtLink
          to="/contact"
          class="py-2 text-brand-ink no-underline border-b border-brand-hairsoft"
          @click="isMobileMenuOpen = false"
        >
          Hubungi Kami
        </NuxtLink>
        <NuxtLink
          v-if="isAdmin"
          to="/admin/products"
          class="py-2 text-brand-ink no-underline border-b border-brand-hairsoft"
          @click="isMobileMenuOpen = false"
        >
          Kelola Produk (Admin)
        </NuxtLink>
        <button
          v-if="isLoggedIn"
          type="button"
          class="py-2 text-left text-red-600 font-semibold cursor-pointer border-b border-brand-hairsoft"
          @click="handleLogout"
        >
          Keluar
        </button>
        <NuxtLink
          v-else
          to="/auth/login"
          class="py-2 text-brand-accent no-underline font-semibold"
          @click="isMobileMenuOpen = false"
        >
          Masuk ke Akun
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
