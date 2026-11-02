<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserProfile } from '~/composables/useUserProfile'
import { useUiToast } from '~/composables/useUiToast'
import AccountSidebar from '~/components/account/AccountSidebar.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import UiSkeleton from '~/components/ui/UiSkeleton.vue'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Biodata Diri - ShelfStack',
  description: 'Kelola informasi profil, kata sandi, dan kredensial akun ShelfStack Anda.',
})

const {
  user,
  profile,
  stats,
  isLoadingStats,
  isUpdatingName,
  isUpdatingPassword,
  isUpdatingEmail,
  fetchStats,
  updateName,
  updatePassword,
  updateEmail,
} = useUserProfile()

const toast = useUiToast()

// Forms state
const fullName = ref('')
const initialFullName = ref('')
const newEmail = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const nameSuccess = ref(false)
const emailNotice = ref('')
const passwordSuccess = ref(false)

const nameError = ref('')
const emailError = ref('')
const passwordError = ref('')

onMounted(async () => {
  await fetchStats()
  const currentName = profile.value?.full_name || user.value?.email?.split('@')[0] || ''
  fullName.value = currentName
  initialFullName.value = currentName
})

const isNameChanged = computed(() => {
  return fullName.value.trim() !== initialFullName.value.trim() && fullName.value.trim().length >= 3
})

const isPasswordLengthValid = computed(() => newPassword.value.length >= 8)
const isPasswordMatch = computed(
  () => confirmPassword.value.length > 0 && newPassword.value === confirmPassword.value,
)

const formattedMemberSince = computed(() => {
  const dateStr = stats.value?.memberSince || user.value?.created_at
  if (!dateStr) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
})

const handleUpdateName = async () => {
  nameError.value = ''
  nameSuccess.value = false

  const ok = await updateName(fullName.value)
  if (ok) {
    nameSuccess.value = true
    initialFullName.value = fullName.value.trim()
    toast.show({
      title: 'Nama Berhasil Diperbarui',
      message: 'Perubahan nama profil telah disimpan.',
      tone: 'success',
    })
  } else {
    nameError.value = 'Gagal memperbarui nama. Minimal 3 karakter.'
  }
}

const handleUpdateEmail = async () => {
  emailError.value = ''
  emailNotice.value = ''

  if (!newEmail.value) {
    emailError.value = 'Alamat email baru wajib diisi.'
    return
  }

  const ok = await updateEmail(newEmail.value)
  if (ok) {
    emailNotice.value = `Tautan konfirmasi telah dikirim ke ${newEmail.value}. Silakan periksa kotak masuk email Anda.`
    newEmail.value = ''
    toast.show({
      title: 'Konfirmasi Email Terkirim',
      message: 'Tautan verifikasi telah dikirim ke email baru Anda.',
      tone: 'info',
    })
  } else {
    emailError.value = 'Gagal memperbarui email. Pastikan format email valid.'
  }
}

const handleUpdatePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = false

  if (!isPasswordLengthValid.value) {
    passwordError.value = 'Kata sandi baru minimal 8 karakter.'
    return
  }

  if (!isPasswordMatch.value) {
    passwordError.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  const ok = await updatePassword(newPassword.value, confirmPassword.value)
  if (ok) {
    passwordSuccess.value = true
    newPassword.value = ''
    confirmPassword.value = ''
    toast.show({
      title: 'Kata Sandi Diperbarui',
      message: 'Kata sandi akun Anda berhasil diganti.',
      tone: 'success',
    })
  } else {
    passwordError.value = 'Gagal memperbarui kata sandi. Periksa kembali isian Anda.'
  }
}
</script>

