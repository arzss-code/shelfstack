<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useWishlistStore } from '~/features/wishlist/stores/wishlist'

const route = useRoute()
const { user, profile } = useAuth()
const wishlistStore = useWishlistStore()

const displayName = computed(() => {
  return profile.value?.full_name || user.value?.email?.split('@')[0] || 'Pelanggan'
})

const initial = computed(() => {
  return displayName.value.charAt(0).toUpperCase()
})

interface NavTab {
  id: string
  label: string
  to: string
  icon: string
  badge?: number
}

const currentTabLabel = computed(() => {
  if (route.path.startsWith('/account/addresses')) return 'Daftar Alamat'
  if (route.path.startsWith('/account/vouchers')) return 'Voucher Saya'
  if (route.path.startsWith('/account/points')) return 'Koin & Rewards'
  if (route.path.startsWith('/account/profile') || route.path === '/account') return 'Profil Saya'
  if (route.path.startsWith('/orders')) return 'Pesanan Saya'
  if (route.path.startsWith('/wishlist')) return 'Wishlist'
  return 'Akun Pelanggan'
})

const tabs = computed<NavTab[]>(() => [
  {
    id: 'profile',
    label: 'Profil Saya',
    to: '/account/profile',
    icon: 'pi pi-user',
  },
  {
    id: 'addresses',
    label: 'Daftar Alamat',
    to: '/account/addresses',
    icon: 'pi pi-map-marker',
  },
  {
    id: 'points',
    label: 'Koin & Rewards',
    to: '/account/points',
    icon: 'pi pi-dollar',
  },
  {
    id: 'orders',
    label: 'Pesanan Saya',
    to: '/orders',
    icon: 'pi pi-box',
  },
  {
    id: 'vouchers',
    label: 'Voucher Saya',
    to: '/account/vouchers',
    icon: 'pi pi-ticket',
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    to: '/wishlist',
    icon: 'pi pi-heart',
    badge: wishlistStore.totalItems,
  },
])

const isTabActive = (tabPath: string) => {
  if (tabPath === '/account/profile') {
    return route.path === '/account/profile' || route.path === '/account'
  }
  return route.path.startsWith(tabPath)
}
</script>

<template>
  <header class="mb-8 w-full">
    <!-- Breadcrumb Micro-Navigation -->
    <nav
      class="mb-4 flex items-center gap-2 overflow-x-auto text-xs font-medium text-brand-muted"
      aria-label="Breadcrumbs"
    >
      <NuxtLink to="/" class="text-brand-muted no-underline transition-colors hover:text-brand-ink">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="font-semibold text-brand-ink">{{ currentTabLabel }}</span>
    </nav>

    <!-- User Quick Overview Banner -->
    <div
      class="mb-6 flex flex-col justify-between gap-4 rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper sm:flex-row sm:items-center sm:p-6"
    >
      <div class="flex min-w-0 items-center gap-3.5 sm:gap-4">
        <div class="relative shrink-0">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-ink font-display font-bold text-lg text-white shadow-whisper sm:h-14 sm:w-14 sm:text-xl"
          >
            {{ initial }}
          </div>
        </div>

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="m-0 truncate font-display font-bold text-base text-brand-ink sm:text-lg">
              {{ displayName }}
            </h1>
            <span
              v-if="profile?.role === 'admin'"
              class="rounded-full bg-amber-100 px-2 py-0.5 font-bold text-[10px] text-amber-800 uppercase tracking-wider"
            >
              Admin
            </span>
            <span
              v-else
              class="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-[10px] text-emerald-700"
            >
              Pelanggan Terverifikasi
            </span>
          </div>
          <p class="m-0 mt-0.5 truncate text-xs text-brand-muted">
            {{ user?.email || 'Akun Aktif' }}
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2 self-start sm:self-auto">
        <NuxtLink
          to="/katalog"
          class="inline-flex items-center gap-1.5 rounded-full border border-brand-hair px-3.5 py-1.5 text-xs font-semibold text-brand-ink no-underline transition-colors hover:bg-brand-canvas-soft active:scale-95"
        >
          <i class="pi pi-shopping-bag text-xs" />
          <span>Mulai Belanja</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Navigation Tabs Strip with Smooth Scrolling & Touch Snapping -->
    <nav
      class="no-scrollbar flex items-center gap-2 overflow-x-auto border-brand-hair border-b pb-px"
      aria-label="Navigasi Area Akun"
    >
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.id"
        :to="tab.to"
        class="group relative flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 font-medium text-xs no-underline transition-all sm:text-sm"
        :class="[
          isTabActive(tab.to)
            ? 'border-brand-ink font-semibold text-brand-ink'
            : 'border-transparent text-brand-muted hover:border-brand-hair hover:text-brand-ink',
        ]"
      >
        <i :class="[tab.icon, 'text-xs sm:text-sm transition-colors']" :aria-hidden="true" />
        <span>{{ tab.label }}</span>
        <span
          v-if="tab.badge !== undefined && tab.badge > 0"
          class="ml-1 rounded-full bg-brand-ink px-1.5 py-0.5 font-bold text-[10px] text-white tabular-nums leading-none"
        >
          {{ tab.badge }}
        </span>
      </NuxtLink>
    </nav>
  </header>
</template>
