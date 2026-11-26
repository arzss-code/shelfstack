import type { SeedProductItem } from './types'

export const PRODUCTS_STATIONERY: SeedProductItem[] = [
  // Alat Tulis & Kerajinan
  {
    categorySlug: 'stationery',
    name: 'Pena Gel Presisi Titanium',
    price: 340000,
    stock: 40,
    description:
      'Pena berbahan bodi titanium padat dengan mekanisme bolt-action tahan banting dan isi ulang standar internasional Schmidt EasyFlow.',
    image_url: '/images/products/pen-titanium-black.jpg',
    gallery_urls: [
      '/images/products/pen-titanium-black.jpg',
      '/images/products/pen-titanium-raw.jpg',
    ],
    weight_grams: 65,
    specs: {
      material: 'Grade 5 Solid Titanium Alloy',
      mekanisme: 'Precision Bolt-Action',
      refill: 'Schmidt EasyFlow 9000 Standard',
      panjang: '135 mm / Diameter 10 mm',
    },
    rating: 4.95,
    review_count: 28,
    sold_count: 62,
    is_featured: false,
  },
  {
    categorySlug: 'stationery',
    name: 'Jurnal Grid Hardcover Kertas 120gsm',
    price: 175000,
    stock: 55,
    description:
      'Buku catatan bersampul kain linen hardcover dengan 192 halaman kertas dot grid 120gsm bebas asam yang ramah terhadap tinta pena basah.',
    image_url: '/images/products/journal-grid-green.jpg',
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
    image_url: '/images/products/ruler-architect-black.jpg',
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
    image_url: '/images/products/pencil-roll-brown.jpg',
    gallery_urls: [
      '/images/products/pencil-roll-brown.jpg',
      '/images/products/pencil-roll-tan.jpg',
    ],
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
    image_url: '/images/products/clips-brass-vintage.jpg',
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
