<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAuth } from '~/features/auth/composables/useAuth'
import UiButton from '~/components/ui/UiButton.vue'
import UiAlert from '~/components/ui/UiAlert.vue'

definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'Menghubungkan Akun - ShelfStack',
  description: 'Memverifikasi sesi autentikasi dan otorisasi akun pengguna.',
})

const route = useRoute()
const user = useSupabaseUser()
const { fetchProfile, isAdmin } = useAuth()

type AuthCallbackStatus = 'loading' | 'success' | 'error' | 'empty' | 'idle'

const status = ref<AuthCallbackStatus>('loading')
const errorMessage = ref('')
const errorDetail = ref('')

let timeoutTimer: ReturnType<typeof setTimeout> | null = null

const checkOAuthError = (): boolean => {
  const error = route.query.error as string | undefined
  const errorDescription = route.query.error_description as string | undefined

  if (!error) return false

  status.value = 'error'
  if (error === 'access_denied') {
    errorMessage.value = 'Otorisasi Google Dibatalkan'
    errorDetail.value = 'Permintaan akses Google dibatalkan. Silakan coba masuk kembali.'
    return true
  }

  errorMessage.value = 'Gagal Menghubungkan Akun'
  errorDetail.value = errorDescription || 'Terjadi kesalahan saat memproses sesi login Google.'
  return true
}

const fetchProfileWithRetry = async (maxAttempts = 3, delayMs = 300) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const profile = await fetchProfile(true)
      if (profile) return profile
    } catch {
      // Lanjut ke percobaan berikutnya
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return null
}

const resolveRedirectTarget = (): string => {
  if (isAdmin.value) return '/admin/activities'

  const rawRedirect = route.query.redirect
  if (
    typeof rawRedirect === 'string' &&
    rawRedirect.startsWith('/') &&
    !rawRedirect.startsWith('//')
  ) {
    return rawRedirect
  }

  return '/'
}

const processUserSession = async () => {
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }

  status.value = 'loading'
  await fetchProfileWithRetry(3, 300)

  status.value = 'success'
  const target = resolveRedirectTarget()
  await navigateTo(target, { replace: true })
}

onMounted(() => {
  // 1. Cek apakah ada parameter error dari provider OAuth
  const hasError = checkOAuthError()
  if (hasError) return

  // 2. Set timeout pengaman jika pertukaran kode sesi macet
  timeoutTimer = setTimeout(() => {
    if (status.value === 'loading' && !user.value) {
      status.value = 'error'
      errorMessage.value = 'Waktu Verifikasi Sesi Habis'
      errorDetail.value =
        'Server membutuhkan waktu terlalu lama untuk memverifikasi akun Anda. Silakan coba lagi.'
    }
  }, 10000)

  // 3. Jika sesi user sudah siap di awal mount
  if (user.value) {
    processUserSession()
  }
})

onUnmounted(() => {
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
})

watch(
  user,
  (currentUser) => {
    if (!currentUser || status.value === 'error') return
    processUserSession()
  },
  { immediate: true },
)
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-md mx-auto">
      <!-- 1. State Loading -->
      <div
        v-if="status === 'loading'"
        class="bg-brand-canvas-soft border border-brand-hair rounded-card p-8 text-center flex flex-col items-center gap-4 shadow-sm"
      >
        <span
          class="h-12 w-12 animate-spin rounded-full border-2 border-brand-hair border-t-brand-ink"
          role="status"
          aria-label="Memproses sesi login"
        />
        <div class="space-y-1">
          <h1 class="text-base font-semibold text-brand-ink m-0">Menghubungkan Akun Google</h1>
          <p class="text-xs text-brand-muted m-0">
            Sedang memverifikasi kredensial dan hak akses akun Anda...
          </p>
        </div>
      </div>

      <!-- 2. State Success -->
      <div
        v-else-if="status === 'success'"
        class="bg-brand-canvas-soft border border-brand-hair rounded-card p-8 text-center flex flex-col items-center gap-4 shadow-sm"
      >
        <div
          class="w-12 h-12 rounded-full bg-brand-success-tint border border-brand-success-edge flex items-center justify-center text-brand-success-text"
        >
          <i class="pi pi-check text-xl" />
        </div>
        <div class="space-y-1">
          <h1 class="text-base font-semibold text-brand-ink m-0">Berhasil Masuk</h1>
          <p class="text-xs text-brand-muted m-0">Mengarahkan ke halaman tujuan belanja Anda...</p>
        </div>
      </div>

      <!-- 3. State Error -->
      <div
        v-else-if="status === 'error'"
        class="bg-brand-canvas-soft border border-brand-hair rounded-card p-6 sm:p-8 space-y-5 shadow-sm"
      >
        <UiAlert tone="danger" :title="errorMessage || 'Autentikasi Gagal'">
          {{
            errorDetail ||
            'Terjadi kendala saat menghubungkan akun Anda. Silakan coba masuk kembali.'
          }}
        </UiAlert>

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <UiButton to="/auth/login" variant="primary" block icon="pi pi-arrow-left">
            Kembali ke Masuk
          </UiButton>
          <UiButton to="/" variant="outline" block icon="pi pi-home"> Ke Beranda </UiButton>
        </div>
      </div>

      <!-- 4. State Empty / Fallback -->
      <div
        v-else-if="status === 'empty'"
        class="bg-brand-canvas-soft border border-brand-hair rounded-card p-8 text-center space-y-4"
      >
        <p class="text-sm text-brand-muted m-0">
          Tidak ada data sesi autentikasi yang dapat diproses.
        </p>
        <UiButton to="/auth/login" variant="primary"> Halaman Masuk </UiButton>
      </div>

      <!-- 5. State Idle -->
      <div v-else class="text-center py-8 text-xs text-brand-muted">Menunggu respons...</div>
    </div>
  </div>
</template>
