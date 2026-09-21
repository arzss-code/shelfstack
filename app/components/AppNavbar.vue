<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'

const { user, profile, isAdmin, fetchProfile, signOut } = useAuth()

onMounted(() => {
  fetchProfile()
})

const displayName = computed(
  () => profile.value?.full_name || user.value?.email?.split('@')[0] || '',
)
const initial = computed(() => displayName.value.charAt(0).toUpperCase() || '?')

// Gaya DESIGN.md: link pasif muted, aktif = pil gelap (button-pill-tab-active).
// Warna via class brand-* (variabel, otomatis ikut mode gelap). Tanpa dark: manual.
const linkCls = (isActive: boolean) => [
  'px-4 py-2 rounded-full text-sm font-bold transition-colors no-underline',
  isActive ? 'bg-brand-ink text-brand-onink' : 'text-brand-muted hover:text-brand-body',
]
</script>

<template>
  <header
    class="sticky top-0 z-20 flex justify-center bg-brand-canvas px-4 border-b border-brand-hairsoft sm:px-8"
  >
    <div class="flex items-center justify-between w-full max-w-[1280px] h-16">
      <!-- Brand Logo -->
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 no-underline group"
        aria-label="ShelfStack beranda"
      >
        <span
          class="flex items-center justify-center w-8 h-8 rounded-full bg-brand-ink text-brand-onink transition-transform group-hover:scale-105"
        >
          <i class="pi pi-box text-base" />
        </span>
        <span class="m-0 text-[17px] font-bold tracking-tight text-brand-ink"> ShelfStack </span>
      </NuxtLink>

      <!-- Navigation Links -->
      <nav class="flex items-center gap-1 sm:gap-2" aria-label="Navigasi utama">
        <NuxtLink v-slot="{ href, navigate, isActive }" to="/" custom>
          <a :href="href || undefined" :class="linkCls(isActive)" @click="navigate"> Beranda </a>
        </NuxtLink>
        <NuxtLink v-slot="{ href, navigate, isActive }" to="/katalog" custom>
          <a :href="href || undefined" :class="linkCls(isActive)" @click="navigate"> Katalog </a>
        </NuxtLink>
        <NuxtLink v-if="isAdmin" v-slot="{ href, navigate, isActive }" to="/admin/products" custom>
          <a :href="href || undefined" :class="linkCls(isActive)" @click="navigate"> Kelola </a>
        </NuxtLink>
        <NuxtLink
          v-if="isAdmin"
          v-slot="{ href, navigate, isActive }"
          to="/admin/activities"
          custom
        >
          <a :href="href || undefined" :class="linkCls(isActive)" @click="navigate"> Admin </a>
        </NuxtLink>

        <span class="mx-1 hidden h-5 w-px bg-brand-hairsoft sm:inline-block" />

        <template v-if="user">
          <span
            class="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink text-sm font-bold text-brand-onink"
            :title="displayName"
          >
            {{ initial }}
          </span>
          <Button
            label="Keluar"
            icon="pi pi-sign-out"
            severity="secondary"
            text
            size="small"
            rounded
            @click="signOut"
          />
        </template>
        <NuxtLink
          v-else
          to="/auth/login"
          class="rounded-full bg-brand-ink px-5 py-2.5 text-sm font-bold text-brand-onink no-underline transition-colors hover:bg-brand-inkhover"
        >
          Masuk
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
