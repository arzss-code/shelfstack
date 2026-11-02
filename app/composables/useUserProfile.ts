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

      // Sinkronkan state profile in-memory
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
    error,
    successMessage,
    fetchStats,
    updateName,
    updatePassword,
    updateEmail,
  }
}
