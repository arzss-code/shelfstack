import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { contactStatusSchema } from '../../../../shared/schemas/contact'
import { requireAdmin } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const rawStatus = typeof query.status === 'string' ? query.status.trim() : 'all'
  const rawSearch = typeof query.q === 'string' ? query.q.trim() : ''
  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1)
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(query.limit || '20'), 10) || 20))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const client = serverSupabaseServiceRole<Database>(event)
  let dbQuery = client
    .from('contact_messages')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (rawStatus !== 'all') {
    const parsedStatus = contactStatusSchema.safeParse(rawStatus)
    if (!parsedStatus.success) {
      return errorResponse(event, 'Filter status pesan kontak tidak valid', null, 400)
    }
    dbQuery = dbQuery.eq('status', parsedStatus.data)
  }

  if (rawSearch) {
    const safeTerm = rawSearch.replace(/[,()%_\\]/g, ' ').trim()
    if (safeTerm) {
      dbQuery = dbQuery.or(
        `ticket_code.ilike.%${safeTerm}%,name.ilike.%${safeTerm}%,email.ilike.%${safeTerm}%,category.ilike.%${safeTerm}%,message.ilike.%${safeTerm}%`,
      )
    }
  }

  const { data, count, error } = await dbQuery.range(from, to)

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return successResponse('Tabel pesan kontak belum dimigrasikan pada deployment ini', {
        items: [],
        pagination: { page: 1, limit, totalCount: 0, totalPages: 1 },
      })
    }
    return errorResponse(event, 'Gagal memuat daftar pesan kontak', error.message, 500)
  }

  const totalCount = count ?? (data?.length || 0)
  return successResponse('Daftar pesan kontak berhasil dimuat', {
    items: data || [],
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  })
})
