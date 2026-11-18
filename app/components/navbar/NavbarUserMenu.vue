<script setup lang="ts">
defineProps<{
  isLoggedIn: boolean
  hasUser: boolean
  userEmail?: string | null
  avatarUrl?: string | null
  isAdmin: boolean
  displayName: string
  initial: string
}>()

const emit = defineEmits<{
  logout: []
}>()

const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

function handleLogoutClick() {
  isUserMenuOpen.value = false
  emit('logout')
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node | null
  if (isUserMenuOpen.value && target && userMenuRef.value && !userMenuRef.value.contains(target)) {
    isUserMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleClickOutside, { passive: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleClickOutside)
})
</script>

<template>
  <div ref="userMenuRef" class="relative">
    <template v-if="isLoggedIn && hasUser">
      <button
        type="button"
        class="flex items-center gap-1.5 h-11 min-h-[44px] pl-1.5 pr-2.5 rounded-full hover:bg-brand-canvas-soft transition-colors cursor-pointer border border-brand-hair active:scale-95"
        @click="isUserMenuOpen = !isUserMenuOpen"
      >
        <span
          class="w-8 h-8 rounded-full overflow-hidden border border-brand-hair bg-brand-ink text-brand-onink text-xs font-bold flex items-center justify-center shrink-0"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="displayName"
            class="w-full h-full object-cover"
          />
          <template v-else>
            {{ initial }}
          </template>
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
            <p class="text-[10px] text-brand-muted m-0 truncate">{{ userEmail }}</p>
          </div>
          <NuxtLink
            to="/account/profile"
            class="block px-3 py-2 text-xs text-brand-ink hover:bg-brand-canvas-soft rounded-field no-underline font-medium transition-colors"
            @click="isUserMenuOpen = false"
          >
            Profil Saya
          </NuxtLink>
          <NuxtLink
            to="/account/addresses"
            class="block px-3 py-2 text-xs text-brand-ink hover:bg-brand-canvas-soft rounded-field no-underline font-medium transition-colors"
            @click="isUserMenuOpen = false"
          >
            Daftar Alamat
          </NuxtLink>
          <NuxtLink
            to="/orders"
            class="block px-3 py-2 text-xs text-brand-ink hover:bg-brand-canvas-soft rounded-field no-underline font-medium transition-colors"
            @click="isUserMenuOpen = false"
          >
            Pesanan Saya
          </NuxtLink>
          <NuxtLink
            to="/account/vouchers"
            class="block px-3 py-2 text-xs text-brand-ink hover:bg-brand-canvas-soft rounded-field no-underline font-medium transition-colors"
            @click="isUserMenuOpen = false"
          >
            Voucher Saya
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
            @click="handleLogoutClick"
          >
            Keluar
          </button>
        </div>
      </Transition>
    </template>

    <template v-else>
      <NuxtLink
        to="/auth/login"
        class="px-4 py-1.5 min-h-[44px] rounded-full bg-brand-ink text-brand-onink hover:bg-brand-inkhover text-xs font-semibold no-underline transition-colors shadow-whisper inline-flex items-center"
      >
        Masuk
      </NuxtLink>
    </template>
  </div>
</template>
