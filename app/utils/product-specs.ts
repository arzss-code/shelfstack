import type { Product } from '~/types/product'

export interface ProductSpecItem {
  label: string
  value: string
  icon?: string
}

export interface ProductVariantColor {
  name: string
  class: string
}

export interface ProductVariantOption {
  name: string
  note?: string
}

export interface ProductVariants {
  colorTitle: string
  colors: ProductVariantColor[]
  optionTitle: string
  options: ProductVariantOption[]
}

const CATEGORY_ID_MAP: Record<string, string> = {
  '28082f15-1fd6-425e-9f6e-ed197c591c39': 'tech',
  '4ca7076f-667c-45f4-aea6-cd76356a5ef2': 'home',
  '0c6b1f1d-64ca-4c94-8666-91a97f8e4095': 'furniture',
  'f11887b3-ff92-4d6f-a119-a972efd79144': 'lifestyle',
  '8d426592-2d81-4d0a-85a3-edae2803b8ad': 'stationery',
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  tech: ['headphone', 'audio', 'anc', 'keyboard', 'charger', 'gadget', 'kabel'],
  home: ['ketel', 'kopi', 'cangkir', 'gelas', 'dapur', 'sendok', 'piring', 'kettle'],
  furniture: ['meja', 'kursi', 'lampu', 'rak', 'standing', 'desk', 'sofa'],
  lifestyle: ['tas', 'komuter', 'backpack', 'sling', 'dompet', 'jaket', 'edc'],
  stationery: ['pena', 'pen', 'catatan', 'buku', 'penggaris', 'notebook', 'pencil'],
}

/**
 * Mendeteksi kategori slug produk berdasarkan category_id atau nama/slug produk
 */
export function detectProductCategorySlug(product: Product): string {
  if (product.category_id && CATEGORY_ID_MAP[product.category_id]) {
    return CATEGORY_ID_MAP[product.category_id] as string
  }

  const searchText = `${product.slug || ''} ${product.name || ''}`.toLowerCase()
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => searchText.includes(kw))) {
      return slug
    }
  }

  return 'tech' // Default fallback
}

/**
 * Menyediakan opsi varian warna dan material/opsi kedua yang relevan dengan jenis produk
 */
export function getProductVariants(product: Product): ProductVariants {
  const cat = detectProductCategorySlug(product)

  switch (cat) {
    case 'tech':
      return {
        colorTitle: 'Pilihan Warna',
        colors: [
          { name: 'Matte Obsidian', class: 'bg-[#141414]' },
          { name: 'Silver Frost', class: 'bg-[#e2e2e2]' },
          { name: 'Midnight Navy', class: 'bg-[#1e293b]' },
        ],
        optionTitle: 'Mode Konektivitas',
        options: [
          { name: 'Wireless ANC Pro', note: 'Bluetooth 5.3 + Peredam Bising Aktif' },
          { name: 'Wired Studio Pure', note: 'Kabel OFC 3.5mm tanpa kompresi' },
          { name: 'Ultra-Low Latency', note: 'Dongle nirkabel 2.4GHz 15ms' },
        ],
      }

    case 'home':
      return {
        colorTitle: 'Pilihan Warna Finishing',
        colors: [
          { name: 'Matte Black', class: 'bg-[#1c1917]' },
          { name: 'Brushed Silver', class: 'bg-[#cbd5e1]' },
          { name: 'Chalk White', class: 'bg-[#f5f5f4]' },
        ],
        optionTitle: 'Material Utama',
        options: [
          { name: '304 Stainless Steel', note: 'Food-grade tahan korosi & higienis' },
          { name: 'Borosilicate Glass', note: 'Tahan guncangan suhu mendadak' },
          { name: 'Solid Walnut Accent', note: 'Pegangan kayu walnut alami ergonomis' },
        ],
      }

    case 'furniture':
      return {
        colorTitle: 'Pilihan Warna Kayu & Rangka',
        colors: [
          { name: 'Deep Walnut', class: 'bg-[#451a03]' },
          { name: 'Natural Oak', class: 'bg-[#d97706]' },
          { name: 'Matte Midnight', class: 'bg-[#0f172a]' },
        ],
        optionTitle: 'Material Rangka Konstruksi',
        options: [
          { name: 'Solid Walnut Wood', note: 'Kayu padat bersertifikasi kelestarian' },
          { name: 'Anodized 6063 Alloy', note: 'Aluminium kokoh kelas dirgantara' },
          { name: 'Powder-Coated Steel', note: 'Baja anti gores beban maksimal' },
        ],
      }

    case 'lifestyle':
      return {
        colorTitle: 'Pilihan Warna Lapangan',
        colors: [
          { name: 'Tactical Black', class: 'bg-[#09090b]' },
          { name: 'Slate Gray', class: 'bg-[#475569]' },
          { name: 'Olive Drab', class: 'bg-[#3f4e38]' },
        ],
        optionTitle: 'Ukuran & Kapasitas',
        options: [
          { name: '20L Daily Commute', note: 'Ideal untuk kerja harian & mobilitas' },
          { name: '25L Weekender Pro', note: 'Ekstra kompartemen pakaian 2-3 hari' },
          { name: 'Compact EDC Sling', note: 'Ringkas untuk barang esensial harian' },
        ],
      }

    case 'stationery':
    default:
      return {
        colorTitle: 'Pilihan Finishing Bodi',
        colors: [
          { name: 'Raw Titanium', class: 'bg-[#71717a]' },
          { name: 'Stonewashed Black', class: 'bg-[#18181b]' },
          { name: 'Brass Gold', class: 'bg-[#ca8a04]' },
        ],
        optionTitle: 'Ukuran Mata Pena & Tip',
        options: [
          { name: '0.5mm Fine Needle', note: 'Garis presisi untuk sketsa & catatan' },
          { name: '0.7mm Medium Flow', note: 'Aliran tinta lembut seimbang harian' },
          { name: '1.0mm Bold Signature', note: 'Tanda tangan tegas tanpa putus' },
        ],
      }
  }
}

