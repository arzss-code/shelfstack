import type { Database } from '~/types/database.types'

export interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  role: 'admin' | 'customer'
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
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const profile = useState<UserProfile | null>('auth-profile', () => null)
  const pending = ref(false)

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')

  const fetchProfile = async (force = false) => {
    if (!user.value) {
      profile.value = null
      return null
    }
    if (profile.value && !force) return profile.value

    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, role')
      .eq('user_id', user.value.id)
      .single()

    if (error) {
      profile.value = null
      return null
    }
    profile.value = data as UserProfile
    return profile.value
  }

  const signUp = async (fullName: string, email: string, password: string) => {
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw new Error(toIndonesianMessage(error, 'Login Google gagal.'))
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    profile.value = null
    await navigateTo('/')
  }

  /**
   * Mengirim email tautan reset password ke alamat yang diberikan.
   * Supabase akan mengirim tautan ke `redirectTo`, di mana user dapat mengatur password baru.
   */
  const sendPasswordResetEmail = async (email: string) => {
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
    signOut,
    sendPasswordResetEmail,
    updatePassword,
  }
}
