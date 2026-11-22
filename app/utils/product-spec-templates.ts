import type { ProductSpecItem, ProductVariants } from './product-specs'

export const CATEGORY_ID_MAP: Record<string, string> = {
  '28082f15-1fd6-425e-9f6e-ed197c591c39': 'tech',
  '4ca7076f-667c-45f4-aea6-cd76356a5ef2': 'home',
  '0c6b1f1d-64ca-4c94-8666-91a97f8e4095': 'furniture',
  'f11887b3-ff92-4d6f-a119-a972efd79144': 'lifestyle',
  '8d426592-2d81-4d0a-85a3-edae2803b8ad': 'stationery',
}

export const SPEC_CATEGORY_KEYWORDS: Record<string, string[]> = {
  tech: ['headphone', 'audio', 'anc', 'keyboard', 'charger', 'gadget', 'kabel'],
  home: ['ketel', 'kopi', 'cangkir', 'gelas', 'dapur', 'sendok', 'piring', 'kettle'],
  furniture: ['meja', 'kursi', 'lampu', 'rak', 'standing', 'desk', 'sofa'],
  lifestyle: ['tas', 'komuter', 'backpack', 'sling', 'dompet', 'jaket', 'edc'],
  stationery: ['pena', 'pen', 'catatan', 'buku', 'penggaris', 'notebook', 'pencil'],
}

export const CATEGORY_VARIANTS_MAP: Record<string, ProductVariants> = {
  tech: {
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
  },
  home: {
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
  },
  furniture: {
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
  },
  lifestyle: {
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
  },
  stationery: {
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
  },
}

export const SPECIFIC_ITEM_VARIANTS: Record<string, ProductVariants> = {
  watch: {
    colorTitle: 'Pilihan Warna Lapangan',
    colors: [
      { name: 'Stealth Black', class: 'bg-[#18181b]' },
      { name: 'Olive Drab', class: 'bg-[#3f4e38]' },
    ],
    optionTitle: 'Diameter Case & Dial',
    options: [
      { name: '38mm Dial Klasik', note: 'Proporsional & Ringan' },
      { name: '40mm Dial Lapangan', note: 'Tangguh & Visibilitas Tinggi' },
    ],
  },
  wallet: {
    colorTitle: 'Pilihan Warna Kulit',
    colors: [
      { name: 'Cognac Tan', class: 'bg-[#92400e]' },
      { name: 'Tactical Black', class: 'bg-[#18181b]' },
    ],
    optionTitle: 'Kapasitas Kompartemen',
    options: [
      { name: '6 Slot Kartu Slim', note: 'Ultra tipis profil 6mm' },
      { name: '8 Slot + Cash Pocket', note: 'Kapasitas harian serbaguna' },
    ],
  },
  apparel: {
    colorTitle: 'Pilihan Warna',
    colors: [
      { name: 'Deep Black', class: 'bg-[#18181b]' },
      { name: 'Off White', class: 'bg-[#f4f4f5]' },
      { name: 'Olive Drab', class: 'bg-[#3f4e38]' },
    ],
    optionTitle: 'Pilihan Ukuran',
    options: [
      { name: 'M (Lebar 53cm)', note: 'Standar Reguler Fit' },
      { name: 'L (Lebar 56cm)', note: 'Relaxed Fit' },
      { name: 'XL (Lebar 59cm)', note: 'Oversized Streetwear' },
    ],
  },
  cap: {
    colorTitle: 'Pilihan Warna',
    colors: [
      { name: 'Washed Charcoal', class: 'bg-[#27272a]' },
      { name: 'Khaki Sand', class: 'bg-[#d4b996]' },
    ],
    optionTitle: 'Sistem Pengencang',
    options: [
      { name: 'Strap Logam Kuningan', note: 'Adjustable lingkar 54-60cm' },
      { name: 'Strap Kulit Asli', note: 'Finishing kulit nabati' },
    ],
  },
  keyboard: {
    colorTitle: 'Pilihan Warna Sasis',
    colors: [
      { name: 'Matte Obsidian', class: 'bg-[#18181b]' },
      { name: 'Chalk White', class: 'bg-[#f4f4f5]' },
      { name: 'Midnight Navy', class: 'bg-[#1e293b]' },
    ],
    optionTitle: 'Pilihan Switch Mekanikal',
    options: [
      { name: 'Linear Red (Pre-Lubed)', note: 'Halus & senyap untuk mengetik cepat' },
      { name: 'Tactile Brown (Pre-Lubed)', note: 'Feedback ketukan mantap berumpan' },
    ],
  },
}

export const CATEGORY_SPECS_MAP: Record<string, ProductSpecItem[]> = {
  tech: [
    { label: 'Driver Audio', value: '40mm Diafragma Berilium Presisi', icon: 'pi pi-volume-up' },
    { label: 'Daya Tahan Baterai', value: 'Hingga 45 Jam Pemakaian (ANC On)', icon: 'pi pi-bolt' },
    { label: 'Konektivitas', value: 'Bluetooth 5.3 & USB-C Audio Lossless', icon: 'pi pi-wifi' },
    { label: 'Peredam Bising', value: 'Hybrid ANC Aktif (-38dB adaptif)', icon: 'pi pi-shield' },
    { label: 'Bobot Produk', value: '250 gram (Bantalan Busa Memori)', icon: 'pi pi-box' },
  ],
  home: [
    { label: 'Kapasitas Volume', value: '800 ml (Aliran Seduh Presisi)', icon: 'pi pi-database' },
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
  ],
  furniture: [
    { label: 'Dimensi Rangka', value: '140 cm × 70 cm × 75 cm', icon: 'pi pi-arrows-alt' },
    { label: 'Beban Maksimal', value: 'Hingga 120 kg Terdistribusi Rata', icon: 'pi pi-shield' },
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
    { label: 'Garansi Struktur', value: '5 Tahun Garansi Resmi Rangka', icon: 'pi pi-verified' },
  ],
  lifestyle: [
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
    { label: 'Proteksi Cuaca', value: 'YKK® Aquaguard Ritsleting Anti Air', icon: 'pi pi-cloud' },
    { label: 'Bobot Kosong', value: '980 gram (Tali Bahu Busa Aerasi)', icon: 'pi pi-box' },
  ],
  stationery: [
    { label: 'Bahan Konstruksi', value: 'Titanium Grade 5 CNC Machined', icon: 'pi pi-shield' },
    { label: 'Mekanisme Tutup', value: 'Magnetic Precision Click Lock', icon: 'pi pi-lock' },
    {
      label: 'Kompatibilitas Isi Ulang',
      value: 'Standar G2 Parker Style Refill',
      icon: 'pi pi-pencil',
    },
    {
      label: 'Finishing Bodi',
      value: 'Micro-Textured Anti Slip Ergonomis',
      icon: 'pi pi-sparkles',
    },
    { label: 'Bobot Pena', value: '42 gram (Keseimbangan Tengah Sempurna)', icon: 'pi pi-box' },
  ],
}
