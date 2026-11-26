<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import AppLogo from '~/components/AppLogo.vue'
import AdminSidebarNav, { type AdminNavLink } from '~/components/admin/AdminSidebarNav.vue'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useAdminSupportChat } from '~/composables/useAdminSupportChat'

const { user, profile, signOut: logout } = useAuth()
const isMobileMenuOpen = ref(false)
const route = useRoute()

const { threads, fetchThreads } = useAdminSupportChat()

const unreadSupportCount = computed(() => {
  return threads.value?.reduce((acc, t) => acc + (t.unread_by_admin_count || 0), 0) ?? 0
})

const navLinks: AdminNavLink[] = [
  { to: '/admin', label: 'Dashboard', icon: 'pi-chart-bar', exact: true },
  { to: '/admin/orders', label: 'Kelola Pesanan', icon: 'pi-shopping-bag', exact: false },
  { to: '/admin/users', label: 'Pelanggan & CRM', icon: 'pi-users', exact: false },
  { to: '/admin/returns', label: 'Komplain & Retur', icon: 'pi-replay', exact: false },
  { to: '/admin/support', label: 'Bantuan & Live Chat', icon: 'pi-comments', exact: false },
  { to: '/admin/products', label: 'Kelola Produk', icon: 'pi-th-large', exact: false },
  { to: '/admin/categories', label: 'Kelola Kategori', icon: 'pi-tags', exact: false },
  { to: '/admin/reviews', label: 'Ulasan Produk', icon: 'pi-star', exact: false },
  { to: '/admin/promotions', label: 'Promo & Flash Sale', icon: 'pi-bolt', exact: false },
  { to: '/admin/coupons', label: 'Kelola Voucher', icon: 'pi-ticket', exact: false },
  { to: '/admin/activities', label: 'Activity Log', icon: 'pi-history', exact: false },
]

// Close mobile menu on route change
watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false
  },
)

onMounted(() => {
  if (user.value && threads.value.length === 0) {
    fetchThreads().catch(() => {})
  }
})
</script>

