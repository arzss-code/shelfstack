<script setup lang="ts">
defineProps<{
  open: boolean
  searchQuery: string
  wishlistCount: number
  unreadNotificationsCount: number
  isLoggedIn: boolean
  isAdmin: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:searchQuery': [value: string]
  search: []
  logout: []
}>()

function closeDrawer() {
  emit('update:open', false)
}
</script>

<template>
  <div
    v-if="open"
    class="md:hidden w-full bg-brand-canvas border-b border-brand-hair px-4 py-4 space-y-4 shadow-floating animate-fadeIn"
  >
    <!-- Mobile Search Form -->
    <search>
      <form
        class="flex items-center gap-2 bg-brand-field rounded-full pl-3.5 pr-1.5 py-1 border border-brand-hair"
        @submit.prevent="emit('search')"
      >
        <input
          :value="searchQuery"
          type="search"
          name="q"
          enterkeyhint="search"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label="Cari produk"
          placeholder="Cari produk..."
          class="w-full bg-transparent text-xs text-brand-ink placeholder-brand-faint focus:outline-none min-h-[36px]"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
        <button
          type="submit"
          aria-label="Cari produk"
          class="relative w-8 h-8 rounded-full bg-brand-ink text-brand-onink flex items-center justify-center shrink-0 before:content-[''] before:absolute before:-inset-1.5"
        >
          <i class="pi pi-search text-xs" aria-hidden="true" />
        </button>
      </form>
    </search>

    <!-- Mobile Links -->
    <nav class="flex flex-col gap-1 text-xs font-semibold" aria-label="Navigasi Mobile">
      <NuxtLink
        to="/"
        class="min-h-[44px] py-2.5 flex items-center text-brand-ink no-underline border-b border-brand-hairsoft"
        @click="closeDrawer"
      >
        Beranda
      </NuxtLink>
      <NuxtLink
        to="/katalog"
        class="min-h-[44px] py-2.5 flex items-center text-brand-ink no-underline border-b border-brand-hairsoft"
        @click="closeDrawer"
      >
        Katalog Lengkap
      </NuxtLink>
      <NuxtLink
        to="/promos"
        class="min-h-[44px] py-2.5 text-brand-accent no-underline border-b border-brand-hairsoft flex items-center justify-between font-semibold"
        @click="closeDrawer"
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
        class="min-h-[44px] py-2.5 text-brand-ink no-underline border-b border-brand-hairsoft flex items-center justify-between"
        @click="closeDrawer"
      >
        <span>Wishlist</span>
        <span
          v-if="wishlistCount > 0"
          class="px-2 py-0.5 rounded-full bg-brand-danger text-white text-[10px] font-bold"
        >
          {{ wishlistCount }}
        </span>
      </NuxtLink>
      <NuxtLink
        v-if="isLoggedIn"
        to="/notifications"
        class="min-h-[44px] py-2.5 text-brand-ink no-underline border-b border-brand-hairsoft flex items-center justify-between"
        @click="closeDrawer"
      >
        <span class="flex items-center gap-2">
          <i class="pi pi-bell text-sm text-brand-ink" />
          <span>Notifikasi</span>
        </span>
        <span
          v-if="unreadNotificationsCount > 0"
          class="px-2 py-0.5 rounded-full bg-brand-danger text-white text-[10px] font-bold tabular-nums"
        >
          {{ unreadNotificationsCount }}
        </span>
      </NuxtLink>
      <NuxtLink
        v-if="isLoggedIn"
        to="/account/profile"
        class="min-h-[44px] py-2.5 flex items-center text-brand-ink no-underline border-b border-brand-hairsoft"
        @click="closeDrawer"
      >
        Profil Saya
      </NuxtLink>
      <NuxtLink
        v-if="isLoggedIn"
        to="/account/addresses"
        class="min-h-[44px] py-2.5 flex items-center text-brand-ink no-underline border-b border-brand-hairsoft"
        @click="closeDrawer"
      >
        Daftar Alamat
      </NuxtLink>
      <NuxtLink
        v-if="isLoggedIn"
        to="/orders"
        class="min-h-[44px] py-2.5 flex items-center text-brand-ink no-underline border-b border-brand-hairsoft"
        @click="closeDrawer"
      >
        Pesanan Saya
      </NuxtLink>
      <NuxtLink
        v-if="isLoggedIn"
        to="/account/vouchers"
        class="min-h-[44px] py-2.5 flex items-center text-brand-ink no-underline border-b border-brand-hairsoft"
        @click="closeDrawer"
      >
        Voucher Saya
      </NuxtLink>
      <NuxtLink
        to="/help"
        class="min-h-[44px] py-2.5 flex items-center text-brand-ink no-underline border-b border-brand-hairsoft"
        @click="closeDrawer"
      >
        Pusat Bantuan
      </NuxtLink>
      <NuxtLink
        to="/tracking"
        class="min-h-[44px] py-2.5 flex items-center text-brand-ink no-underline border-b border-brand-hairsoft"
        @click="closeDrawer"
      >
        Lacak Pesanan
      </NuxtLink>
      <NuxtLink
        to="/contact"
        class="min-h-[44px] py-2.5 flex items-center text-brand-ink no-underline border-b border-brand-hairsoft"
        @click="closeDrawer"
      >
        Hubungi Kami
      </NuxtLink>
      <NuxtLink
        v-if="isAdmin"
        to="/admin/products"
        class="min-h-[44px] py-2.5 flex items-center text-brand-ink no-underline border-b border-brand-hairsoft"
        @click="closeDrawer"
      >
        Kelola Produk (Admin)
      </NuxtLink>
      <button
        v-if="isLoggedIn"
        type="button"
        class="min-h-[44px] py-2.5 flex items-center text-left text-brand-danger-text font-semibold cursor-pointer border-b border-brand-hairsoft"
        @click="emit('logout')"
      >
        Keluar
      </button>
      <NuxtLink
        v-else
        to="/auth/login"
        class="min-h-[44px] py-2.5 flex items-center text-brand-accent no-underline font-semibold"
        @click="closeDrawer"
      >
        Masuk ke Akun
      </NuxtLink>
    </nav>
  </div>
</template>
