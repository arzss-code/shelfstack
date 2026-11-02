<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserProfile } from '~/composables/useUserProfile'
import { useUiToast } from '~/composables/useUiToast'
import { useUiConfirm } from '~/composables/useUiConfirm'
import UiButton from '~/components/ui/UiButton.vue'

const { user, profile, isUploadingAvatar, uploadAvatar, deleteAvatar, error } = useUserProfile()
const toast = useUiToast()
const confirm = useUiConfirm()

const fileInputRef = ref<HTMLInputElement | null>(null)

const displayName = computed(() => {
  return profile.value?.full_name || user.value?.email?.split('@')[0] || 'Pengguna'
})

const initial = computed(() => {
  return displayName.value.charAt(0).toUpperCase()
})

const avatarUrl = computed(() => {
  return profile.value?.avatar_url || null
})

const triggerFileInput = () => {
  if (isUploadingAvatar.value) return
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Reset file input value agar dapat memilih file yang sama jika diinginkan
  target.value = ''

  const success = await uploadAvatar(file)
  if (success) {
    toast.show({
      title: 'Foto Profil Diperbarui',
      message: 'Foto profil baru Anda berhasil disimpan.',
      tone: 'success',
    })
  } else {
    toast.show({
      title: 'Gagal Mengunggah Foto',
      message: error.value || 'Terjadi kesalahan saat mengunggah foto profil.',
      tone: 'error',
    })
  }
}

const handleDeleteAvatar = () => {
  confirm.require({
    header: 'Hapus Foto Profil',
    message: 'Apakah Anda yakin ingin menghapus foto profil dan kembali menggunakan inisial nama?',
    tone: 'danger',
    acceptLabel: 'Hapus Foto',
    rejectLabel: 'Batal',
    accept: async () => {
      const success = await deleteAvatar()
      if (success) {
        toast.show({
          title: 'Foto Profil Dihapus',
          message: 'Foto profil Anda berhasil dihapus.',
          tone: 'success',
        })
      } else {
        toast.show({
          title: 'Gagal Menghapus Foto',
          message: error.value || 'Terjadi kesalahan saat menghapus foto profil.',
          tone: 'error',
        })
      }
    },
  })
}
</script>

<template>
  <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper">
    <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
      <!-- Avatar Preview with Camera Overlay -->
      <div class="relative shrink-0 group">
        <div
          class="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-brand-hair overflow-hidden bg-brand-canvas-soft flex items-center justify-center shadow-whisper relative"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="displayName"
            class="w-full h-full object-cover"
          />
          <div
            v-else
            class="w-full h-full bg-brand-ink text-white font-display text-3xl font-bold flex items-center justify-center select-none"
          >
            {{ initial }}
          </div>

          <!-- Uploading Spinner Overlay -->
          <div
            v-if="isUploadingAvatar"
            class="absolute inset-0 rounded-full bg-black/75 flex items-center justify-center text-white backdrop-blur-[2px]"
          >
            <i class="pi pi-spin pi-spinner text-xl" />
          </div>

          <!-- Hover Overlay Trigger (Gradient Hitam Pudar Transparan) -->
          <button
            v-else
            type="button"
            class="absolute inset-0 rounded-full bg-gradient-to-t from-black/85 via-black/60 to-black/40 backdrop-blur-[1px] text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200 cursor-pointer border-0"
            title="Ubah Foto Profil"
            aria-label="Ubah Foto Profil"
            @click="triggerFileInput"
          >
            <i class="pi pi-camera text-2xl text-white drop-shadow-md mb-1" />
            <span class="text-xs font-bold text-white tracking-wide drop-shadow-md">Ubah Foto</span>
          </button>
        </div>
      </div>

      <!-- Action & Requirements Section -->
      <div class="flex-1 min-w-0 text-center sm:text-left space-y-3">
        <div>
          <h2 class="text-base font-display font-bold text-brand-ink m-0">Foto Profil Akun</h2>
          <p class="text-xs text-brand-muted m-0 mt-1">
            Gunakan foto terbaik Anda untuk mempermudah identifikasi pesanan dan profil anggota
            resmi ShelfStack.
          </p>
        </div>

        <!-- Hidden Native File Input -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="handleFileChange"
        />

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
          <UiButton
            variant="secondary"
            size="sm"
            icon="pi pi-upload"
            :loading="isUploadingAvatar"
            class="active:scale-95"
            @click="triggerFileInput"
          >
            Pilih Foto
          </UiButton>

          <UiButton
            v-if="avatarUrl"
            variant="ghost"
            size="sm"
            icon="pi pi-trash"
            :disabled="isUploadingAvatar"
            class="text-brand-danger hover:text-brand-danger hover:bg-brand-danger-tint active:scale-95"
            @click="handleDeleteAvatar"
          >
            Hapus Foto
          </UiButton>
        </div>

        <!-- Technical Specification Notice -->
        <p class="text-[11px] text-brand-faint m-0 leading-relaxed">
          Besar file: maks. 2 MB. Format file yang didukung: .JPEG, .PNG, .WEBP.
        </p>
      </div>
    </div>
  </div>
</template>
