<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserProfile } from '~/composables/useUserProfile'
import { useUiToast } from '~/composables/useUiToast'
import AccountNavTabs from '~/components/account/AccountNavTabs.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import UiSkeleton from '~/components/ui/UiSkeleton.vue'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Profil Akun - ShelfStack',
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
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <AccountNavTabs />

      <!-- Interactive Activity Metrics Bento -->
      <section
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8"
        aria-label="Ringkasan Aktivitas Akun"
      >
        <div class="p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted m-0">
            Anggota Sejak
          </p>
          <div v-if="isLoadingStats" class="mt-2">
            <UiSkeleton width="w-24" height="h-5" />
          </div>
          <p v-else class="text-sm font-bold text-brand-ink m-0 mt-1 truncate">
            {{ formattedMemberSince }}
          </p>
        </div>

        <NuxtLink
          to="/orders"
          class="group p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper hover:border-brand-ink/30 transition-all no-underline block cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted m-0">
              Total Pesanan
            </p>
            <i
              class="pi pi-arrow-up-right text-[10px] text-brand-faint group-hover:text-brand-ink transition-colors"
            />
          </div>
          <div v-if="isLoadingStats" class="mt-2">
            <UiSkeleton width="w-12" height="h-5" />
          </div>
          <p v-else class="text-xl font-display font-bold text-brand-ink m-0 mt-1 tabular-nums">
            {{ stats?.totalOrders ?? 0 }}
          </p>
        </NuxtLink>

        <NuxtLink
          to="/orders"
          class="group p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper hover:border-brand-ink/30 transition-all no-underline block cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted m-0">
              Pesanan Aktif
            </p>
            <span class="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          </div>
          <div v-if="isLoadingStats" class="mt-2">
            <UiSkeleton width="w-12" height="h-5" />
          </div>
          <p v-else class="text-xl font-display font-bold text-brand-accent m-0 mt-1 tabular-nums">
            {{ stats?.activeOrders ?? 0 }}
          </p>
        </NuxtLink>

        <NuxtLink
          to="/account/addresses"
          class="group p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper hover:border-brand-ink/30 transition-all no-underline block cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted m-0">
              Alamat Tersimpan
            </p>
            <i
              class="pi pi-arrow-up-right text-[10px] text-brand-faint group-hover:text-brand-ink transition-colors"
            />
          </div>
          <div v-if="isLoadingStats" class="mt-2">
            <UiSkeleton width="w-12" height="h-5" />
          </div>
          <p v-else class="text-xl font-display font-bold text-brand-ink m-0 mt-1 tabular-nums">
            {{ stats?.totalAddresses ?? 0 }}
          </p>
        </NuxtLink>
      </section>

      <!-- Main Profile Settings Bento Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Card 1: Nama Lengkap -->
        <div
          class="p-6 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center gap-2 mb-1">
              <i class="pi pi-user text-brand-muted text-sm" />
              <h3 class="text-base font-display font-bold text-brand-ink m-0">Nama Lengkap</h3>
            </div>
            <p class="text-xs text-brand-muted mb-4">
              Nama ini akan ditampilkan pada profil akun, dokumen transaksi, dan invoice pesanan
              Anda.
            </p>

            <UiAlert v-if="nameSuccess" variant="success" class="mb-4">
              Nama lengkap berhasil diperbarui.
            </UiAlert>

            <div class="space-y-4">
              <UiInput
                v-model="fullName"
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap Anda"
                :error="nameError"
                :disabled="isUpdatingName"
              />
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
            <span v-else class="text-[11px] text-brand-faint"> Sesuai identitas profil </span>

            <UiButton
              variant="primary"
              size="sm"
              :loading="isUpdatingName"
              :disabled="!isNameChanged || isUpdatingName"
              class="active:scale-95"
              @click="handleUpdateName"
            >
              Simpan Nama
            </UiButton>
          </div>
        </div>

        <!-- Card 2: Alamat Email -->
        <div
          class="p-6 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center gap-2 mb-1">
              <i class="pi pi-envelope text-brand-muted text-sm" />
              <h3 class="text-base font-display font-bold text-brand-ink m-0">Alamat Email</h3>
            </div>
            <p class="text-xs text-brand-muted mb-4">
              Alamat email utama digunakan untuk login dan menerima konfirmasi transaksi belanja.
            </p>

            <UiAlert v-if="emailNotice" variant="info" class="mb-4">
              {{ emailNotice }}
            </UiAlert>

            <div class="space-y-4">
              <div
                class="p-3.5 rounded-field bg-brand-canvas-soft border border-brand-hair text-xs flex items-center justify-between"
              >
                <div>
                  <span class="text-[11px] text-brand-muted block font-medium"
                    >Email Terdaftar Saat Ini:</span
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

        <!-- Card 3: Ubah Kata Sandi -->
        <div
          class="md:col-span-2 p-6 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper"
        >
          <div class="flex items-center gap-2 mb-1">
            <i class="pi pi-lock text-brand-muted text-sm" />
            <h3 class="text-base font-display font-bold text-brand-ink m-0">Ubah Kata Sandi</h3>
          </div>
          <p class="text-xs text-brand-muted mb-4">
            Gunakan kombinasi kata sandi yang aman untuk melindungi akun dan riwayat transaksi
            belanja Anda.
          </p>

          <UiAlert v-if="passwordSuccess" variant="success" class="mb-4">
            Kata sandi berhasil diperbarui.
          </UiAlert>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <UiInput
                v-model="newPassword"
                label="Kata Sandi Baru"
                type="password"
                placeholder="Minimal 8 karakter"
                show-password-toggle
                :error="passwordError"
                :disabled="isUpdatingPassword"
              />
            </div>
            <div>
              <UiInput
                v-model="confirmPassword"
                label="Konfirmasi Kata Sandi Baru"
                type="password"
                placeholder="Ulangi kata sandi baru"
                show-password-toggle
                :disabled="isUpdatingPassword"
              />
            </div>
          </div>

          <!-- Live Requirements Visual Checklist -->
          <div
            v-if="newPassword || confirmPassword"
            class="mt-3.5 p-3 rounded-field bg-brand-canvas-soft border border-brand-hair flex items-center gap-4 text-xs"
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
  </main>
</template>