<template>
  <div
    class="flex min-h-[100dvh] bg-brand-canvas text-brand-ink selection:bg-brand-accent selection:text-white transition-colors duration-200"
  >
    <a href="#admin-main-content" class="skip-link">Lewati ke konten utama</a>

    <!-- Desktop Modernist Admin Sidebar -->
    <aside
      class="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col gap-2 overflow-hidden border-r border-brand-hair bg-brand-canvas-soft p-5 md:flex z-30"
    >
      <NuxtLink
        to="/"
        class="mb-4 flex shrink-0 items-center gap-2.5 px-2 py-2 no-underline text-brand-ink group"
      >
        <AppLogo variant="mark-only" size="md" />
        <div class="flex flex-col">
          <span class="font-display text-sm font-bold tracking-tight text-brand-ink"
            >ShelfStack</span
          >
          <span class="text-[10px] font-medium text-brand-muted uppercase tracking-wider"
            >Admin Workspace</span
          >
        </div>
      </NuxtLink>

      <div class="min-h-0 flex-1 overflow-y-auto pr-1 -mr-1">
        <AdminSidebarNav
          :links="navLinks"
          :unread-support-count="unreadSupportCount"
          nav-label="Navigasi Menu Admin Desktop"
        />
      </div>

      <div class="mt-auto shrink-0 pt-4 border-t border-brand-hairsoft flex flex-col gap-2">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-brand-muted no-underline hover:bg-brand-canvas hover:text-brand-ink transition-colors"
        >
          <i class="pi pi-arrow-left text-xs" />
          <span>Kembali ke Etalase</span>
        </NuxtLink>
        <button
          type="button"
          class="flex cursor-pointer items-center gap-2 rounded-full border-0 bg-transparent px-4 py-2 text-left text-xs font-medium text-brand-danger-text no-underline transition-colors hover:bg-brand-danger-tint"
          @click="logout"
        >
          <i class="pi pi-sign-out text-xs" />
          <span>Keluar Sesi Admin</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Slide-over Drawer -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
        @click="isMobileMenuOpen = false"
      />
    </Transition>

    <Transition
      enter-active-class="transform transition duration-300 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="isMobileMenuOpen"
        class="fixed inset-y-0 left-0 w-72 bg-brand-canvas-soft border-r border-brand-hair p-5 flex flex-col overflow-hidden z-50 md:hidden shadow-floating"
      >
        <div
          class="flex shrink-0 items-center justify-between pb-4 border-b border-brand-hairsoft mb-4"
        >
          <NuxtLink to="/" class="flex items-center gap-2.5 no-underline text-brand-ink">
            <AppLogo variant="mark-only" size="sm" />
            <span class="font-display text-sm font-bold tracking-tight text-brand-ink"
              >ShelfStack Admin</span
            >
          </NuxtLink>
          <button
            type="button"
            class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-brand-hair flex items-center justify-center text-brand-ink hover:bg-brand-canvas"
            aria-label="Tutup navigasi"
            @click="isMobileMenuOpen = false"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1 -mr-1">
          <AdminSidebarNav
            :links="navLinks"
            :unread-support-count="unreadSupportCount"
            nav-label="Navigasi Menu Admin Mobile"
            @navigate="isMobileMenuOpen = false"
          />
        </div>

        <div class="mt-auto shrink-0 pt-4 border-t border-brand-hairsoft flex flex-col gap-2">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-brand-muted no-underline hover:bg-brand-canvas hover:text-brand-ink transition-colors"
            @click="isMobileMenuOpen = false"
          >
            <i class="pi pi-arrow-left text-xs" />
            <span>Kembali ke Etalase</span>
          </NuxtLink>
          <button
            type="button"
            class="flex cursor-pointer items-center gap-2 rounded-full border-0 bg-transparent px-4 py-2 text-left text-xs font-medium text-brand-danger-text no-underline transition-colors hover:bg-brand-danger-tint"
            @click="logout"
          >
            <i class="pi pi-sign-out text-xs" />
            <span>Keluar Sesi Admin</span>
          </button>
        </div>
      </aside>
    </Transition>

    <!-- Main Admin Body with Dedicated Back-Office Header -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Dedicated Admin Header Bar (No Consumer Navbar Bleed) -->
      <header
        class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-brand-hair bg-brand-canvas/90 backdrop-blur-md px-4 sm:px-6 lg:px-8"
      >
        <div class="flex items-center gap-3">
          <!-- Mobile Hamburger Toggle -->
          <button
            type="button"
            class="relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-brand-hair text-brand-ink hover:bg-brand-canvas-soft md:hidden"
            aria-label="Buka menu navigasi admin"
            @click="isMobileMenuOpen = true"
          >
            <i class="pi pi-bars text-sm" />
            <span v-if="unreadSupportCount > 0" class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-danger opacity-75"
              />
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-danger" />
            </span>
          </button>
          <div class="flex items-center gap-2">
            <span class="font-display text-sm font-bold text-brand-ink">ShelfStack</span>
            <span class="text-xs text-brand-muted hidden sm:inline">/</span>
            <span class="text-xs font-medium text-brand-muted hidden sm:inline"
              >Back-Office Command</span
            >
          </div>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink
            to="/"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-hair text-xs font-medium text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft no-underline transition-colors"
          >
            <i class="pi pi-external-link text-[10px]" />
            <span>Lihat Etalase</span>
          </NuxtLink>

          <!-- Admin Profile Badge -->
          <div
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-canvas-soft border border-brand-hair"
          >
            <div
              class="w-6 h-6 rounded-full bg-brand-accent text-white flex items-center justify-center text-[10px] font-bold"
            >
              {{ profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A' }}
            </div>
            <span class="text-xs font-semibold text-brand-ink max-w-[120px] truncate">
              {{ profile?.full_name || user?.email || 'Admin' }}
            </span>
            <span
              class="rounded bg-brand-accent-tint px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-accent-text"
            >
              Admin
            </span>
          </div>
        </div>
      </header>

      <!-- Main Admin Content Slot -->
      <main
        id="admin-main-content"
        tabindex="-1"
        class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-12 focus:outline-none"
      >
        <slot />
      </main>

      <!-- Minimal Admin Footer -->
      <footer
        class="border-t border-brand-hairsoft py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-brand-muted"
      >
        <span
          >ShelfStack Admin Workspace &copy; {{ new Date().getFullYear() }}, Strict Operations
          Mode</span
        >
      </footer>
    </div>
  </div>
</template>
