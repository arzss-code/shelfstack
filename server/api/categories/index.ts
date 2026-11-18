import { serverSupabaseClient } from '#supabase/server'

export interface CategoryDto {
  id: string
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
  display_order?: number
}

export const CANONICAL_CATEGORIES: CategoryDto[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Tech & Gadget',
    slug: 'tech',
    description:
      'Audio resolusi tinggi, perangkat pintar nirkabel, keyboard mekanikal, dan adaptor daya presisi.',
    image_url: '/logo.svg',
    display_order: 1,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Rumah & Dapur',
    slug: 'home',
    description:
      'Peralatan seduh kopi manual, gelas kaca borosilikat tahan panas, dan keramik meja makan minimalis.',
    image_url: '/logo.svg',
    display_order: 2,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Furnitur & Ruang Kerja',
    slug: 'furniture',
    description:
      'Kursi ergonomis, meja modular solid, dan sistem rak penyimpanan terorganisir untuk ruang kerja.',
    image_url: '/logo.svg',
    display_order: 3,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Pakaian & Aksesoris',
    slug: 'lifestyle',
    description:
      'Tas selempang harian, kaus katun organik combed, dan jam tangan fungsional berdaya tahan tinggi.',
    image_url: '/logo.svg',
    display_order: 4,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Alat Tulis & Kerajinan',
    slug: 'stationery',
    description:
      'Pena presisi berbobot mantap, buku catatan bergaris halus, dan penggaris segitiga arsitektural.',
    image_url: '/logo.svg',
    display_order: 5,
  },
]

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'GET') {
    return errorResponse(event, 'Method not allowed', null, 405)
  }

  try {
    const client = await serverSupabaseClient(event)
    let result = await client
      .from('categories')
      .select('id, name, slug, description, image_url, display_order')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (
      result.error &&
      (result.error.code === '42703' || result.error.message?.includes('deleted_at'))
    ) {
      result = await client
        .from('categories')
        .select('id, name, slug, description, image_url, display_order')
        .order('display_order', { ascending: true })
    }

    const { data, error } = result

    if (error || !data || data.length === 0) {
      // Fallback aman jika koneksi db dev / tabel belum terisi
      return successResponse('Categories retrieved successfully (fallback)', CANONICAL_CATEGORIES)
    }

    return successResponse('Categories retrieved successfully', data)
  } catch {
    // Fallback defensif jika Supabase client gagal terinisialisasi
    return successResponse('Categories retrieved successfully (fallback)', CANONICAL_CATEGORIES)
  }
})
