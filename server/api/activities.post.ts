import { z } from 'zod'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../utils/auth'
import { errorResponse, successResponse } from '../utils/response'

const activityLogSchema = z.object({
  entity_type: z.string().min(1).max(50),
  entity_id: z.coerce.number().optional().nullable(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'RESTORE']),
  description: z.string().min(1).max(500),
  old_data: z.any().optional().nullable(),
  new_data: z.any().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  // 1. Enforce admin authentication (audit logs are administrative only)
  await requireAdmin(event)

  // 2. Validate input schema
  const body = await readBody(event)
  const parseResult = activityLogSchema.safeParse(body)
  if (!parseResult.success) {
    return errorResponse(event, 'Payload aktivitas tidak valid', parseResult.error.format(), 400)
  }

  const validData = parseResult.data
  const deviceInfo = getDeviceInfo(event)
  const client = await serverSupabaseClient<Database>(event)

  const { data, error } = await client
    .from('activity_logs')
    .insert({
      entity_type: validData.entity_type,
      entity_id: validData.entity_id ?? null,
      action: validData.action,
      description: validData.description,
      old_data: validData.old_data || null,
      new_data: validData.new_data || null,
      ip_address: deviceInfo.ipAddress,
      browser: deviceInfo.browser,
      platform: deviceInfo.platform,
    })
    .select()
    .single()

  if (error) {
    return errorResponse(event, 'Gagal mencatat log aktivitas', null, 500)
  }

  return successResponse('Aktivitas berhasil dicatat', data)
})
