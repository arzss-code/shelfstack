export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (user.value) {
    const rawRedirect = to.query.redirect
    const target =
      typeof rawRedirect === 'string' &&
      rawRedirect.startsWith('/') &&
      !rawRedirect.startsWith('//')
        ? rawRedirect
        : '/'

    return navigateTo(target)
  }
})
