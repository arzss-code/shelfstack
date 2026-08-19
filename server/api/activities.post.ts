import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const deviceInfo = getDeviceInfo(event)

  const client = await serverSupabaseClient<Database>(event)

  const { data, error } = await client
    .from('activity_logs')
    .insert({
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      action: body.action,
      description: body.description,
      old_data: body.old_data || null,
      new_data: body.new_data || null,
      ip_address: deviceInfo.ipAddress,
      browser: deviceInfo.browser,
      platform: deviceInfo.platform,
    })
    .select()
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to log activity',
      data: error,
    })
  }

  return { success: true, data }
})
