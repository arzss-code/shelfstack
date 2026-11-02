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
const newEmail = ref('')
const currentPassword = ref('')
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
  if (profile.value?.full_name) {
    fullName.value = profile.value.full_name
  } else if (user.value?.email) {
    fullName.value = user.value.email.split('@')[0] || ''
  }
})

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

  if (newPassword.value.length < 8) {
    passwordError.value = 'Kata sandi baru minimal 8 karakter.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  const ok = await updatePassword(newPassword.value, confirmPassword.value)
  if (ok) {
    passwordSuccess.value = true
    currentPassword.value = ''
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

      <!-- Bento Account Activity Metrics -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
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

        <div class="p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted m-0">
            Total Pesanan
          </p>
          <div v-if="isLoadingStats" class="mt-2">
            <UiSkeleton width="w-12" height="h-5" />
          </div>
          <p v-else class="text-xl font-display font-bold text-brand-ink m-0 mt-1 tabular-nums">
            {{ stats?.totalOrders ?? 0 }}
          </p>
        </div>

        <div class="p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted m-0">
            Pesanan Aktif
          </p>
          <div v-if="isLoadingStats" class="mt-2">
            <UiSkeleton width="w-12" height="h-5" />
          </div>
          <p v-else class="text-xl font-display font-bold text-brand-accent m-0 mt-1 tabular-nums">
            {{ stats?.activeOrders ?? 0 }}
          </p>
        </div>

        <div class="p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted m-0">
            Alamat Tersimpan
          </p>
          <div v-if="isLoadingStats" class="mt-2">
            <UiSkeleton width="w-12" height="h-5" />
          </div>
          <p v-else class="text-xl font-display font-bold text-brand-ink m-0 mt-1 tabular-nums">
            {{ stats?.totalAddresses ?? 0 }}
          </p>
        </div>
      </div>

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
              Nama ini akan ditampilkan pada profil akun dan dokumen transaksi Anda.
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

          <div class="pt-5 mt-6 border-t border-brand-hair flex justify-end">
            <UiButton
              variant="primary"
              size="sm"
              :loading="isUpdatingName"
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
              Alamat email utama digunakan untuk login dan menerima notifikasi pesanan.
            </p>

            <UiAlert v-if="emailNotice" variant="info" class="mb-4">
              {{ emailNotice }}
            </UiAlert>

            <div class="space-y-4">
              <div class="p-3 rounded-field bg-brand-canvas-soft border border-brand-hair text-xs">
                <span class="text-brand-muted block">Email Saat Ini:</span>
                <span class="font-semibold text-brand-ink font-mono">{{ user?.email }}</span>
              </div>

              <UiInput
                v-model="newEmail"
                label="Ganti dengan Email Baru"
                type="email"
                placeholder="email-baru@example.com"
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
              @click="handleUpdateEmail"
            >
              Perbarui Email
            </UiButton>
          </div>
        </div>

        <!-- Card 3: Ubah Kata Sandi (Full width on bottom) -->
        <div
          class="md:col-span-2 p-6 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper"
        >
          <div class="flex items-center gap-2 mb-1">
            <i class="pi pi-lock text-brand-muted text-sm" />
            <h3 class="text-base font-display font-bold text-brand-ink m-0">Ubah Kata Sandi</h3>
          </div>
          <p class="text-xs text-brand-muted mb-4">
            Pastikan kata sandi baru Anda minimal 8 karakter agar akun tetap terlindungi dengan
            aman.
          </p>

          <UiAlert v-if="passwordSuccess" variant="success" class="mb-4">
            Kata sandi berhasil diperbarui.
          </UiAlert>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div class="pt-5 mt-6 border-t border-brand-hair flex justify-end">
            <UiButton
              variant="primary"
              size="sm"
              :loading="isUpdatingPassword"
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
