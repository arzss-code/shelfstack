import { ref } from 'vue'
import type { Database } from '~/types/database.types'
import {
  updateProfileSchema,
  updatePasswordSchema,
  updateEmailSchema,
  type AccountStats,
} from '~~/shared/schemas/profile'
import { useAuth } from '~/features/auth/composables/useAuth'

export function useUserProfile() {
  const supabase = useSupabaseClient<Database>()
  const { user, profile, fetchProfile } = useAuth()

  const stats = ref<AccountStats | null>(null)
  const isLoadingStats = ref(false)
  const isUpdatingName = ref(false)
  const isUpdatingPassword = ref(false)
  const isUpdatingEmail = ref(false)
  const isUploadingAvatar = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  const fetchStats = async (): Promise<AccountStats | null> => {
    isLoadingStats.value = true
    error.value = null
    try {
      const response = await $fetch<{ status: string; data: AccountStats }>('/api/account/stats')
      stats.value = response.data || null
      return stats.value
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      error.value = fetchErr?.data?.message || fetchErr?.message || 'Gagal memuat statistik akun.'
      return null
    } finally {
      isLoadingStats.value = false
    }
  }

  const updateName = async (fullName: string): Promise<boolean> => {
    error.value = null
    successMessage.value = null

    const parsed = updateProfileSchema.safeParse({ full_name: fullName })
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      error.value = firstIssue?.message || 'Format nama tidak valid.'
      return false
    }

    isUpdatingName.value = true
    try {
      await $fetch('/api/account/profile', {
        method: 'PATCH',
        body: { full_name: parsed.data.full_name },
      })

      await fetchProfile(true)
      successMessage.value = 'Nama lengkap berhasil diperbarui.'
      return true
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      error.value = fetchErr?.data?.message || fetchErr?.message || 'Gagal memperbarui profil.'
      return false
    } finally {
      isUpdatingName.value = false
    }
  }

  const uploadAvatar = async (file: File): Promise<boolean> => {
    error.value = null
    successMessage.value = null

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      error.value = 'Format file tidak didukung. Harap gunakan format JPG, PNG, atau WEBP.'
      return false
    }

    const MAX_SIZE = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_SIZE) {
      error.value = 'Ukuran file terlalu besar. Maksimal ukuran file adalah 2 MB.'
      return false
    }

    const userId = user.value?.id
    if (!userId) {
      error.value = 'Sesi pengguna tidak valid. Silakan login kembali.'
      return false
    }

    isUploadingAvatar.value = true
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

      if (uploadError) {
        error.value = uploadError.message || 'Gagal mengunggah foto profil ke penyimpanan.'
        return false
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const newAvatarUrl = publicUrlData.publicUrl

      await $fetch('/api/account/profile', {
        method: 'PATCH',
        body: { avatar_url: newAvatarUrl },
      })

      const oldAvatarUrl = profile.value?.avatar_url
      if (oldAvatarUrl && oldAvatarUrl.includes('/avatars/')) {
        const oldPath = oldAvatarUrl.split('/avatars/')[1]
        if (oldPath && oldPath !== filePath) {
          await supabase.storage.from('avatars').remove([oldPath])
        }
      }

      await fetchProfile(true)
      successMessage.value = 'Foto profil berhasil diperbarui.'
      return true
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      error.value = fetchErr?.data?.message || fetchErr?.message || 'Gagal menyimpan foto profil.'
      return false
    } finally {
      isUploadingAvatar.value = false
    }
  }

  const deleteAvatar = async (): Promise<boolean> => {
    error.value = null
    successMessage.value = null

    const oldAvatarUrl = profile.value?.avatar_url
    if (!oldAvatarUrl) return true

    isUploadingAvatar.value = true
    try {
      await $fetch('/api/account/profile', {
        method: 'PATCH',
        body: { avatar_url: null },
      })

      if (oldAvatarUrl.includes('/avatars/')) {
        const oldPath = oldAvatarUrl.split('/avatars/')[1]
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath])
        }
      }

      await fetchProfile(true)
      successMessage.value = 'Foto profil berhasil dihapus.'
      return true
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      error.value = fetchErr?.data?.message || fetchErr?.message || 'Gagal menghapus foto profil.'
      return false
    } finally {
      isUploadingAvatar.value = false
    }
  }

  const updatePassword = async (password: string, confirmPassword: string): Promise<boolean> => {
    error.value = null
    successMessage.value = null

    const parsed = updatePasswordSchema.safeParse({
      password,
      confirm_password: confirmPassword,
    })
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      error.value = firstIssue?.message || 'Format kata sandi tidak valid.'
      return false
    }

    isUpdatingPassword.value = true
    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: parsed.data.password,
      })

      if (authError) {
        error.value = authError.message || 'Gagal mengubah kata sandi.'
        return false
      }

      successMessage.value = 'Kata sandi berhasil diperbarui.'
      return true
    } catch (err: unknown) {
      const e = err as Error
      error.value = e.message || 'Gagal mengubah kata sandi.'
      return false
    } finally {
      isUpdatingPassword.value = false
    }
  }

  const updateEmail = async (email: string): Promise<boolean> => {
    error.value = null
    successMessage.value = null

    const parsed = updateEmailSchema.safeParse({ email })
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      error.value = firstIssue?.message || 'Format email tidak valid.'
      return false
    }

    isUpdatingEmail.value = true
    try {
      const { error: authError } = await supabase.auth.updateUser({
        email: parsed.data.email,
      })

      if (authError) {
        error.value = authError.message || 'Gagal memperbarui alamat email.'
        return false
      }

      successMessage.value =
        'Tautan konfirmasi telah dikirim ke alamat email baru Anda. Silakan verifikasi melalui email tersebut.'
      return true
    } catch (err: unknown) {
      const e = err as Error
      error.value = e.message || 'Gagal memperbarui alamat email.'
      return false
    } finally {
      isUpdatingEmail.value = false
    }
  }

  return {
    user,
    profile,
    stats,
    isLoadingStats,
    isUpdatingName,
    isUpdatingPassword,
    isUpdatingEmail,
    isUploadingAvatar,
    error,
    successMessage,
    fetchStats,
    updateName,
    uploadAvatar,
    deleteAvatar,
    updatePassword,
    updateEmail,
  }
}
