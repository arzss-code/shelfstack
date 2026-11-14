import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { productListQuerySchema, productSchema } from '../../../shared/schemas/product'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient<Database>(event)

  if (method === 'GET') {
    const parsedQuery = productListQuerySchema.safeParse(getQuery(event))

    if (!parsedQuery.success) {
      return errorResponse(event, 'Validation error', parsedQuery.error.flatten().fieldErrors, 400)
    }

    const {
      from,
      to,
      q,
      category,
      min_price,
      max_price,
      stock_status,
      sort,
      page,
      limit,
      min_rating,
    } = parsedQuery.data

    // Kalkulasi range pagination: prioritaskan page & limit jika disediakan
    let rangeFrom = from
    let rangeTo = to
    if (page && limit) {
      rangeFrom = (page - 1) * limit
      rangeTo = rangeFrom + limit - 1
    }

    let dbQuery = client
      .from('products')
      .select('*, categories(id, name, slug)', { count: 'exact' })
      .is('deleted_at', null)

    // 1. Text Search (Full-Text Search / Substring di name, sku, description)
    if (q && q.trim()) {
      const keyword = q.trim()
      dbQuery = dbQuery.or(
        `name.ilike.%${keyword}%,sku.ilike.%${keyword}%,description.ilike.%${keyword}%`,
      )
    }

    // 2. Filter Kategori (Mendukung UUID atau slug)
    if (category && category !== 'all') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        category,
      )
      if (isUuid) {
        dbQuery = dbQuery.eq('category_id', category)
      } else {
        const { data: catData } = await client
          .from('categories')
          .select('id')
          .eq('slug', category)
          .maybeSingle()
        if (catData) {
          dbQuery = dbQuery.eq('category_id', catData.id)
        }
      }
    }

    // 3. Filter Rentang Harga
    if (min_price !== undefined) {
      dbQuery = dbQuery.gte('price', min_price)
    }
    if (max_price !== undefined) {
      dbQuery = dbQuery.lte('price', max_price)
    }

    // 4. Filter Ketersediaan Stok
    if (stock_status === 'in_stock') {
      dbQuery = dbQuery.gt('stock', 0)
    } else if (stock_status === 'critical') {
      dbQuery = dbQuery.gt('stock', 0).lt('stock', 5)
    }

    // 5. Filter Rating Minimum Ulasan
    if (min_rating !== undefined && min_rating > 0) {
      dbQuery = dbQuery.gte('rating', min_rating)
    }

    // 6. Sorting Profesional sekelas Shopee / Tokopedia
    if (sort === 'price-low') {
      dbQuery = dbQuery.order('price', { ascending: true })
    } else if (sort === 'price-high') {
      dbQuery = dbQuery.order('price', { ascending: false })
    } else if (sort === 'name-asc') {
      dbQuery = dbQuery.order('name', { ascending: true })
    } else if (sort === 'popular') {
      dbQuery = dbQuery
        .order('sold_count', { ascending: false })
        .order('rating', { ascending: false })
    } else {
      // Default: featured produk pertama, lalu ID terbaru
      dbQuery = dbQuery.order('is_featured', { ascending: false }).order('id', { ascending: false })
    }

    // 6. Eksekusi Kueri dengan Rentang Pagination
    const { data, count, error } = await dbQuery.range(rangeFrom, rangeTo)

    if (error) {
      return errorResponse(event, 'Failed to fetch products', error, 500)
    }

    // 7. Hitung Facet Kategori Dinamis (Jumlah produk aktif per kategori)
    const { data: facetRows } = await client
      .from('products')
      .select('category_id')
      .is('deleted_at', null)

    const categoryCounts: Record<string, number> = {}
    if (facetRows) {
      for (const row of facetRows) {
        if (row.category_id) {
          categoryCounts[row.category_id] = (categoryCounts[row.category_id] || 0) + 1
        }
      }
    }

    const totalCount = count ?? (data?.length || 0)
    const currentLimit = rangeTo - rangeFrom + 1
    const currentPage = Math.floor(rangeFrom / currentLimit) + 1
    const totalPages = Math.ceil(totalCount / currentLimit) || 1

    setHeader(event, 'x-total-count', String(totalCount))

    return successResponse('Products retrieved successfully', data || [], {
      total: totalCount,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        totalCount,
        totalPages,
      },
      facets: {
        categoryCounts,
      },
    })
  }

  if (method === 'POST') {
    await requireAdmin(event)

    const body = await readBody(event)

    const parsed = productSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(event, 'Validation error', parsed.error.flatten().fieldErrors, 400)
    }

    const { data, error } = await client
      .from('products')
      .insert([parsed.data as any])
      .select()
      .single()

    if (error) {
      return errorResponse(event, 'Failed to create product', error, 500)
    }

    return successResponse('Product created successfully', data)
  }

  return errorResponse(event, 'Method not allowed', null, 405)
})