<template>
  <main class="min-h-screen bg-brand-canvas-soft pb-16 pt-6">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <nav
        class="flex items-center gap-1.5 text-[11px] text-brand-muted mb-6"
        aria-label="Breadcrumb"
      >
        <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline">
          Beranda
        </NuxtLink>
        <span class="text-brand-faint">/</span>
        <span class="text-brand-muted">Akun Saya</span>
        <span class="text-brand-faint">/</span>
        <span class="font-semibold text-brand-ink" aria-current="page">Biodata Diri</span>
      </nav>

      <!-- 2-Column Tokopedia / Shopee Master Layout -->
      <div class="flex flex-col lg:flex-row gap-6 items-start">
        <!-- Left Sidebar Navigation -->
        <AccountSidebar />

        <!-- Right Main Content Panel -->
        <div class="flex-1 min-w-0 w-full space-y-6">
          <!-- Top KPI Metrics Banner -->
          <div
            class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brand-canvas border border-brand-hair rounded-card p-4 sm:p-5 shadow-whisper"
          >
            <div class="p-3 rounded-field bg-brand-canvas-soft">
              <span class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block"
                >Status Akun</span
              >
              <span class="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <i class="pi pi-shield text-[10px]" />
                <span>Terverifikasi</span>
              </span>
            </div>

            <NuxtLink
              to="/orders"
              class="p-3 rounded-field bg-brand-canvas-soft no-underline block hover:bg-brand-hairsoft transition-colors"
            >
              <span class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block"
                >Total Pesanan</span
              >
              <div v-if="isLoadingStats" class="mt-1"><UiSkeleton width="w-10" height="h-4" /></div>
              <span v-else class="text-base font-bold text-brand-ink tabular-nums">{{
                stats?.totalOrders ?? 0
              }}</span>
            </NuxtLink>

            <NuxtLink
              to="/orders"
              class="p-3 rounded-field bg-brand-canvas-soft no-underline block hover:bg-brand-hairsoft transition-colors"
            >
              <span class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block"
                >Pesanan Aktif</span
              >
              <div v-if="isLoadingStats" class="mt-1"><UiSkeleton width="w-10" height="h-4" /></div>
              <span v-else class="text-base font-bold text-brand-accent tabular-nums">{{
                stats?.activeOrders ?? 0
              }}</span>
            </NuxtLink>

            <NuxtLink
              to="/account/addresses"
              class="p-3 rounded-field bg-brand-canvas-soft no-underline block hover:bg-brand-hairsoft transition-colors"
            >
              <span class="text-[10px] font-bold uppercase tracking-wider text-brand-muted block"
                >Buku Alamat</span
              >
              <div v-if="isLoadingStats" class="mt-1"><UiSkeleton width="w-10" height="h-4" /></div>
              <span v-else class="text-base font-bold text-brand-ink tabular-nums"
                >{{ stats?.totalAddresses ?? 0 }} Alamat</span
              >
            </NuxtLink>
          </div>

          <!-- Section 1: Ubah Biodata Diri (Tokopedia pattern) -->
          <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper">
            <div class="flex items-center gap-2 mb-1">
              <i class="pi pi-user text-brand-muted text-sm" />
              <h2 class="text-base font-display font-bold text-brand-ink m-0">Ubah Biodata Diri</h2>
            </div>
            <p class="text-xs text-brand-muted mb-4">
              Kelola nama lengkap dan informasi akun untuk kebutuhan invoice transaksi resmi.
            </p>

            <UiAlert v-if="nameSuccess" variant="success" class="mb-4">
              Nama lengkap berhasil diperbarui.
            </UiAlert>

            <div class="space-y-4 max-w-lg">
              <UiInput
                v-model="fullName"
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap Anda"
                :error="nameError"
                :disabled="isUpdatingName"
              />

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-brand-muted pt-1">
                <div class="p-3 rounded-field bg-brand-canvas-soft border border-brand-hair">
                  <span class="text-[11px] text-brand-muted block font-medium">Tipe Akun</span>
                  <span class="font-bold text-brand-ink uppercase">{{
                    profile?.role || 'Customer'
                  }}</span>
                </div>
                <div class="p-3 rounded-field bg-brand-canvas-soft border border-brand-hair">
                  <span class="text-[11px] text-brand-muted block font-medium"
                    >Tanggal Bergabung</span
                  >
                  <span class="font-bold text-brand-ink">{{ formattedMemberSince }}</span>
                </div>
              </div>
            </div>

            <div class="pt-5 mt-6 border-t border-brand-hair flex items-center justify-between">
              <span
                v-if="isNameChanged"
                class="text-[11px] text-brand-accent font-semibold flex items-center gap-1"
              >
                <i class="pi pi-exclamation-circle text-[10px]" />
                <span>Perubahan belum disimpan</span>
              </span>
              <span v-else class="text-[11px] text-brand-faint">Identitas profil sesuai</span>

              <UiButton
                variant="primary"
                size="sm"
                :loading="isUpdatingName"
                :disabled="!isNameChanged || isUpdatingName"
                class="active:scale-95"
                @click="handleUpdateName"
              >
                Simpan Biodata
              </UiButton>
            </div>
          </div>

          <!-- Section 2: Kontak Pribadi & Verifikasi Email (Shopee pattern) -->
          <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper">
            <div class="flex items-center gap-2 mb-1">
              <i class="pi pi-envelope text-brand-muted text-sm" />
              <h2 class="text-base font-display font-bold text-brand-ink m-0">
                Kontak Pribadi &amp; Email
              </h2>
            </div>
            <p class="text-xs text-brand-muted mb-4">
              Alamat email utama digunakan untuk login, verifikasi keamanan, dan notifikasi
              transaksi belanja.
            </p>

            <UiAlert v-if="emailNotice" variant="info" class="mb-4">{{ emailNotice }}</UiAlert>

            <div class="space-y-4 max-w-lg">
              <div
                class="p-3.5 rounded-field bg-brand-canvas-soft border border-brand-hair flex items-center justify-between"
              >
                <div>
                  <span class="text-[11px] text-brand-muted block font-medium"
                    >Alamat Email Terdaftar:</span
                  >
                  <span class="font-bold text-brand-ink font-mono text-xs">{{ user?.email }}</span>
                </div>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1"
                >
                  <i class="pi pi-check text-[9px]" />
                  <span>Terverifikasi</span>
                </span>
              </div>

              <UiInput
                v-model="newEmail"
                label="Ganti dengan Email Baru"
                type="email"
                placeholder="email-baru@example.com"
                hint="Tautan verifikasi akan dikirimkan ke alamat email baru."
                :error="emailError"
                :disabled="isUpdatingEmail"
              />
            </div>

            <div class="pt-5 mt-6 border-t border-brand-hair flex justify-end">
              <UiButton
                variant="secondary"
                size="sm"
                :loading="isUpdatingEmail"
                :disabled="!newEmail || isUpdatingEmail"
                class="active:scale-95"
                @click="handleUpdateEmail"
              >
                Perbarui Email
              </UiButton>
            </div>
          </div>

          <!-- Section 3: Keamanan & Kata Sandi -->
          <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper">
            <div class="flex items-center gap-2 mb-1">
              <i class="pi pi-lock text-brand-muted text-sm" />
              <h2 class="text-base font-display font-bold text-brand-ink m-0">
                Keamanan &amp; Kata Sandi
              </h2>
            </div>
            <p class="text-xs text-brand-muted mb-4">
              Pastikan kata sandi Anda kuat untuk melindungi akun dan riwayat transaksi belanja
              Anda.
            </p>

            <UiAlert v-if="passwordSuccess" variant="success" class="mb-4">
              Kata sandi berhasil diperbarui.
            </UiAlert>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <UiInput
                v-model="newPassword"
                label="Kata Sandi Baru"
                type="password"
                placeholder="Minimal 8 karakter"
                show-password-toggle
                :error="passwordError"
                :disabled="isUpdatingPassword"
              />
              <UiInput
                v-model="confirmPassword"
                label="Konfirmasi Kata Sandi Baru"
                type="password"
                placeholder="Ulangi kata sandi baru"
                show-password-toggle
                :disabled="isUpdatingPassword"
              />
            </div>

            <!-- Live Checklist -->
            <div
              v-if="newPassword || confirmPassword"
              class="mt-3.5 p-3 rounded-field bg-brand-canvas-soft border border-brand-hair flex items-center gap-4 text-xs max-w-2xl"
            >
              <div
                class="flex items-center gap-1.5"
                :class="isPasswordLengthValid ? 'text-emerald-700' : 'text-brand-muted'"
              >
                <i
                  :class="
                    isPasswordLengthValid
                      ? 'pi pi-check-circle text-emerald-600'
                      : 'pi pi-circle text-brand-faint'
                  "
                  class="text-xs"
                />
                <span>Minimal 8 karakter</span>
              </div>
              <div
                class="flex items-center gap-1.5"
                :class="isPasswordMatch ? 'text-emerald-700' : 'text-brand-muted'"
              >
                <i
                  :class="
                    isPasswordMatch
                      ? 'pi pi-check-circle text-emerald-600'
                      : 'pi pi-circle text-brand-faint'
                  "
                  class="text-xs"
                />
                <span>Konfirmasi cocok</span>
              </div>
            </div>

            <div class="pt-5 mt-6 border-t border-brand-hair flex justify-end">
              <UiButton
                variant="primary"
                size="sm"
                :loading="isUpdatingPassword"
                :disabled="!isPasswordLengthValid || !isPasswordMatch || isUpdatingPassword"
                class="active:scale-95"
                @click="handleUpdatePassword"
              >
                Simpan Kata Sandi
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
