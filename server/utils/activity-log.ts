import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '~/types/database.types'
import { getDeviceInfo } from './device'

export interface ActivityLogInsertInput {
  entity_type: string
  entity_id: number
  action: Database['public']['Enums']['activity_action']
  description: string
  old_data?: Json | null
  new_data?: Json | null
}

function resolvePayloadDevice(event: H3Event) {
  const info = getDeviceInfo(event)
  return {
    ip_address: info.ipAddress === 'Tidak tercatat' ? null : info.ipAddress,
    browser: info.browser === 'Tidak tercatat' ? null : info.browser,
    platform: info.platform === 'Tidak tercatat' ? null : info.platform,
  }
}

export async function insertActivityLogWithDevice(
  client: SupabaseClient<Database>,
  event: H3Event,
  entry: ActivityLogInsertInput,
): Promise<void> {
  try {
    const device = resolvePayloadDevice(event)
    await client.from('activity_logs').insert({
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      action: entry.action,
      description: entry.description,
      old_data: entry.old_data ?? null,
      new_data: entry.new_data ?? null,
      ...device,
    })
  } catch {
    // Non-blocking audit logging
  }
}

function matchesOrderId(row: { new_data?: unknown; old_data?: unknown }, orderId: string): boolean {
  const nextObj = row.new_data as { order_id?: unknown } | null | undefined
  const prevObj = row.old_data as { order_id?: unknown } | null | undefined
  return String(nextObj?.order_id || '') === orderId || String(prevObj?.order_id || '') === orderId
}

export async function enrichRecentOrderActivityDevice(
  event: H3Event,
  orderId: string,
  serviceClient?: SupabaseClient<Database>,
): Promise<void> {
  try {
    const device = resolvePayloadDevice(event)
    if (!device.ip_address && !device.browser && !device.platform) return

    const client = serviceClient ?? serverSupabaseServiceRole<Database>(event)
    const sinceIso = new Date(Date.now() - 60_000).toISOString()

    const { data: candidates, error } = await client
      .from('activity_logs')
      .select('id, new_data, old_data, ip_address')
      .in('entity_type', ['order', 'orders'])
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error || !Array.isArray(candidates)) return

    const targets = candidates.filter((row) => !row.ip_address && matchesOrderId(row, orderId))
    for (const target of targets) {
      await client.from('activity_logs').update(device).eq('id', target.id)
    }
  } catch {
    // Fail-open so order transitions and unit mocks never fail
  }
}
