import { tryUseNuxtApp } from '#imports'
import { computed, ref, watch } from 'vue'
import type { User } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  role: 'admin' | 'customer'
  avatar_url?: string | null
}

const SUPABASE_ERROR_ID: Array<[RegExp, string]> = [
  [/user already registered/i, 'Email sudah terdaftar. Silakan masuk.'],
  [/invalid login credentials/i, 'Email atau password salah.'],
  [/password should be at least/i, 'Password terlalu lemah (minimal 8 karakter).'],
  [/email not confirmed/i, 'Email belum dikonfirmasi. Cek inbox kamu.'],
  [/too many requests/i, 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'],
  [
    /email link is invalid or has expired/i,
    'Tautan reset password sudah tidak berlaku. Minta ulang.',
  ],
  [/user not found/i, 'Email tidak ditemukan. Periksa kembali alamat email Anda.'],
]

function toIndonesianMessage(error: { message: string }, fallback: string) {
  const found = SUPABASE_ERROR_ID.find(([re]) => re.test(error.message))
  return found ? found[1] : error.message || fallback
}

/** Session + profile + role. Satu-satunya tempat UI bertanya "siapa yang login". */
export function useAuth() {
  let supabase: ReturnType<typeof useSupabaseClient<Database>> | null = null
  let user = ref<User | null>(null)
  let profile = ref<UserProfile | null>(null)

  const nuxtApp = tryUseNuxtApp()
  if (nuxtApp) {
    try {
      supabase = useSupabaseClient<Database>()
      user = useSupabaseUser() as any
      profile = useState<UserProfile | null>('auth-profile', () => null)
    } catch {
      // Abaikan jika Supabase composables belum siap
    }
  }

  const pending = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')

  const fetchProfile = async (force = false) => {
    const userObj = user.value as unknown as {
      id?: string
      sub?: string
      user_metadata?: Record<string, unknown>
    } | null
    const rawId = userObj?.id || userObj?.sub
    const userId = typeof rawId === 'string' && rawId !== 'undefined' ? rawId : null
    if (!userId || !supabase) {
      profile.value = null
      return null
    }
    if (profile.value && !force) return profile.value

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, role, avatar_url')
        .eq('user_id', userId)
        .maybeSingle()

      if (error || !data) {
        profile.value = null
        return null
      }
      const loadedProfile = data as UserProfile

      // Sinkronisasi otomatis ke public.profiles jika profil belum memiliki avatar atau nama
      const userMeta = userObj?.user_metadata || {}
      const metaAvatar =
        (typeof userMeta.avatar_url === 'string' && userMeta.avatar_url) ||
        (typeof userMeta.picture === 'string' && userMeta.picture) ||
        null
      const metaName =
        (typeof userMeta.full_name === 'string' && userMeta.full_name) ||
        (typeof userMeta.name === 'string' && userMeta.name) ||
        null

      if ((!loadedProfile.avatar_url && metaAvatar) || (!loadedProfile.full_name && metaName)) {
        const updates: { avatar_url?: string; full_name?: string } = {}
        if (!loadedProfile.avatar_url && metaAvatar) updates.avatar_url = metaAvatar
        if (!loadedProfile.full_name && metaName) updates.full_name = metaName

        try {
          await supabase.from('profiles').update(updates).eq('user_id', userId)
          Object.assign(loadedProfile, updates)
        } catch {
          if (updates.avatar_url) loadedProfile.avatar_url = updates.avatar_url
          if (updates.full_name) loadedProfile.full_name = updates.full_name
        }
      }

      profile.value = loadedProfile
      return profile.value
    } catch {
      profile.value = null
      return null
    }
  }

  // Auto-fetch profile saat session user terhidrasi di client
  if (import.meta.client) {
    watch(
      () => {
        const u = user.value as unknown as { id?: string; sub?: string } | null
        return u?.id || u?.sub
      },
      (newId) => {
        if (newId) {
          fetchProfile()
        } else {
          profile.value = null
        }
      },
      { immediate: true },
    )
  }

  const signUp = async (fullName: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client tidak tersedia.')
    pending.value = true
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw new Error(toIndonesianMessage(error, 'Registrasi gagal.'))
      await fetchProfile(true)
    } finally {
      pending.value = false
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client tidak tersedia.')
    pending.value = true
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(toIndonesianMessage(error, 'Login gagal.'))
      await fetchProfile(true)
    } finally {
      pending.value = false
    }
  }

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase client tidak tersedia.')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw new Error(toIndonesianMessage(error, 'Login Google gagal.'))
  }

  const signInWithGoogleIdToken = async (idToken: string, nonce?: string) => {
    if (!supabase) throw new Error('Supabase client tidak tersedia.')
    pending.value = true
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce,
      })
      if (error) throw new Error(toIndonesianMessage(error, 'Login Google gagal.'))
      await fetchProfile(true)
    } finally {
      pending.value = false
    }
  }

  const signOut = async () => {
    if (!supabase) return
    if (import.meta.client) {
      try {
        localStorage.removeItem('shelfstack-wishlist')
        localStorage.removeItem('shelfstack-wishlist-is-guest')
        localStorage.removeItem('shelfstack-cart')
        localStorage.removeItem('shelfstack-applied-coupon')
      } catch {
        // Storage error ignored
      }
    }
    await supabase.auth.signOut()
    profile.value = null
    await navigateTo('/')
  }

  /**
   * Mengirim email tautan reset password ke alamat yang diberikan.
   * Supabase akan mengirim tautan ke `redirectTo`, di mana user dapat mengatur password baru.
   */
  const sendPasswordResetEmail = async (email: string) => {
    if (!supabase) throw new Error('Supabase client tidak tersedia.')
    pending.value = true
    try {
      const redirectTo = `${window.location.origin}/auth/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw new Error(toIndonesianMessage(error, 'Gagal mengirim email reset password.'))
    } finally {
      pending.value = false
    }
  }

  /**
   * Mengupdate password user yang sudah login melalui tautan reset.
   * Harus dipanggil di halaman `/auth/reset-password` setelah Supabase menginisiasi sesi dari magic link.
   */
  const updatePassword = async (newPassword: string) => {
    if (!supabase) throw new Error('Supabase client tidak tersedia.')
    pending.value = true
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(toIndonesianMessage(error, 'Gagal memperbarui password.'))
    } finally {
      pending.value = false
    }
  }

  return {
    user,
    profile,
    pending,
    isLoggedIn,
    isAdmin,
    fetchProfile,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithGoogleIdToken,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
  }
}
