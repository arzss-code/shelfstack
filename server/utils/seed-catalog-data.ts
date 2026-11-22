export interface SeedVariantItem {
  productName: string
  sku: string
  name: string
  attributes: {
    color: string
    colorClass: string
    image_url: string
    material?: string
  }
  price_cents: number
  stock: number
}

export interface DemoReviewer {
  id: string
  email: string
  fullName: string
}

export interface SeedReviewItem {
  productName: string
  reviewerIndex: number // Index 0 to 4
  rating: number
  reviewText: string
}

export const DEMO_REVIEWERS: DemoReviewer[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'demo-customer@shelfstack.local',
    fullName: 'Arya Pratama',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'customer@shelfstack.local',
    fullName: 'Budi Santoso',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'dian.kusuma@shelfstack.local',
    fullName: 'Dian Kusuma',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'reza.firmansyah@shelfstack.local',
    fullName: 'Reza Firmansyah',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'siti.rahmawati@shelfstack.local',
    fullName: 'Siti Rahmawati',
  },
]

export const CURATED_VARIANTS: SeedVariantItem[] = [
  // 1. Tech & Gadget
  {
    productName: 'Keyboard Mekanikal Nirkabel 75%',
    sku: 'SS-KBD-75-BLK',
    name: 'Matte Obsidian',
    attributes: {
      color: 'Matte Obsidian',
      colorClass: 'bg-[#18181b]',
      image_url:
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 145000000,
    stock: 16,
  },
  {
    productName: 'Keyboard Mekanikal Nirkabel 75%',
    sku: 'SS-KBD-75-WHT',
    name: 'Chalk White',
    attributes: {
      color: 'Chalk White',
      colorClass: 'bg-[#f4f4f5]',
      image_url:
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 145000000,
    stock: 10,
  },
  {
    productName: 'Keyboard Mekanikal Nirkabel 75%',
    sku: 'SS-KBD-75-NVY',
    name: 'Midnight Navy',
    attributes: {
      color: 'Midnight Navy',
      colorClass: 'bg-[#1e293b]',
      image_url:
        'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 149000000,
    stock: 6,
  },
  {
    productName: 'Headphone Studio ANC',
    sku: 'SS-HD-ANC-BLK',
    name: 'Midnight Black',
    attributes: {
      color: 'Midnight Black',
      colorClass: 'bg-[#141414]',
      image_url:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 268000000,
    stock: 15,
  },
  {
    productName: 'Headphone Studio ANC',
    sku: 'SS-HD-ANC-SLV',
    name: 'Silver Titanium',
    attributes: {
      color: 'Silver Titanium',
      colorClass: 'bg-[#d4d4d8]',
      image_url:
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 278000000,
    stock: 10,
  },
  {
    productName: 'Tetikus Ergonomis Nirkabel Precision',
    sku: 'SS-MOU-PRC-GRY',
    name: 'Space Gray',
    attributes: {
      color: 'Space Gray',
      colorClass: 'bg-[#3f3f46]',
      image_url:
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 89000000,
    stock: 16,
  },
  {
    productName: 'Tetikus Ergonomis Nirkabel Precision',
    sku: 'SS-MOU-PRC-WHT',
    name: 'Off White',
    attributes: {
      color: 'Off White',
      colorClass: 'bg-[#f5f5f4]',
      image_url:
        'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 89000000,
    stock: 12,
  },
  {
    productName: 'Pengisi Daya GaN 100W Multi-Port',
    sku: 'SS-CHG-GAN-BLK',
    name: 'Stealth Black',
    attributes: {
      color: 'Stealth Black',
      colorClass: 'bg-[#18181b]',
      image_url:
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 49900000,
    stock: 28,
  },
  {
    productName: 'Pengisi Daya GaN 100W Multi-Port',
    sku: 'SS-CHG-GAN-WHT',
    name: 'Arctic White',
    attributes: {
      color: 'Arctic White',
      colorClass: 'bg-[#fafafa]',
      image_url:
        'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 49900000,
    stock: 22,
  },
  {
    productName: 'Stand Laptop Ergonomis Aluminium',
    sku: 'SS-LST-ALM-SLV',
    name: 'Space Silver',
    attributes: {
      color: 'Space Silver',
      colorClass: 'bg-[#e2e8f0]',
      image_url:
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 32000000,
    stock: 2,
  },
  {
    productName: 'Stand Laptop Ergonomis Aluminium',
    sku: 'SS-LST-ALM-DGR',
    name: 'Space Gray',
    attributes: {
      color: 'Space Gray',
      colorClass: 'bg-[#475569]',
      image_url:
        'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 32000000,
    stock: 2,
  },

  // 2. Furnitur & Ruang Kerja
  {
    productName: 'Meja Kerja Modular Solid Oak',
    sku: 'SS-DSK-OAK-NAT',
    name: 'Natural Oak',
    attributes: {
      color: 'Natural Oak',
      colorClass: 'bg-[#d97706]',
      image_url:
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 325000000,
    stock: 5,
  },
  {
    productName: 'Meja Kerja Modular Solid Oak',
    sku: 'SS-DSK-OAK-WLN',
    name: 'Deep Walnut',
    attributes: {
      color: 'Deep Walnut',
      colorClass: 'bg-[#451a03]',
      image_url:
        'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 345000000,
    stock: 3,
  },
  {
    productName: 'Kursi Ergonomis Mesh Pro',
    sku: 'SS-CHR-MSH-BLK',
    name: 'All Black',
    attributes: {
      color: 'All Black',
      colorClass: 'bg-[#18181b]',
      image_url:
        'https://images.unsplash.com/photo-1580481077195-731da03fed7e?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 289000000,
    stock: 8,
  },
  {
    productName: 'Kursi Ergonomis Mesh Pro',
    sku: 'SS-CHR-MSH-GRY',
    name: 'Slate Gray',
    attributes: {
      color: 'Slate Gray',
      colorClass: 'bg-[#9ca3af]',
      image_url:
        'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 299000000,
    stock: 6,
  },
  {
    productName: 'Lampu Meja Task Aluminium',
    sku: 'SS-LMP-ALM-BLK',
    name: 'Matte Black',
    attributes: {
      color: 'Matte Black',
      colorClass: 'bg-[#18181b]',
      image_url:
        'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 85000000,
    stock: 10,
  },
  {
    productName: 'Lampu Meja Task Aluminium',
    sku: 'SS-LMP-ALM-WHT',
    name: 'Pure White',
    attributes: {
      color: 'Pure White',
      colorClass: 'bg-[#f8fafc]',
      image_url:
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 85000000,
    stock: 8,
  },
  {
    productName: 'Tatakan Monitor Kayu Walnut',
    sku: 'SS-MNT-STN-WLN',
    name: 'American Walnut',
    attributes: {
      color: 'American Walnut',
      colorClass: 'bg-[#451a03]',
      image_url:
        'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 68000000,
    stock: 12,
  },
  {
    productName: 'Tatakan Monitor Kayu Walnut',
    sku: 'SS-MNT-STN-OAK',
    name: 'White Oak',
    attributes: {
      color: 'White Oak',
      colorClass: 'bg-[#d97706]',
      image_url:
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 68000000,
    stock: 10,
  },
  {
    productName: 'Desk Mat Kulit Vegan Minimalis',
    sku: 'SS-MAT-DSK-BLK',
    name: 'Carbon Black',
    attributes: {
      color: 'Carbon Black',
      colorClass: 'bg-[#18181b]',
      image_url:
        'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 21000000,
    stock: 2,
  },
  {
    productName: 'Desk Mat Kulit Vegan Minimalis',
    sku: 'SS-MAT-DSK-BRN',
    name: 'Cognac Brown',
    attributes: {
      color: 'Cognac Brown',
      colorClass: 'bg-[#78350f]',
      image_url:
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 21000000,
    stock: 1,
  },

  // 3. Rumah & Dapur
  {
    productName: 'Dripper Kopi Keramik Pour-Over V60',
    sku: 'SS-DRP-V60-WHT',
    name: 'Chalk White',
    attributes: {
      color: 'Chalk White',
      colorClass: 'bg-[#f8fafc]',
      image_url:
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 28500000,
    stock: 20,
  },
  {
    productName: 'Dripper Kopi Keramik Pour-Over V60',
    sku: 'SS-DRP-V60-BLK',
    name: 'Matte Black',
    attributes: {
      color: 'Matte Black',
      colorClass: 'bg-[#1c1917]',
      image_url:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 28500000,
    stock: 15,
  },
  {
    productName: 'Gelas Kaca Borosilikat Double-Wall 350ml',
    sku: 'SS-GLS-BWL-350',
    name: 'Clear Borosilicate',
    attributes: {
      color: 'Clear Glass',
      colorClass: 'bg-[#e2e8f0]',
      image_url:
        'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 12500000,
    stock: 40,
  },
  {
    productName: 'Gelas Kaca Borosilikat Double-Wall 350ml',
    sku: 'SS-GLS-BWL-AMB',
    name: 'Warm Amber',
    attributes: {
      color: 'Warm Amber',
      colorClass: 'bg-[#d97706]',
      image_url:
        'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 13500000,
    stock: 20,
  },
  {
    productName: 'Penggiling Kopi Manual Stainless Steel',
    sku: 'SS-GRN-MNL-SLV',
    name: 'Brushed Silver',
    attributes: {
      color: 'Brushed Silver',
      colorClass: 'bg-[#cbd5e1]',
      image_url:
        'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 46000000,
    stock: 12,
  },
  {
    productName: 'Penggiling Kopi Manual Stainless Steel',
    sku: 'SS-GRN-MNL-BLK',
    name: 'Matte Obsidian',
    attributes: {
      color: 'Matte Obsidian',
      colorClass: 'bg-[#1c1917]',
      image_url:
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 46000000,
    stock: 8,
  },
  {
    productName: 'Wadah Biji Kopi Kedap Udara Vakum',
    sku: 'SS-CAN-VKM-BLK',
    name: 'Matte Black',
    attributes: {
      color: 'Matte Black',
      colorClass: 'bg-[#1c1917]',
      image_url:
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 24000000,
    stock: 25,
  },
  {
    productName: 'Wadah Biji Kopi Kedap Udara Vakum',
    sku: 'SS-CAN-VKM-SLV',
    name: 'Stainless Steel',
    attributes: {
      color: 'Stainless Steel',
      colorClass: 'bg-[#cbd5e1]',
      image_url:
        'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 24000000,
    stock: 20,
  },

  // 4. Pakaian & Aksesoris
  {
    productName: 'Dompet Kartu Kulit Nabati Slim',
    sku: 'SS-WLT-VGT-BRN',
    name: 'Cognac Tan',
    attributes: {
      color: 'Cognac Tan',
      colorClass: 'bg-[#92400e]',
      image_url:
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 29500000,
    stock: 18,
  },
  {
    productName: 'Dompet Kartu Kulit Nabati Slim',
    sku: 'SS-WLT-VGT-BLK',
    name: 'Tactical Black',
    attributes: {
      color: 'Tactical Black',
      colorClass: 'bg-[#18181b]',
      image_url:
        'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 29500000,
    stock: 12,
  },
  {
    productName: 'Jam Tangan Lapangan Otomatis Field Watch',
    sku: 'SS-WTC-FLD-OLV',
    name: 'Olive Drab',
    attributes: {
      color: 'Olive Drab',
      colorClass: 'bg-[#3f4e38]',
      image_url:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 185000000,
    stock: 6,
  },
  {
    productName: 'Jam Tangan Lapangan Otomatis Field Watch',
    sku: 'SS-WTC-FLD-BLK',
    name: 'Stealth Black',
    attributes: {
      color: 'Stealth Black',
      colorClass: 'bg-[#18181b]',
      image_url:
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 185000000,
    stock: 4,
  },
  {
    productName: 'Tas Komuter EDC Ballistic',
    sku: 'SS-BAG-EDC-BLK',
    name: 'Tactical Black',
    attributes: {
      color: 'Tactical Black',
      colorClass: 'bg-[#09090b]',
      image_url:
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 112000000,
    stock: 8,
  },
  {
    productName: 'Tas Komuter EDC Ballistic',
    sku: 'SS-BAG-EDC-GRN',
    name: 'Olive Green',
    attributes: {
      color: 'Olive Green',
      colorClass: 'bg-[#3f4e38]',
      image_url:
        'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 112000000,
    stock: 4,
  },
  {
    productName: 'Kaus Katun Organik Heavyweight 240gsm',
    sku: 'SS-TSH-HVY-WHT',
    name: 'Off White',
    attributes: {
      color: 'Off White',
      colorClass: 'bg-[#f4f4f5]',
      image_url:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 19500000,
    stock: 28,
  },
  {
    productName: 'Kaus Katun Organik Heavyweight 240gsm',
    sku: 'SS-TSH-HVY-BLK',
    name: 'Deep Black',
    attributes: {
      color: 'Deep Black',
      colorClass: 'bg-[#18181b]',
      image_url:
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 19500000,
    stock: 22,
  },

  // 5. Alat Tulis & Kerajinan
  {
    productName: 'Jurnal Grid Hardcover Kertas 120gsm',
    sku: 'SS-JRN-GRD-GRN',
    name: 'Forest Green',
    attributes: {
      color: 'Forest Green',
      colorClass: 'bg-[#14532d]',
      image_url:
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 17500000,
    stock: 30,
  },
  {
    productName: 'Jurnal Grid Hardcover Kertas 120gsm',
    sku: 'SS-JRN-GRD-BLK',
    name: 'Stonewashed Black',
    attributes: {
      color: 'Stonewashed Black',
      colorClass: 'bg-[#18181b]',
      image_url:
        'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 17500000,
    stock: 25,
  },
  {
    productName: 'Pena Gel Presisi Titanium',
    sku: 'SS-PEN-TTN-RAW',
    name: 'Raw Titanium',
    attributes: {
      color: 'Raw Titanium',
      colorClass: 'bg-[#71717a]',
      image_url:
        'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 34000000,
    stock: 25,
  },
  {
    productName: 'Pena Gel Presisi Titanium',
    sku: 'SS-PEN-TTN-BLK',
    name: 'DLC Matte Black',
    attributes: {
      color: 'DLC Matte Black',
      colorClass: 'bg-[#18181b]',
      image_url:
        'https://images.unsplash.com/photo-1585336261026-7f417f64243a?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 36000000,
    stock: 20,
  },
  {
    productName: 'Tempat Pensil Kulit Gulung Handcrafted',
    sku: 'SS-PNC-RLL-BRN',
    name: 'Crazy Horse Brown',
    attributes: {
      color: 'Crazy Horse Brown',
      colorClass: 'bg-[#78350f]',
      image_url:
        'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 24000000,
    stock: 15,
  },
  {
    productName: 'Tempat Pensil Kulit Gulung Handcrafted',
    sku: 'SS-PNC-RLL-TAN',
    name: 'Natural Tan',
    attributes: {
      color: 'Natural Tan',
      colorClass: 'bg-[#b45309]',
      image_url:
        'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    },
    price_cents: 24000000,
    stock: 10,
  },
]

export const CURATED_REVIEWS: SeedReviewItem[] = [
  // Keyboard
  {
    productName: 'Keyboard Mekanikal Nirkabel 75%',
    reviewerIndex: 0,
    rating: 5,
    reviewText:
      'Sasis aluminiumnya sangat kokoh dan berat saat ditaruh di meja. Gasket mount-nya bikin suara ketikan empuk dan thock tanpa getaran kopong. Koneksi Bluetooth ke MacBook dan PC mulus berganti.',
  },
  {
    productName: 'Keyboard Mekanikal Nirkabel 75%',
    reviewerIndex: 1,
    rating: 5,
    reviewText:
      'Switch pre-lubed terasa lembut sekali, keycap PBT tahan minyak dan tidak mudah licin. Lampu indikator baterai sangat informatif dan kapasitas 4000mAh awet dipakai 2 minggu.',
  },
  {
    productName: 'Keyboard Mekanikal Nirkabel 75%',
    reviewerIndex: 2,
    rating: 5,
    reviewText:
      'Layout 75 persen pas sekali untuk meja kerja minimalis. Kenop putar volume di sudut kanan atas sangat praktis untuk meeting harian.',
  },

  // Headphone
  {
    productName: 'Headphone Studio ANC',
    reviewerIndex: 0,
    rating: 5,
    reviewText:
      'Peredam bising aktifnya sangat membantu saat bekerja di kafe ramai. Busa telinga empuk dan tidak bikin pegal meski dipakai meeting 3 jam berturut-turut. Karakter suara netral dan vokal sangat jernih.',
  },
  {
    productName: 'Headphone Studio ANC',
    reviewerIndex: 3,
    rating: 5,
    reviewText:
      'Kualitas audio headphone sangat luar biasa detail. Separasi instrumen musik akustik terdengar sangat hidup. Packaging rapi dan dapat hardcase premium.',
  },

  // Mouse
  {
    productName: 'Tetikus Ergonomis Nirkabel Precision',
    reviewerIndex: 1,
    rating: 5,
    reviewText:
      'Sudut ergonomisnya pas di tangan kanan, ketegangan pergelangan tangan berkurang drastis setelah pemakaian seminggu penuh. Roda scroll logam elektromagnetik sangat presisi untuk navigasi spreadsheet panjang.',
  },
  {
    productName: 'Tetikus Ergonomis Nirkabel Precision',
    reviewerIndex: 4,
    rating: 5,
    reviewText:
      'Sensor Darkfield-nya bisa dipakai langsung di atas meja kaca tanpa mousepad tambahan. Daya tahan baterai sangat memuaskan, sudah sebulan belum perlu diisi ulang.',
  },

  // Meja Kerja
  {
    productName: 'Meja Kerja Modular Solid Oak',
    reviewerIndex: 0,
    rating: 5,
    reviewText:
      'Finishing kayu solid oak-nya sangat halus dengan serat alami yang terlihat mewah. Rangka baja sangat stabil tanpa goyangan sama sekali walau menopang dua monitor dan PC berat. Manajemen kabel di kolong meja rapi.',
  },
  {
    productName: 'Meja Kerja Modular Solid Oak',
    reviewerIndex: 2,
    rating: 5,
    reviewText:
      'Meja kokoh, perakitan mudah dipahami dengan instruksi jelas. Ruang kerja jadi terasa lebih luas dan estetik.',
  },

  // Kursi Ergonomis
  {
    productName: 'Kursi Ergonomis Mesh Pro',
    reviewerIndex: 1,
    rating: 5,
    reviewText:
      'Jaring mesh-nya sejuk tidak panas di ruangan ber-AC sedang. Penopang lumbar 3D bisa diatur pas di lekukan tulang belakang bawah, duduk 8 jam kerja tetap nyaman.',
  },
  {
    productName: 'Kursi Ergonomis Mesh Pro',
    reviewerIndex: 3,
    rating: 5,
    reviewText:
      'Mekanisme sinkronisasi sandarannya halus saat direbahkan untuk istirahat sejenak. Gaslift hidrolik class-4 terasa kokoh dan aman.',
  },

  // Dripper Kopi
  {
    productName: 'Dripper Kopi Keramik Pour-Over V60',
    reviewerIndex: 2,
    rating: 5,
    reviewText:
      'Keramik tebal menjaga suhu seduhan air tetap stabil selama proses pour-over. Alur spiralnya mengalirkan air dengan kecepatan yang konsisten. Hasil seduhan bersih dan aroma kopi terekstraksi maksimal.',
  },
  {
    productName: 'Dripper Kopi Keramik Pour-Over V60',
    reviewerIndex: 4,
    rating: 5,
    reviewText:
      'Finishing porselen Arita sangat mulus dan mudah dibersihkan. Warna putihnya estetik bersanding dengan teko leher angsa di meja dapur.',
  },

  // Gelas Borosilikat
  {
    productName: 'Gelas Kaca Borosilikat Double-Wall 350ml',
    reviewerIndex: 0,
    rating: 5,
    reviewText:
      'Kaca dinding ganda benar-benar menahan panas dengan sempurna, dipegang tidak panas dan saat diisi es batu tidak ada embun kondensasi di meja kerja.',
  },
  {
    productName: 'Gelas Kaca Borosilikat Double-Wall 350ml',
    reviewerIndex: 1,
    rating: 5,
    reviewText:
      'Bobotnya ringan namun kacanya cukup kokoh. Bentuknya minimalis dan nyaman digenggam saat menikmati kopi seduh pagi.',
  },

  // Dompet Kartu
  {
    productName: 'Dompet Kartu Kulit Nabati Slim',
    reviewerIndex: 3,
    rating: 5,
    reviewText:
      'Kulit nabatinya beraroma alami dan jahitannya rapi sekali. Muat 6 kartu utama dan beberapa lembar uang darurat tanpa membuat kantong celana menggembung.',
  },
  {
    productName: 'Dompet Kartu Kulit Nabati Slim',
    reviewerIndex: 4,
    rating: 5,
    reviewText:
      'Slot kartu presisi dan kartu tidak mudah tergelincir keluar. Setelah sebulan pemakaian, warna kulitnya mulai membentuk patina alami yang cantik.',
  },

  // Jam Tangan
  {
    productName: 'Jam Tangan Lapangan Otomatis Field Watch',
    reviewerIndex: 0,
    rating: 5,
    reviewText:
      'Kaca kristal safirnya benar-benar tahan gores dan jarum superluminova terbaca jelas di kondisi gelap. Akurasi movement otomatisnya sangat baik untuk pemakaian harian.',
  },
  {
    productName: 'Jam Tangan Lapangan Otomatis Field Watch',
    reviewerIndex: 2,
    rating: 5,
    reviewText:
      'Diameter 38mm sangat proporsional di pergelangan tangan. Tali strap kanvasnya kuat, cepat kering saat terkena air hujan, dan gesper kuningan terasa premium.',
  },

  // Jurnal Grid
  {
    productName: 'Jurnal Grid Hardcover Kertas 120gsm',
    reviewerIndex: 1,
    rating: 5,
    reviewText:
      'Kertas 120gsm sangat tebal, saya tes dengan pena fountain pen tinta basah sama sekali tidak tembus (no bleed-through). Jilid sampul kainnya estetik dan rapi.',
  },
  {
    productName: 'Jurnal Grid Hardcover Kertas 120gsm',
    reviewerIndex: 4,
    rating: 5,
    reviewText:
      'Titik dot grid 5mm samar dan nyaman untuk menggambar wireframe sketsa maupun mencatat to-do list harian. Pita pembatasnya berkualitas.',
  },
]
