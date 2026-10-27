import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import type { CreateNotificationInput } from '../../shared/schemas/notification'
import { createNotificationSchema } from '../../shared/schemas/notification'
import { logger } from './logger'

export async function createNotification(
  client: SupabaseClient<Database>,
  input: CreateNotificationInput,
) {
  const parsed = createNotificationSchema.safeParse(input)
  if (!parsed.success) {
    logger.warn('Invalid notification input', { errors: parsed.error.format() })
    return { data: null, error: parsed.error }
  }

  const { data, error } = await client
    .from('notifications')
    .insert({
      user_id: parsed.data.user_id,
      title: parsed.data.title,
      message: parsed.data.message,
      type: parsed.data.type,
      reference_id: parsed.data.reference_id ?? null,
      reference_url: parsed.data.reference_url ?? null,
      is_read: false,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to insert notification', { input: parsed.data }, error)
    return { data: null, error }
  }

  return { data, error: null }
}
