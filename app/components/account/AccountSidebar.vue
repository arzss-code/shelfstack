<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useWishlistStore } from '~/features/wishlist/stores/wishlist'
import { useNotificationStore } from '~/features/notifications/stores/notifications'
import { useUiConfirm } from '~/composables/useUiConfirm'

const route = useRoute()
const { user, profile, signOut } = useAuth()
const wishlistStore = useWishlistStore()
const notificationStore = useNotificationStore()
const confirm = useUiConfirm()

const displayName = computed(() => {
  return profile.value?.full_name || user.value?.email?.split('@')[0] || 'Pelanggan'
})

const initial = computed(() => {
  return displayName.value.charAt(0).toUpperCase()
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
        label: 'Daftar Keinginan',
        to: '/wishlist',
        icon: 'pi pi-heart',
        badge: wishlistStore.totalItems,
      },
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
      { id: 'profile', label: 'Biodata Diri', to: '/account/profile', icon: 'pi pi-user' },
      {
        id: 'addresses',
        label: 'Daftar Alamat',
        to: '/account/addresses',
        icon: 'pi pi-map-marker',
      },
    ],
  },
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
      await signOut()
      await navigateTo('/')
    },
  })
}
</script>

<template>
  <aside class="w-full lg:w-64 shrink-0">
    <!-- Desktop Sidebar Card -->
    <div
      class="hidden lg:block bg-brand-canvas border border-brand-hair rounded-card p-5 shadow-whisper sticky top-24"
    >
      <!-- User Profile Lockup -->
      <div class="flex items-center gap-3 pb-5 border-b border-brand-hairsoft">
        <div class="relative shrink-0">
          <div
            class="w-11 h-11 rounded-full border border-brand-hair overflow-hidden bg-brand-canvas-soft flex items-center justify-center shadow-whisper"
          >
            <img
              v-if="profile?.avatar_url"
              :src="profile.avatar_url"
              :alt="displayName"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full bg-brand-ink text-white font-display text-base font-bold flex items-center justify-center"
            >
              {{ initial }}
            </div>
          </div>
          <span
            class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
            title="Akun Terverifikasi"
          />
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-brand-ink m-0 truncate">
            {{ displayName }}
          </p>
          <p class="text-[11px] text-brand-muted m-0 truncate mt-0.5">
            {{ user?.email }}
          </p>
          <div class="mt-1 flex items-center gap-1.5">
            <span
              v-if="profile?.role === 'admin'"
              class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider"
            >
              Admin
            </span>
            <span
              v-else
              class="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              Member Aktif
            </span>
          </div>
        </div>
      </div>

      <!-- Navigation Groups -->
      <div class="pt-4 space-y-5">
        <div v-for="group in navGroups" :key="group.title">
          <p class="text-[10px] font-bold uppercase tracking-wider text-brand-muted/80 mb-2 px-2">
            {{ group.title }}
          </p>
          <nav class="space-y-0.5" :aria-label="group.title">
            <NuxtLink
              v-for="item in group.items"
              :key="item.id"
              :to="item.to"
              class="flex items-center justify-between px-3 py-2 rounded-field text-xs font-medium no-underline transition-all"
              :class="[
                isItemActive(item.to)
                  ? 'bg-brand-ink text-white font-semibold shadow-xs'
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
                class="px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums"
                :class="[
                  isItemActive(item.to) ? 'bg-white text-brand-ink' : 'bg-brand-ink text-white',
                ]"
              >
                {{ item.badge }}
              </span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Logout Action -->
        <div class="pt-3 border-t border-brand-hairsoft">
          <button
            type="button"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-field text-xs font-medium text-brand-danger hover:bg-brand-danger-tint transition-colors cursor-pointer border-0 bg-transparent"
            @click="handleLogout"
          >
            <i class="pi pi-sign-out text-xs" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation Tab Ribbon -->
    <div class="lg:hidden mb-6">
      <div
        class="bg-brand-canvas border border-brand-hair rounded-card p-4 mb-3 shadow-whisper flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-10 h-10 rounded-full border border-brand-hair overflow-hidden bg-brand-canvas-soft flex items-center justify-center shrink-0"
          >
            <img
              v-if="profile?.avatar_url"
              :src="profile.avatar_url"
              :alt="displayName"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full bg-brand-ink text-white font-display text-sm font-bold flex items-center justify-center"
            >
              {{ initial }}
            </div>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-bold text-brand-ink m-0 truncate">{{ displayName }}</p>
            <p class="text-[10px] text-brand-muted m-0 truncate">{{ user?.email }}</p>
          </div>
        </div>
        <NuxtLink
          to="/katalog"
          class="px-3 py-1 rounded-full border border-brand-hair text-[11px] font-semibold text-brand-ink hover:bg-brand-canvas-soft no-underline shrink-0"
        >
          Belanja
        </NuxtLink>
      </div>

      <nav
        class="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-brand-hair pb-px"
        aria-label="Navigasi Mobile Akun"
      >
        <NuxtLink
          to="/account/profile"
          class="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium no-underline whitespace-nowrap border-b-2 transition-all"
          :class="[
            isItemActive('/account/profile')
              ? 'border-brand-ink text-brand-ink font-semibold'
              : 'border-transparent text-brand-muted hover:text-brand-ink',
          ]"
        >
          <i class="pi pi-user text-xs" />
          <span>Biodata Diri</span>
        </NuxtLink>
        <NuxtLink
          to="/account/addresses"
          class="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium no-underline whitespace-nowrap border-b-2 transition-all"
          :class="[
            isItemActive('/account/addresses')
              ? 'border-brand-ink text-brand-ink font-semibold'
              : 'border-transparent text-brand-muted hover:text-brand-ink',
          ]"
        >
          <i class="pi pi-map-marker text-xs" />
          <span>Daftar Alamat</span>
        </NuxtLink>
        <NuxtLink
          to="/orders"
          class="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium no-underline whitespace-nowrap border-b-2 transition-all"
          :class="[
            isItemActive('/orders')
              ? 'border-brand-ink text-brand-ink font-semibold'
              : 'border-transparent text-brand-muted hover:text-brand-ink',
          ]"
        >
          <i class="pi pi-box text-xs" />
          <span>Pesanan Saya</span>
        </NuxtLink>
        <NuxtLink
          to="/wishlist"
          class="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium no-underline whitespace-nowrap border-b-2 transition-all"
          :class="[
            isItemActive('/wishlist')
              ? 'border-brand-ink text-brand-ink font-semibold'
              : 'border-transparent text-brand-muted hover:text-brand-ink',
          ]"
        >
          <i class="pi pi-heart text-xs" />
          <span>Wishlist</span>
          <span
            v-if="wishlistStore.totalItems > 0"
            class="px-1 py-0.2 rounded-full text-[9px] font-bold bg-brand-ink text-white tabular-nums"
          >
            {{ wishlistStore.totalItems }}
          </span>
        </NuxtLink>
      </nav>
    </div>
  </aside>
</template>
