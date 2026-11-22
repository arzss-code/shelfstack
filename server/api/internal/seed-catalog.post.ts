import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { successResponse, errorResponse } from '../../utils/response'

interface SeedProductItem {
  categorySlug: 'tech' | 'furniture' | 'home' | 'lifestyle' | 'stationery'
  name: string
  price: number
  stock: number
  description: string
  image_url: string
  weight_grams: number
  specs: Record<string, unknown>
  rating: number
  review_count: number
  sold_count: number
  is_featured: boolean
}

const CURATED_PRODUCTS: SeedProductItem[] = [
  // Tech & Gadget
  {
    categorySlug: 'tech',
    name: 'Keyboard Mekanikal Nirkabel 75%',
    price: 1450000,
    stock: 32,
    description:
      'Keyboard mekanikal nirkabel 75% dengan sasis aluminium CNC anodized, hot-swappable switches, keycap PBT dye-sublimated, dan peredam suara gasket ganda.',
    image_url:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    weight_grams: 850,
    specs: {
      konektivitas: 'Bluetooth 5.2 / 2.4GHz / Type-C',
      layout: '75% Compact (82 Keys)',
      baterai: '4000mAh Lithium-ion',
      saklar: 'Gateron G Pro Pre-lubed',
    },
    rating: 4.95,
    review_count: 24,
    sold_count: 58,
    is_featured: true,
  },
  {
    categorySlug: 'tech',
    name: 'Tetikus Ergonomis Nirkabel Precision',
    price: 890000,
    stock: 28,
    description:
      'Mouse ergonomis presisi dengan sensor optik 26.000 DPI, roda putar logam elektromagnetik, dan daya tahan baterai hingga 70 hari.',
    image_url:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
    weight_grams: 140,
    specs: {
      sensor: 'Darkfield High Precision 26K DPI',
      baterai: 'Rechargeable 500mAh',
      konektivitas: 'Logi Bolt USB / Bluetooth LE',
    },
    rating: 4.88,
    review_count: 19,
    sold_count: 42,
    is_featured: false,
  },
  {
    categorySlug: 'tech',
    name: 'Pengisi Daya GaN 100W Multi-Port',
    price: 499000,
    stock: 50,
    description:
      'Adaptor daya cepat GaN III 100W dengan 3 port USB-C dan 1 port USB-A, mendukung pengisian daya laptop dan smartphone secara simultan.',
    image_url:
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    weight_grams: 220,
    specs: {
      daya_maksimal: '100W Power Delivery 3.0',
      port: '3x USB-C + 1x USB-A',
      teknologi: 'Gallium Nitride (GaN) Fast Charge',
    },
    rating: 4.92,
    review_count: 36,
    sold_count: 85,
    is_featured: false,
  },
  {
    categorySlug: 'tech',
    name: 'Stand Laptop Ergonomis Aluminium',
    price: 320000,
    stock: 4,
    description:
      'Dudukan laptop berbahan aluminium aeronautika dengan sirkulasi udara optimal dan kemiringan ergonomis untuk mengurangi ketegangan leher.',
    image_url:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    weight_grams: 650,
    specs: {
      material: 'Anodized Aircraft Aluminum',
      kompatibilitas: 'Laptop 11-17 inci',
      fitur: 'Lipat portabel dengan silikon bantalan',
    },
    rating: 4.85,
    review_count: 15,
    sold_count: 34,
    is_featured: false,
  },

  // Furnitur & Ruang Kerja
  {
    categorySlug: 'furniture',
    name: 'Meja Kerja Modular Solid Oak',
    price: 3250000,
    stock: 8,
    description:
      'Meja kerja minimalis permukaan kayu solid oak berperekat ramah lingkungan, rangka baja kokoh berlapis powder coating, dan tray manajemen kabel.',
    image_url:
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
    weight_grams: 24000,
    specs: {
      dimensi: '140cm x 70cm x 75cm',
      material_top: 'Solid White Oak Wood',
      material_frame: 'Heavy-gauge Carbon Steel',
      kapasitas_beban: '120 kg',
    },
    rating: 5.0,
    review_count: 11,
    sold_count: 18,
    is_featured: true,
  },
  {
    categorySlug: 'furniture',
    name: 'Kursi Ergonomis Mesh Pro',
    price: 2890000,
    stock: 14,
    description:
      'Kursi kerja ergonomis dengan sandaran punggung jaring elastis, penopang lumbar adaptif 3D, dan mekanisme sinkronisasi multi-posisi.',
    image_url:
      'https://images.unsplash.com/photo-1580481077195-731da03fed7e?auto=format&fit=crop&w=800&q=80',
    weight_grams: 18500,
    specs: {
      sandaran: 'Korean Breathable Mesh',
      lumbar: 'Dynamic 3D Adaptive Support',
      gaslift: 'Class-4 Hydraulic SGS Certified',
    },
    rating: 4.9,
    review_count: 28,
    sold_count: 45,
    is_featured: false,
  },
  {
    categorySlug: 'furniture',
    name: 'Tatakan Monitor Kayu Walnut',
    price: 680000,
    stock: 22,
    description:
      'Stand monitor ganda berbahan kayu walnut alami dengan rak bawah aluminium untuk menyimpan keyboard dan perlengkapan meja kerja.',
    image_url:
      'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80',
    weight_grams: 2800,
    specs: {
      dimensi: '105cm x 23cm x 11cm',
      material: 'American Solid Walnut Wood',
      kaki: 'Precision Brushed Aluminum',
    },
    rating: 4.88,
    review_count: 20,
    sold_count: 39,
    is_featured: false,
  },
  {
    categorySlug: 'furniture',
    name: 'Desk Mat Kulit Vegan Minimalis',
    price: 210000,
    stock: 3,
    description:
      'Alas meja kerja kulit vegan premium tahan tumpahan air, permukaan halus untuk pergerakan mouse presisi, dan lapisan dasar suede anti-slip.',
    image_url:
      'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=800&q=80',
    weight_grams: 480,
    specs: {
      dimensi: '80cm x 40cm',
      material: 'PU Vegan Leather + Cork Backing',
      fitur: 'Waterproof dan mudah dibersihkan',
    },
    rating: 4.82,
    review_count: 14,
    sold_count: 51,
    is_featured: false,
  },

  // Rumah & Dapur
  {
    categorySlug: 'home',
    name: 'Dripper Kopi Keramik Pour-Over V60',
    price: 285000,
    stock: 35,
    description:
      'Alat seduh kopi keramik manual dengan alur spiral internal untuk laju aliran air seimbang dan ekstraksi aroma kopi yang kaya.',
    image_url:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    weight_grams: 420,
    specs: {
      material: 'Arita Ceramic Porcelain',
      kapasitas: '1-4 Cups (Ukuran 02)',
      perawatan: 'Dishwasher Safe',
    },
    rating: 4.94,
    review_count: 31,
    sold_count: 72,
    is_featured: false,
  },
  {
    categorySlug: 'home',
    name: 'Penggiling Kopi Manual Stainless Steel',
    price: 460000,
    stock: 20,
    description:
      'Penggiling biji kopi tangan dengan mata pisau kerucut stainless 420 presisi dan poros ganda untuk keseragaman gilingan espresso hingga pour-over.',
    image_url:
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
    weight_grams: 580,
    specs: {
      mata_burr: 'CNC 420 Stainless Steel Conical',
      kapasitas_hopper: '30 gram biji kopi',
      penyetelan: 'Internal Stepped Adjustment',
    },
    rating: 4.9,
    review_count: 22,
    sold_count: 48,
    is_featured: false,
  },
  {
    categorySlug: 'home',
    name: 'Gelas Kaca Borosilikat Double-Wall 350ml',
    price: 125000,
    stock: 60,
    description:
      'Cangkir kopi kaca dinding ganda tahan panas borosilikat, menjaga suhu minuman hangat atau dingin tanpa kondensasi pada dinding luar.',
    image_url:
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    weight_grams: 210,
    specs: {
      kapasitas: '350 ml',
      material: 'High Borosilicate Glass (-20°C to 150°C)',
      isi: '1 unit cangkir double-wall',
    },
    rating: 4.86,
    review_count: 42,
    sold_count: 110,
    is_featured: false,
  },
  {
    categorySlug: 'home',
    name: 'Wadah Biji Kopi Kedap Udara Vakum',
    price: 240000,
    stock: 45,
    description:
      'Toples penyimpanan kopi dengan katup pelepas gas CO2 satu arah dan segel silikon rapat untuk menjaga kesegaran roasted beans.',
    image_url:
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
    weight_grams: 390,
    specs: {
      kapasitas: '500 gram (1.2 Liter)',
      material: 'Stainless Steel 304 Food Grade',
      fitur: 'Date Tracker Wheel & CO2 Vent',
    },
    rating: 4.88,
    review_count: 18,
    sold_count: 36,
    is_featured: false,
  },

  // Pakaian & Aksesoris
  {
    categorySlug: 'lifestyle',
    name: 'Dompet Kartu Kulit Nabati Slim',
    price: 295000,
    stock: 30,
    description:
      'Dompet kartu saku tipis berbahan kulit sapi nabati dengan lapisan pemblokir RFID, 6 slot kartu, dan kompartemen uang tunai lipat.',
    image_url:
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    weight_grams: 85,
    specs: {
      material: 'Full-grain Vegetable Tanned Leather',
      kapasitas: '6 kartu + kompartemen uang',
      fitur: 'RFID Blocking Protection',
    },
    rating: 4.91,
    review_count: 27,
    sold_count: 64,
    is_featured: false,
  },
  {
    categorySlug: 'lifestyle',
    name: 'Jam Tangan Lapangan Otomatis Field Watch',
    price: 1850000,
    stock: 10,
    description:
      'Jam tangan bergaya militer dengan kaca kristal safir anti gores, mesin otomatis 24 permata, jarum berpendar superluminova, dan strap kanvas tahan air.',
    image_url:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    weight_grams: 160,
    specs: {
      diameter: '38 mm',
      kaca: 'Sapphire Crystal dengan AR Coating',
      mesin: 'Automatic Movement NH35 24-Jewels',
      water_resistance: '100 Meter / 10 ATM',
    },
    rating: 4.96,
    review_count: 16,
    sold_count: 29,
    is_featured: true,
  },
  {
    categorySlug: 'lifestyle',
    name: 'Kaus Katun Organik Heavyweight 240gsm',
    price: 195000,
    stock: 50,
    description:
      'Kaus oblong kasual berbahan 100% serat katun organik pilihan dengan gramasi padat 240gsm, berpotongan santai dan tahan susut.',
    image_url:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    weight_grams: 280,
    specs: {
      gramasi: '240 GSM Heavyweight Cotton',
      sertifikasi: 'GOTS Organic Certified',
      potongan: 'Relaxed Boxy Fit',
    },
    rating: 4.84,
    review_count: 38,
    sold_count: 95,
    is_featured: false,
  },
  {
    categorySlug: 'lifestyle',
    name: 'Topi Baseball Katun Washed Unstructured',
    price: 165000,
    stock: 40,
    description:
      'Topi 6-panel klasik berbahan katun twill washed yang lembut dengan gesper pengatur kuningan antik di bagian belakang.',
    image_url:
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    weight_grams: 95,
    specs: {
      material: '100% Washed Cotton Twill',
      penutup: 'Antique Brass Slider Buckle',
      lingkar: 'Adjustable 54-60 cm',
    },
    rating: 4.8,
    review_count: 21,
    sold_count: 47,
    is_featured: false,
  },

  // Alat Tulis & Kerajinan
  {
    categorySlug: 'stationery',
    name: 'Jurnal Grid Hardcover Kertas 120gsm',
    price: 175000,
    stock: 55,
    description:
      'Buku catatan bersampul kain linen hardcover dengan 192 halaman kertas dot grid 120gsm bebas asam yang ramah terhadap tinta pena basah.',
    image_url:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    weight_grams: 410,
    specs: {
      ukuran: 'A5 (148 x 210 mm)',
      kertas: '120 GSM Acid-Free Ivory Paper',
      isi: '192 Halaman Dot Grid 5mm',
      sampul: 'Natural Woven Linen Hardcover',
    },
    rating: 4.93,
    review_count: 35,
    sold_count: 88,
    is_featured: false,
  },
  {
    categorySlug: 'stationery',
    name: 'Penggaris Segitiga Arsitek Aluminium',
    price: 135000,
    stock: 70,
    description:
      'Penggaris skala drafting arsitektural paduan aluminium padat dengan grafir angka laser tahan luntur dan kode warna pada setiap sisinya.',
    image_url:
      'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&w=800&q=80',
    weight_grams: 130,
    specs: {
      panjang: '30 cm',
      material: 'Solid Anodized Aluminum Alloy',
      skala: '1:20, 1:25, 1:50, 1:75, 1:100, 1:125',
    },
    rating: 4.89,
    review_count: 19,
    sold_count: 53,
    is_featured: false,
  },
  {
    categorySlug: 'stationery',
    name: 'Tempat Pensil Kulit Gulung Handcrafted',
    price: 240000,
    stock: 25,
    description:
      'Gulungan tempat alat tulis berbahan kulit asli samak nabati dengan 5 slot elastis untuk pena favorit dan tali pengikat kulit melingkar.',
    image_url:
      'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
    weight_grams: 145,
    specs: {
      material: 'Crazy Horse Genuine Leather',
      kapasitas: '5-6 Alat Tulis Standar',
      dimensi_buka: '29cm x 20cm',
    },
    rating: 4.87,
    review_count: 17,
    sold_count: 39,
    is_featured: false,
  },
  {
    categorySlug: 'stationery',
    name: 'Klip Kertas Kuningan Solid Vintage (Set 10)',
    price: 85000,
    stock: 90,
    description:
      'Set 10 klip penjepit berkas dari kuningan murni tanpa lapisan cat yang akan menua membentuk patina anggun seiring waktu pemakaian.',
    image_url:
      'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80',
    weight_grams: 90,
    specs: {
      material: 'Solid Brass (Kuningan Murni)',
      isi: '10 pcs klip dokumen presisi',
      finishing: 'Hand Brushed Natural Patina',
    },
    rating: 4.85,
    review_count: 29,
    sold_count: 76,
    is_featured: false,
  },
]

