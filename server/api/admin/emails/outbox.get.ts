import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'

const outboxQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['all', 'pending', 'sent', 'failed']).default('all'),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rawQuery = getQuery(event)
  const parsed = outboxQuerySchema.safeParse(rawQuery)
  if (!parsed.success) {
    return errorResponse(event, 'Parameter query outbox tidak valid', parsed.error.flatten(), 400)
  }

  const { page, limit, status } = parsed.data
  const from = (page - 1) * limit
  const to = from + limit - 1

  const client = serverSupabaseServiceRole<Database>(event)

  let dbQuery = client
    .from('email_outbox')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    dbQuery = dbQuery.eq('status', status)
  }

  const { data, count, error } = await dbQuery.range(from, to)

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return successResponse('Tabel email_outbox belum dimigrasikan pada environment ini', {
        items: [],
        pagination: { page: 1, limit, totalCount: 0, totalPages: 1 },
      })
    }
    return errorResponse(event, 'Gagal memuat antrean email outbox', error.message, 500)
  }

  const totalCount = count ?? (data?.length || 0)
  const totalPages = Math.ceil(totalCount / limit) || 1

  return successResponse('Daftar email outbox berhasil dimuat', {
    items: data || [],
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
    },
  })
})
