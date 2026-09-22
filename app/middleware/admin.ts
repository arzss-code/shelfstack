export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } })
  }

  const { fetchProfile, isAdmin } = useAuth()
  const profile = await fetchProfile()

  if (!profile || !isAdmin.value) {
    return navigateTo({ path: '/', query: { forbidden: '1' } })
  }
})
