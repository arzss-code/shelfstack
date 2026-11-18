export interface CategoryItem {
  id: string
  name: string
  slug: string
  description?: string | null
  image_url?: string | null
  display_order?: number
}

export const CANONICAL_CATEGORIES: CategoryItem[] = [
  {
    id: '28082f15-1fd6-425e-9f6e-ed197c591c39',
    name: 'Tech & Gadget',
    slug: 'tech',
    description:
      'Audio resolusi tinggi, perangkat pintar nirkabel, keyboard mekanikal, dan adaptor daya presisi.',
    image_url: '/logo.svg',
    display_order: 1,
  },
  {
    id: '4ca7076f-667c-45f4-aea6-cd76356a5ef2',
    name: 'Rumah & Dapur',
    slug: 'home',
    description:
      'Peralatan seduh kopi manual, gelas kaca borosilikat tahan panas, dan keramik meja makan minimalis.',
    image_url: '/logo.svg',
    display_order: 2,
  },
  {
    id: '0c6b1f1d-64ca-4c94-8666-91a97f8e4095',
    name: 'Furnitur & Ruang Kerja',
    slug: 'furniture',
    description:
      'Kursi ergonomis, meja modular solid, dan sistem rak penyimpanan terorganisir untuk ruang kerja.',
    image_url: '/logo.svg',
    display_order: 3,
  },
  {
    id: 'f11887b3-ff92-4d6f-a119-a972efd79144',
    name: 'Pakaian & Aksesoris',
    slug: 'lifestyle',
    description:
      'Tas selempang harian, kaus katun organik combed, dan jam tangan fungsional berdaya tahan tinggi.',
    image_url: '/logo.svg',
    display_order: 4,
  },
  {
    id: '8d426592-2d81-4d0a-85a3-edae2803b8ad',
    name: 'Alat Tulis & Kerajinan',
    slug: 'stationery',
    description:
      'Pena presisi berbobot mantap, buku catatan bergaris halus, dan penggaris segitiga arsitektural.',
    image_url: '/logo.svg',
    display_order: 5,
  },
]

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  tech: [
    'keyboard',
    'audio',
    'headphone',
    'charge',
    'usb',
    'monitor',
    'stand',
    'dock',
    'hub',
    'kabel',
    'mouse',
    'sound',
    'gadget',
    'tech',
  ],
  home: [
    'organizer',
    'tray',
    'pot',
    'vas',
    'dekorasi',
    'mat',
    'lampu',
    'home',
    'rumah',
    'dapur',
    'kopi',
    'teh',
    'ketel',
    'tumbler',
    'cangkir',
  ],
  furniture: ['meja', 'kursi', 'desk', 'chair', 'rak', 'shelf', 'furnitur', 'bangku', 'kerja'],
  lifestyle: [
    'tas',
    'case',
    'dompet',
    'jaket',
    'kaos',
    'sleeve',
    'edc',
    'pakaian',
    'aksesoris',
    'lifestyle',
    'topi',
  ],
  stationery: [
    'buku',
    'pen',
    'pena',
    'pensil',
    'notebook',
    'alat tulis',
    'kantor',
    'kerajinan',
    'stiker',
    'penggaris',
    'arsitek',
  ],
}

export function useCategories() {
  let categories: Ref<CategoryItem[]>
  try {
    categories = useState<CategoryItem[]>('shelfstack-categories', () => CANONICAL_CATEGORIES)
  } catch {
    categories = ref<CategoryItem[]>(CANONICAL_CATEGORIES)
  }
  const pending = ref(false)

  const fetchCategories = async () => {
    pending.value = true
    try {
      const res = await $fetch<{ status: string; data: CategoryItem[] }>('/api/categories')
      if (res && res.data && res.data.length > 0) {
        categories.value = res.data
      }
    } catch {
      // Pertahankan canonical fallback jika error
      categories.value = CANONICAL_CATEGORIES
    } finally {
      pending.value = false
    }
  }

  const categoryMap = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const cat of categories.value) {
      map[cat.name] = cat.slug
    }
    return map
  })

  const getCategoryName = (slug: string): string => {
    const found = categories.value.find((c) => c.slug === slug)
    return found ? found.name : 'Semua Kategori'
  }

  return {
    categories,
    pending,
    categoryMap,
    fetchCategories,
    getCategoryName,
    CATEGORY_KEYWORDS,
  }
}
