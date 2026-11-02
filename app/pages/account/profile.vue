<script setup lang="ts">
import { ref, onMounted, computed, useTemplateRef } from 'vue'
import { useUserProfile } from '~/composables/useUserProfile'
import { useUiToast } from '~/composables/useUiToast'
import AccountSidebar from '~/components/account/AccountSidebar.vue'
import ProfileAvatarCard from '~/components/account/ProfileAvatarCard.vue'
import ProfileMetricsBanner from '~/components/account/ProfileMetricsBanner.vue'
import ProfileSecurityCard from '~/components/account/ProfileSecurityCard.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiAlert from '~/components/ui/UiAlert.vue'

definePageMeta({ middleware: 'auth' })

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
const securityCardRef = useTemplateRef<InstanceType<typeof ProfileSecurityCard>>('securityCardRef')

// Forms state
const fullName = ref('')
const initialFullName = ref('')
const newEmail = ref('')

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

const handleUpdatePassword = async (newPass: string, confirmPass: string) => {
  passwordError.value = ''
  passwordSuccess.value = false

  if (newPass.length < 8) {
    passwordError.value = 'Kata sandi baru minimal 8 karakter.'
    return
  }

  if (newPass !== confirmPass) {
    passwordError.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  const ok = await updatePassword(newPass, confirmPass)
  if (ok) {
    passwordSuccess.value = true
    securityCardRef.value?.clearInputs()
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
  <div class="space-y-6 pb-16">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Biodata Diri</span>
    </nav>

    <!-- 2-Column Tokopedia / Shopee Master Layout (Sidebar on xl, Horizontal Tabs on < xl) -->
    <div class="flex flex-col xl:flex-row gap-6 items-start">
      <AccountSidebar />

      <!-- Right Main Content Panel -->
      <div class="flex-1 min-w-0 w-full space-y-6">
        <!-- Top KPI Metrics Banner -->
        <ProfileMetricsBanner :stats="stats" :loading="isLoadingStats" />

        <!-- Profile Avatar Upload Card (Tokopedia & Shopee Pattern) -->
        <ProfileAvatarCard />

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
              <div class="p-3 rounded-field bg-white border border-brand-hair">
                <span class="text-[11px] text-brand-muted block font-medium">Tipe Akun</span>
                <span class="font-bold text-brand-ink uppercase">{{
                  profile?.role || 'Customer'
                }}</span>
              </div>
              <div class="p-3 rounded-field bg-white border border-brand-hair">
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
            Alamat email utama digunakan untuk login, verifikasi keamanan, dan notifikasi transaksi
            belanja.
          </p>

          <UiAlert v-if="emailNotice" variant="info" class="mb-4">{{ emailNotice }}</UiAlert>

          <div class="space-y-4 max-w-lg">
            <div
              class="p-3.5 rounded-field bg-white border border-brand-hair flex items-center justify-between"
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

        <!-- Section 3: Keamanan & Kata Sandi (Shopee Pattern) -->
        <ProfileSecurityCard
          ref="securityCardRef"
          :loading="isUpdatingPassword"
          :error="passwordError"
          :success="passwordSuccess"
          @save="handleUpdatePassword"
        />
      </div>
    </div>
  </div>
</template>