export default defineEventHandler(async (event) => {
  // Hanya izinkan dieksekusi di dev server atau lingkungan internal
  if (process.env.NODE_ENV === 'production' && !import.meta.dev) {
    return errorResponse(event, 'Forbidden in production', null, 403)
  }

  const client = serverSupabaseServiceRole<Database>(event)

  // 1. Ambil data kategori untuk mapping category_id secara dinamis
  const { data: dbCategories, error: catError } = await client.from('categories').select('id, slug')

  if (catError || !dbCategories) {
    return errorResponse(event, 'Gagal memuat data kategori', catError?.message, 500)
  }

  const categoryMap = new Map<string, string>()
  for (const cat of dbCategories) {
    categoryMap.set(cat.slug, cat.id)
  }

  // 2. Soft-delete dummy testing products (id 8, 10, 11, 12 dan nama-nama dummy)
  const dummyIds = [8, 10, 11, 12]
  const nowIso = new Date().toISOString()

  let deletedDummyCount = 0
  const deleteErrors: Record<string, string> = {}
  for (const dummyId of dummyIds) {
    const { error: delErr } = await client
      .from('products')
      .update({ deleted_at: nowIso })
      .eq('id', dummyId)
    if (!delErr) {
      deletedDummyCount++
    } else {
      deleteErrors[`id_${dummyId}`] = delErr.message
    }
  }

  const dummyNames = ['Tambah baru', 'test edit lagi', 'tambah edit', 'Produk baru lagi']
  for (const dummyName of dummyNames) {
    await client.from('products').update({ deleted_at: nowIso }).eq('name', dummyName)
  }

  // 3. Masukkan produk kurasi baru secara idempoten
  let insertedCount = 0
  let skippedCount = 0

  for (const item of CURATED_PRODUCTS) {
    const categoryId = categoryMap.get(item.categorySlug)
    if (!categoryId) {
      continue
    }

    // Periksa apakah produk aktif dengan nama yang sama sudah ada
    const { data: existing } = await client
      .from('products')
      .select('id')
      .eq('name', item.name)
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      skippedCount++
      continue
    }

    const { error: insertError } = await client.from('products').insert({
      name: item.name,
      price: item.price,
      stock: item.stock,
      description: item.description,
      image_url: item.image_url,
      category_id: categoryId,
      weight_grams: item.weight_grams,
      specs: item.specs as Database['public']['Tables']['products']['Row']['specs'],
      gallery_urls: [item.image_url],
      rating: item.rating,
      review_count: item.review_count,
      sold_count: item.sold_count,
      is_featured: item.is_featured,
    })

    if (insertError) {
      return errorResponse(event, `Gagal menambahkan produk ${item.name}`, insertError.message, 500)
    }

    insertedCount++
  }

  return successResponse('Seeding produk kurasi berhasil', {
    insertedCount,
    skippedCount,
    deletedDummyCount,
    deleteErrors,
    totalCuratedList: CURATED_PRODUCTS.length,
  })
})
