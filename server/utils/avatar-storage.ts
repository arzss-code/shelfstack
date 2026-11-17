import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { logger } from './logger'

function getOwnedAvatarPath(
  avatarUrl: string,
  userId: string,
  publicBucketUrl: string,
): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(userId) || /[\s\\%?#]/.test(avatarUrl)) return null

  try {
    const url = new URL(avatarUrl)
    const bucket = new URL(publicBucketUrl)
    const prefix = bucket.pathname.endsWith('/') ? bucket.pathname : `${bucket.pathname}/`

    // Reject URL normalization so traversal cannot become an apparently owned path.
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.href !== avatarUrl ||
      url.origin !== bucket.origin ||
      url.username ||
      url.password ||
      !url.pathname.startsWith(prefix)
    )
      return null

    const path = url.pathname.slice(prefix.length)
    const [owner, filename, ...nested] = path.split('/')
    if (
      owner !== userId ||
      !filename ||
      nested.length ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename)
    )
      return null

    return path
  } catch {
    return null
  }
}

export async function removeOwnedAvatar(
  client: SupabaseClient<Database>,
  userId: string,
  avatarUrl: string | null | undefined,
  keepPath?: string,
): Promise<void> {
  if (!avatarUrl) return

  try {
    const bucket = client.storage.from('avatars')
    const { data } = bucket.getPublicUrl('')
    const path = getOwnedAvatarPath(avatarUrl, userId, data.publicUrl)
    if (!path || path === keepPath) return

    const { error } = await bucket.remove([path])
    if (error) throw error
  } catch {
    logger.warn('Avatar cleanup failed', { bucket: 'avatars', operation: 'remove' })
  }
}