/**
 * Menyediakan tabel spesifikasi teknis dinamis berdasarkan kategori produk
 */
export function getProductSpecs(product: Product): ProductSpecItem[] {
  const cat = detectProductCategorySlug(product)
  const defaultSpecs: ProductSpecItem[] = []

  switch (cat) {
    case 'tech':
      defaultSpecs.push(
        {
          label: 'Driver Audio',
          value: '40mm Diafragma Berilium Presisi',
          icon: 'pi pi-volume-up',
        },
        {
          label: 'Daya Tahan Baterai',
          value: 'Hingga 45 Jam Pemakaian (ANC On)',
          icon: 'pi pi-bolt',
        },
        {
          label: 'Konektivitas',
          value: 'Bluetooth 5.3 & USB-C Audio Lossless',
          icon: 'pi pi-wifi',
        },
        {
          label: 'Peredam Bising',
          value: 'Hybrid ANC Aktif (-38dB adaptif)',
          icon: 'pi pi-shield',
        },
        { label: 'Bobot Produk', value: '250 gram (Bantalan Busa Memori)', icon: 'pi pi-box' },
      )
      break

    case 'home':
      defaultSpecs.push(
        {
          label: 'Kapasitas Volume',
          value: '800 ml (Aliran Seduh Presisi)',
          icon: 'pi pi-database',
        },
        {
          label: 'Material Bodi',
          value: 'Baja Tahan Karat 304 Food-Grade',
          icon: 'pi pi-check-circle',
        },
        {
          label: 'Kompatibilitas Kompor',
          value: 'Kompor Induksi, Listrik, & Api Halus',
          icon: 'pi pi-sun',
        },
        { label: 'Ketahanan Suhu', value: 'Hingga 220°C Tanpa Korosi', icon: 'pi pi-shield' },
        { label: 'Bobot Kosong', value: '540 gram (Seimbang di Tangan)', icon: 'pi pi-box' },
      )
      break

    case 'furniture':
      defaultSpecs.push(
        { label: 'Dimensi Rangka', value: '140 cm × 70 cm × 75 cm', icon: 'pi pi-arrows-alt' },
        {
          label: 'Beban Maksimal',
          value: 'Hingga 120 kg Terdistribusi Rata',
          icon: 'pi pi-shield',
        },
        {
          label: 'Finishing Permukaan',
          value: 'Lapisan Matte Hand-Oiled Tahan Noda',
          icon: 'pi pi-sparkles',
        },
        {
          label: 'Sistem Perakitan',
          value: 'Modular Tool-Free (Kurang dari 15 Menit)',
          icon: 'pi pi-cog',
        },
        {
          label: 'Garansi Struktur',
          value: '5 Tahun Garansi Resmi Rangka',
          icon: 'pi pi-verified',
        },
      )
      break

    case 'lifestyle':
      defaultSpecs.push(
        {
          label: 'Kapasitas Volume',
          value: '20 Liter (Desain Kompartemen Terorganisir)',
          icon: 'pi pi-box',
        },
        {
          label: 'Material Luar',
          value: 'Cordura® 1000D Ballistic Nylon Tahan Robek',
          icon: 'pi pi-shield',
        },
        {
          label: 'Kompartemen Laptop',
          value: 'Khusus Laptop hingga 16 Inci (Empuk Suspended)',
          icon: 'pi pi-desktop',
        },
        {
          label: 'Proteksi Cuaca',
          value: 'Water-Repellent DWR + Ritsleting YKK AquaGuard',
          icon: 'pi pi-cloud',
        },
        {
          label: 'Bobot Kosong',
          value: '880 gram (Bantalan Punggung Sirkulasi Udara)',
          icon: 'pi pi-compass',
        },
      )
      break

    case 'stationery':
    default:
      defaultSpecs.push(
        { label: 'Material Bodi', value: 'Paduan Titanium Solid Grade-5', icon: 'pi pi-sparkles' },
        {
          label: 'Mekanisme Aksi',
          value: 'Bolt-Action Taktis Halus Teruji 100.000 Klik',
          icon: 'pi pi-sync',
        },
        {
          label: 'Kompatibilitas Refill',
          value: 'Schmidt EasyFlow 9000 & Parker G2 Standar',
          icon: 'pi pi-pencil',
        },
        {
          label: 'Dimensi & Diameter',
          value: 'Panjang 135 mm × Diameter 10.5 mm',
          icon: 'pi pi-arrows-alt',
        },
        {
          label: 'Distribusi Bobot',
          value: '38 gram (Pusat Titik Berat Seimbang)',
          icon: 'pi pi-box',
        },
      )
      break
  }

  // Jika ada custom specs di database, tambahkan/override
  if (product.specs && typeof product.specs === 'object') {
    for (const [key, val] of Object.entries(product.specs)) {
      if (typeof val === 'string' || typeof val === 'number') {
        const existingIdx = defaultSpecs.findIndex(
          (s) => s.label.toLowerCase() === key.toLowerCase(),
        )
        const existingItem = defaultSpecs[existingIdx]
        if (existingIdx >= 0 && existingItem) {
          defaultSpecs[existingIdx] = { ...existingItem, value: String(val) }
        } else {
          defaultSpecs.push({ label: key, value: String(val), icon: 'pi pi-info-circle' })
        }
      }
    }
  }

  return defaultSpecs
}
