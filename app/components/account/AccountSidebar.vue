<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useWishlistStore } from '~/features/wishlist/stores/wishlist'
import { useNotificationStore } from '~/features/notifications/stores/notifications'
import { useUiConfirm } from '~/composables/useUiConfirm'
import { useUserVouchers } from '~/composables/useUserVouchers'
import { useLoyaltyPoints } from '~/composables/useLoyaltyPoints'

const route = useRoute()
const { user, profile, signOut } = useAuth()
const wishlistStore = useWishlistStore()
const cartStore = useCartStore()
const notificationStore = useNotificationStore()
const { activeCount: activeVoucherCount } = useUserVouchers()
const { balanceCoins } = useLoyaltyPoints()
const confirm = useUiConfirm()

const displayName = computed(
  () => profile.value?.full_name || user.value?.email?.split('@')[0] || 'Pelanggan',
)
const initial = computed(() => displayName.value.charAt(0).toUpperCase())
const effectiveAvatarUrl = computed(() => {
  if (profile.value?.avatar_url) return profile.value.avatar_url
  const meta = user.value?.user_metadata as Record<string, unknown> | undefined
  if (typeof meta?.avatar_url === 'string' && meta.avatar_url) return meta.avatar_url
  if (typeof meta?.picture === 'string' && meta.picture) return meta.picture
  return null
})

interface NavItem {
  id: string
  label: string
  to: string
  icon: string
  badge?: number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups = computed<NavGroup[]>(() => [
  {
    title: 'Aktivitas Belanja',
    items: [
      { id: 'orders', label: 'Pesanan Saya', to: '/orders', icon: 'pi pi-box' },
      {
        id: 'wishlist',
        label: 'Wishlist',
        to: '/wishlist',
        icon: 'pi pi-heart',
        badge: wishlistStore.totalItems,
      },
      {
        id: 'vouchers',
        label: 'Voucher Saya',
        to: '/account/vouchers',
        icon: 'pi pi-ticket',
        badge: activeVoucherCount.value,
      },
      { id: 'points', label: 'Koin & Rewards', to: '/account/points', icon: 'pi pi-dollar' },
      {
        id: 'notifications',
        label: 'Notifikasi',
        to: '/notifications',
        icon: 'pi pi-bell',
        badge: notificationStore.unreadCount,
      },
    ],
  },
  {
    title: 'Pengaturan Akun',
    items: [
      { id: 'profile', label: 'Profil Saya', to: '/account/profile', icon: 'pi pi-user' },
      {
        id: 'addresses',
        label: 'Daftar Alamat',
        to: '/account/addresses',
        icon: 'pi pi-map-marker',
      },
    ],
  },
])

const horizontalTabs = computed<NavItem[]>(() => [
  ...(navGroups.value[1]?.items || []),
  ...(navGroups.value[0]?.items || []),
])

const isItemActive = (to: string) => {
  if (to === '/account/profile') {
    return route.path === '/account/profile' || route.path === '/account'
  }
  return route.path.startsWith(to)
}

const handleLogout = () => {
  confirm.require({
    header: 'Keluar dari Akun',
    message: 'Apakah Anda yakin ingin keluar dari akun ShelfStack Anda?',
    tone: 'danger',
    acceptLabel: 'Keluar',
    rejectLabel: 'Batal',
    accept: async () => {
      wishlistStore.resetOnLogout()
      cartStore.resetOnLogout()
      await signOut()
      await navigateTo('/')
    },
  })
}
</script>

<template>
  <aside class="w-full shrink-0 xl:w-64">
    <!-- Desktop Sidebar Card (Hanya Tampil di Layar Besar >= 1280px) -->
    <div
      class="sticky top-24 hidden rounded-card border border-brand-hair bg-brand-canvas p-5 shadow-whisper xl:block"
    >
      <!-- User Profile Lockup -->
      <div class="flex items-center gap-3 border-b border-brand-hairsoft pb-5">
        <div class="relative shrink-0">
          <div
            class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-brand-hair bg-brand-canvas-soft shadow-whisper"
          >
            <img
              v-if="effectiveAvatarUrl"
              :src="effectiveAvatarUrl"
              :alt="displayName"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-brand-ink font-display font-bold text-base text-white"
            >
              {{ initial }}
            </div>
          </div>
        </div>

