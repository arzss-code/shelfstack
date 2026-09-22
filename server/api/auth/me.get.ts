export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)

  return successResponse('Authenticated', {
    user: { id: user.id, email: user.email },
    profile,
    isAdmin: profile.role === 'admin',
  })
})
