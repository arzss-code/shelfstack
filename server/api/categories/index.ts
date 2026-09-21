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
    image_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCmvA8rTc663X0aMY0i5AsRtnJWHHEMBE15l26ff2OBzeQ4YDMUc2bIfeMkM1wTrGpE8S1YpwKD1VFVOTPX83GWEoIoe_Wa5MeCsuOmxDtwLGsMeIlQpoOx_MrCo-cewC9QSL9DbpyFqpGe5CRkiClgbq2Ky9rCJ0x0lVhK8dgvYyfzRf9uFB-43LAqvdnR3zkN9hNg27b6fzEk8dmLSQTX2fxG3PRKyc-Ag1IX7VVNaYXvISjMYLi4',
    display_order: 1,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Rumah & Dapur',
    slug: 'home',
    description:
      'Peralatan seduh kopi manual, gelas kaca borosilikat tahan panas, dan keramik meja makan minimalis.',
    image_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDDdnlKb3T3WJuD42WKCuYWlCi4su1XSA6opLKqIdBufFf2I89pgRHDlMhA-UQF8FA_W3JOC97K0Q67vQxjw_-tNPtI8Emhlv4itv2QxeDnZLfXVHK1pvqKMf3q_32bMom_wtTevyGn9RDkAPGYTJQyVapwhGLWNqs0sM8vT8WYthdz-1U1PIzS4aiuVS1jCvjsJtrrE3FBMRl_xhjHgG0XQOOBR7eT595CX28mslcd4ewk9ikvHvjQ',
    display_order: 2,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Furnitur & Ruang Kerja',
    slug: 'furniture',
    description:
      'Kursi ergonomis, meja modular solid, dan sistem rak penyimpanan terorganisir untuk ruang kerja.',
    image_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBc4XLDPg-9mRKQs1TlWbx1Sb6XRiOWWni_U00DefHZgPir91Sh9rS7GKOm0M2z7-S_5MPydGZ4snKfV2T-45YtfmX164d7iygok6Xq5dDum6OvvemCbgkUxAQ5UejU182htov0POdSz3dv8rCbDOIL8RdpkpYwK8qlbeuhBv98GLCvxB8t7BKzw5Yw2aMy-fX1H5itwB8_gTE1ZqTCstf34P3WDCDvrtao2RT1FG0WniZroxgjAw0i',
    display_order: 3,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Pakaian & Aksesoris',
    slug: 'lifestyle',
    description:
      'Tas selempang harian, kaus katun organik combed, dan jam tangan fungsional berdaya tahan tinggi.',
    image_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAmK-nhltzS02RWfXj2Rx0Z8IvcV4TaPXHuYYeWMUhax_zC2LYbpNt--0RSd434mVakffTmk5s3va6NmCFXP32mL8xAUGwVx2oxYnYz_MI8jzlChs_vH53-QpQZQN9HgXIrNIxEUh-Gqko7SDdTs-v0pIb9qEn65QsCAFwAPLeEveKSsEmDVLW9YfSvaX7Q_HkhaHpfmUVv35TntI0JCNP3GnMk9WRyV4KVSnNZt_4xLlROZJMms7kg',
    display_order: 4,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Alat Tulis & Kerajinan',
    slug: 'stationery',
    description:
      'Pena presisi berbobot mantap, buku catatan bergaris halus, dan penggaris segitiga arsitektural.',
    image_url:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPUa0JzIOqwWaWZqIgu4I0PA1v7YbfFltproG-m3AwYxCiPhIouH_GwoAtPLqA3FnGnU-OMudyp3jajkJzdlcRAWIpVL0-paLzRvVRqx_L1jA73N31qDSXEo2y5pCl1pUeK734CTQrN5Eg_3ZGqZpnALspE46_3lMJDtkCoUBQC7202e3hqxG0XYEjKXtFPoKfZt_EtUzxp1sujWSSVRhcd1F4Kw9OTlD8ICNKKBY46ME_8Zpbu1K5',
    display_order: 5,
  },
]

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'GET') {
    return errorResponse(event, 'Method not allowed', null, 405)
  }

  try {
    const client = await serverSupabaseClient(event)
    const { data, error } = await client
      .from('categories')
      .select('id, name, slug, description, image_url, display_order')
      .order('display_order', { ascending: true })

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