        <div class="min-w-0 flex-1">
          <p class="m-0 truncate font-bold text-xs text-brand-ink">{{ displayName }}</p>
          <p class="m-0 mt-0.5 truncate text-[11px] text-brand-muted">{{ user?.email }}</p>
          <div class="mt-1 flex items-center gap-1.5">
            <span
              v-if="profile?.role === 'admin'"
              class="rounded bg-amber-100 px-1.5 py-0.5 font-bold text-[9px] text-amber-800 uppercase tracking-wider"
            >
              Admin
            </span>
            <span
              v-else
              class="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-semibold text-[9px] text-emerald-700"
            >
              Member Aktif
            </span>
          </div>
        </div>
      </div>

      <!-- Navigation Groups -->
      <div class="space-y-5 pt-4">
        <div v-for="group in navGroups" :key="group.title">
          <p class="mb-2 px-2 font-bold text-[10px] text-brand-muted/80 uppercase tracking-wider">
            {{ group.title }}
          </p>
          <nav class="space-y-0.5" :aria-label="group.title">
            <NuxtLink
              v-for="item in group.items"
              :key="item.id"
              :to="item.to"
              class="flex items-center justify-between rounded-field px-3 py-2 font-medium text-xs no-underline transition-all"
              :class="[
                isItemActive(item.to)
                  ? 'bg-brand-ink font-semibold text-white shadow-xs'
                  : 'text-brand-ink hover:bg-brand-canvas-soft',
              ]"
            >
              <div class="flex items-center gap-2.5">
                <i
                  :class="[
                    item.icon,
                    'text-xs',
                    isItemActive(item.to) ? 'text-white' : 'text-brand-muted',
                  ]"
                />
                <span>{{ item.label }}</span>
              </div>
              <span
                v-if="item.badge !== undefined && item.badge > 0"
                class="rounded-full px-1.5 py-0.5 font-bold text-[10px] tabular-nums"
                :class="[
                  isItemActive(item.to)
                    ? 'bg-brand-canvas text-brand-ink'
                    : 'bg-brand-ink text-white',
                ]"
              >
                {{ item.badge }}
              </span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Logout Action -->
        <div class="border-t border-brand-hairsoft pt-3">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-3 py-2 font-medium text-brand-danger text-xs transition-colors hover:bg-brand-danger-tint"
            @click="handleLogout"
          >
            <i class="pi pi-sign-out text-xs" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Responsive Horizontal Tab Ribbon (Hanya Tampil di Layar < 1280px) -->
    <div class="mb-6 block xl:hidden">
      <div
        class="mb-3 flex items-center justify-between gap-3 rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-hair bg-brand-canvas-soft"
          >
            <img
              v-if="profile?.avatar_url"
              :src="profile.avatar_url"
              :alt="displayName"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-brand-ink font-display font-bold text-sm text-white"
            >
              {{ initial }}
            </div>
          </div>
          <div class="min-w-0">
            <p class="m-0 truncate font-bold text-xs text-brand-ink">{{ displayName }}</p>
            <p class="m-0 truncate text-[10px] text-brand-muted">{{ user?.email }}</p>
          </div>
        </div>
        <NuxtLink
          to="/katalog"
          class="shrink-0 rounded-full border border-brand-hair px-3 py-1 font-semibold text-[11px] text-brand-ink no-underline transition-all hover:bg-brand-canvas-soft active:scale-95"
        >
          Belanja
        </NuxtLink>
      </div>

      <nav
        class="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-brand-hair pb-px"
        aria-label="Navigasi Menu Akun"
      >
        <NuxtLink
          v-for="tab in horizontalTabs"
          :key="tab.id"
          :to="tab.to"
          class="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 font-medium text-xs no-underline transition-all"
          :class="[
            isItemActive(tab.to)
              ? 'border-brand-ink font-semibold text-brand-ink'
              : 'border-transparent text-brand-muted hover:text-brand-ink',
          ]"
        >
          <i :class="[tab.icon, 'text-xs']" />
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.badge !== undefined && tab.badge > 0"
            class="ml-0.5 rounded-full bg-brand-ink px-1.5 py-0.2 font-bold text-[9px] text-white tabular-nums leading-none"
          >
            {{ tab.badge }}
          </span>
        </NuxtLink>
      </nav>
    </div>
  </aside>
</template>
