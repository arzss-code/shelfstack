import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { supportThreadQuerySchema } from '~~/shared/schemas/support-chat'
import { requireAdmin } from '~~/server/utils/auth'
import { errorResponse, successResponse } from '~~/server/utils/response'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const client = serverSupabaseServiceRole<Database>(event)

    const query = getQuery(event)
    const parsedQuery = supportThreadQuerySchema.safeParse(query)
    if (!parsedQuery.success) {
      return errorResponse(
        event,
        'Parameter kueri daftar thread tidak valid.',
        parsedQuery.error.flatten().fieldErrors,
        400,
      )
    }

    const { status, search, page, limit } = parsedQuery.data

    let dbQuery = client
      .from('support_threads')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    if (status && status !== 'all') {
      dbQuery = dbQuery.eq('status', status)
    }

    if (search) {
      const { data: matchedProfiles } = await client
        .from('profiles')
        .select('user_id')
        .ilike('full_name', `%${search}%`)

      const matchedUserIds = matchedProfiles?.map((p) => p.user_id) || []
      if (matchedUserIds.length > 0) {
        dbQuery = dbQuery.or(
          `customer_id.in.(${matchedUserIds.join(',')}),last_message_text.ilike.%${search}%`,
        )
      } else {
        dbQuery = dbQuery.ilike('last_message_text', `%${search}%`)
      }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const {
      data: rawThreads,
      count,
      error,
    } = await dbQuery
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(from, to)

    if (error) {
      return errorResponse(event, 'Gagal memuat daftar thread bantuan.', error.message, 500)
    }

    const threads = rawThreads || []
    const customerIds = [...new Set(threads.map((t) => t.customer_id))]

    const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>()
    const orderCountMap = new Map<string, number>()
    const emailMap = new Map<string, string>()

    if (customerIds.length > 0) {
      const { data: profilesData } = await client
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', customerIds)

      profilesData?.forEach((p) => {
        profileMap.set(p.user_id, {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
        })
      })

      const { data: ordersData } = await client
        .from('orders')
        .select('user_id')
        .in('user_id', customerIds)

      ordersData?.forEach((o) => {
        orderCountMap.set(o.user_id, (orderCountMap.get(o.user_id) || 0) + 1)
      })

      await Promise.allSettled(
        customerIds.map(async (uid) => {
          try {
            const { data: userData } = await client.auth.admin.getUserById(uid)
            if (userData?.user?.email) {
              emailMap.set(uid, userData.user.email)
            }
          } catch {
            // Abaikan kegagalan baca email di lingkungan pengujian
          }
        }),
      )
    }

    const formattedThreads = threads.map((thread) => {
      const profile = profileMap.get(thread.customer_id)
      return {
        id: thread.id,
        customer_id: thread.customer_id,
        customer_name: profile?.full_name || 'Pelanggan ShelfStack',
        customer_email: emailMap.get(thread.customer_id) || 'pelanggan@shelfstack.atsiilaarya.me',
        customer_avatar_url: profile?.avatar_url || null,
        status: thread.status,
        last_message_text: thread.last_message_text || '',
        last_message_at: thread.last_message_at || thread.created_at,
        unread_by_admin_count: thread.unread_by_admin_count || 0,
        unread_by_customer_count: thread.unread_by_customer_count || 0,
        total_orders: orderCountMap.get(thread.customer_id) || 0,
        attached_order_id: thread.attached_order_id,
        attached_product_id: thread.attached_product_id,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
      }
    })

    return successResponse('Daftar thread bantuan berhasil dimuat', {
      threads: formattedThreads,
      total: count ?? 0,
      pagination: {
        page,
        limit,
        total: count ?? 0,
      },
    })
  } catch (err: unknown) {
    const errorObj = err as { message?: string; statusCode?: number }
    return errorResponse(
      event,
      errorObj?.message || 'Terjadi kesalahan internal saat memuat daftar thread bantuan.',
      null,
      errorObj?.statusCode || 500,
    )
  }
})
