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
  if (route.path.startsWith('/account/addresses')) return 'Buku Alamat'
  if (route.path.startsWith('/account/profile') || route.path === '/account') return 'Profil Akun'
  if (route.path.startsWith('/orders')) return 'Pesanan Saya'
  if (route.path.startsWith('/wishlist')) return 'Daftar Keinginan'
  return 'Akun Pelanggan'
})

const tabs = computed<NavTab[]>(() => [
  {
    id: 'profile',
    label: 'Profil Akun',
    to: '/account/profile',
    icon: 'pi pi-user',
  },
  {
    id: 'addresses',
    label: 'Buku Alamat',
    to: '/account/addresses',
    icon: 'pi pi-map-marker',
  },
  {
    id: 'orders',
    label: 'Pesanan Saya',
    to: '/orders',
    icon: 'pi pi-box',
  },
  {
    id: 'wishlist',
    label: 'Daftar Keinginan',
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
  <header class="w-full mb-8">
    <!-- Breadcrumb Micro-Navigation -->
    <nav
      class="flex items-center gap-1.5 text-[11px] text-brand-muted mb-4"
      aria-label="Breadcrumb"
    >
      <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline">
        Beranda
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-muted">Akun Saya</span>
      <span class="text-brand-faint">/</span>
      <span class="font-semibold text-brand-ink" aria-current="page">{{ currentTabLabel }}</span>
    </nav>

    <!-- User Quick Overview Banner -->
    <div
      class="bg-brand-canvas border border-brand-hair rounded-card p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-whisper"
    >
      <div class="flex items-center gap-3.5 sm:gap-4 min-w-0">
        <div class="relative shrink-0">
          <div
            class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-ink text-white font-display text-lg sm:text-xl font-bold flex items-center justify-center shadow-whisper"
          >
            {{ initial }}
          </div>
          <span
            class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
            title="Akun Terverifikasi"
            aria-label="Akun Terverifikasi"
          />
        </div>

        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-base sm:text-lg font-display font-bold text-brand-ink m-0 truncate">
              {{ displayName }}
            </h1>
            <span
              v-if="profile?.role === 'admin'"
              class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider"
            >
              Admin
            </span>
            <span
              v-else
              class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              Pelanggan Terverifikasi
            </span>
          </div>
          <p class="text-xs text-brand-muted m-0 truncate mt-0.5">
            {{ user?.email || 'Akun Aktif' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <NuxtLink
          to="/katalog"
          class="px-3.5 py-1.5 rounded-full border border-brand-hair text-xs font-semibold text-brand-ink hover:bg-brand-canvas-soft transition-colors inline-flex items-center gap-1.5 no-underline active:scale-95"
        >
          <i class="pi pi-shopping-bag text-xs" />
          <span>Mulai Belanja</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Navigation Tabs Strip with Smooth Scrolling & Touch Snapping -->
    <nav
      class="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-brand-hair pb-px"
      aria-label="Navigasi Area Akun"
    >
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.id"
        :to="tab.to"
        class="group relative flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-medium no-underline whitespace-nowrap transition-all border-b-2"
        :class="[
          isTabActive(tab.to)
            ? 'border-brand-ink text-brand-ink font-semibold'
            : 'border-transparent text-brand-muted hover:text-brand-ink hover:border-brand-hair',
        ]"
      >
        <i :class="[tab.icon, 'text-xs sm:text-sm transition-colors']" :aria-hidden="true" />
        <span>{{ tab.label }}</span>
        <span
          v-if="tab.badge !== undefined && tab.badge > 0"
          class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-ink text-white tabular-nums leading-none"
        >
          {{ tab.badge }}
        </span>
      </NuxtLink>
    </nav>
  </header>
</template>
