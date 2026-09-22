<script setup lang="ts">
// Landing OAuth: modul Supabase menukar `code` jadi session otomatis,
// lalu kita arahkan sesuai role.
useSeoMeta({ title: 'Menghubungkan…' })

const user = useSupabaseUser()
const { fetchProfile, isAdmin } = useAuth()

watch(
  user,
  async (u) => {
    if (!u) return
    const profile = await fetchProfile(true)
    if (!profile) return
    await navigateTo(isAdmin.value ? '/admin/activities' : '/')
  },
  { immediate: true },
)
</script>

<template>
  <div class="mx-auto flex w-full max-w-[440px] flex-col items-center gap-4 py-20 text-center">
    <ProgressSpinner style="width: 48px; height: 48px" />
    <p class="m-0 text-surface-500">Menghubungkan akun Google…</p>
  </div>
</template>
