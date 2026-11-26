import type { DemoReviewer, SeedReviewItem } from './types'

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
