<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { UiTabItem } from '~/components/ui/UiTabs.vue'

useSeoMeta({
  title: 'Pusat Bantuan & Kebijakan - ShelfStack',
  description:
    'Temukan panduan lengkap pemesanan, pembayaran Midtrans, kurir logistik, ketentuan garansi 2 tahun, dan kebijakan retur di ShelfStack.',
})

export interface FaqItem {
  id: string
  category: 'pemesanan' | 'pembayaran' | 'pengiriman' | 'garansi' | 'pengembalian'
  categoryLabel: string
  question: string
  answer: string
  actionLink?: {
    text: string
    to: string
  }
}

const faqs: FaqItem[] = [
  // Pemesanan
  {
    id: 'order-how-to-buy',
    category: 'pemesanan',
    categoryLabel: 'Pemesanan',
    question: 'Bagaimana cara berbelanja dan melakukan pemesanan di ShelfStack?',
    answer:
      'Pilih produk kurasi yang Anda inginkan dari katalog, tentukan opsi varian serta kuantitas, kemudian klik tombol "Tambah ke Bag". Buka keranjang belanja Anda untuk meninjau pesanan, lalu klik "Lanjut ke Pembayaran". Lengkapi alamat pengiriman, pilih jasa kurir yang diinginkan, dan selesaikan transaksi pembayaran.',
  },
  {
    id: 'order-cancellation',
    category: 'pemesanan',
    categoryLabel: 'Pemesanan',
    question: 'Bisakah saya membatalkan pesanan yang telah dibuat?',
    answer:
      'Pesanan yang masih berstatus "Menunggu Pembayaran" dapat dibatalkan langsung melalui menu detail pesanan. Namun untuk pesanan yang sudah lunas dan masuk tahap proses pengemasan, pembatalan mandiri tidak dapat dilakukan. Segera hubungi customer care kami sebelum nomor resi pengiriman diterbitkan.',
    actionLink: {
      text: 'Hubungi Customer Care',
      to: '/contact',
    },
  },
  {
    id: 'order-account-status',
    category: 'pemesanan',
    categoryLabel: 'Pemesanan',
    question: 'Bagaimana cara memeriksa status akun dan riwayat transaksi saya?',
    answer:
      'Anda dapat memantau riwayat transaksi dan melacak status pesanan secara lengkap melalui menu Akun > Pesanan Saya. Setiap pembaruan status akan dikirimkan otomatis melalui notifikasi akun dan email terdaftar.',
    actionLink: {
      text: 'Buka Halaman Pesanan Saya',
      to: '/orders',
    },
  },

  // Pembayaran
  {
    id: 'payment-midtrans-methods',
    category: 'pembayaran',
    categoryLabel: 'Pembayaran',
    question: 'Apa saja metode pembayaran yang didukung via Midtrans?',
    answer:
      'ShelfStack terintegrasi langsung dengan payment gateway Midtrans. Kami menerima Virtual Account (BCA, Mandiri, BNI, BRI, Permata), QRIS (GoPay, OVO, DANA, LinkAja, ShopeePay), serta Kartu Kredit dan Debit berlogo Visa dan Mastercard dengan proteksi 3D Secure.',
  },
  {
    id: 'payment-auto-verification',
    category: 'pembayaran',
    categoryLabel: 'Pembayaran',
    question: 'Apakah verifikasi konfirmasi pembayaran berlangsung otomatis?',
    answer:
      'Ya, verifikasi pembayaran terhubung langsung melalui webhook server Midtrans secara instan. Anda tidak perlu mengunggah bukti transfer manual. Status pesanan akan otomatis berubah menjadi "Dibayar" dalam hitungan detik setelah transaksi berhasil.',
  },
  {
    id: 'payment-expiry-window',
    category: 'pembayaran',
    categoryLabel: 'Pembayaran',
    question: 'Berapa batas waktu pelunasan pembayaran transaksi?',
    answer:
      'Batas waktu penyelesaian pembayaran Virtual Account dan QRIS adalah 24 jam sejak faktur diterbitkan. Apabila pembayaran tidak diselesaikan dalam jendela waktu tersebut, pesanan akan kedaluwarsa dan dibatalkan otomatis oleh sistem untuk membebaskan kuota stok produk.',
  },

  // Pengiriman
  {
    id: 'shipping-estimate-arrival',
    category: 'pengiriman',
    categoryLabel: 'Pengiriman',
    question: 'Berapa lama estimasi waktu pengiriman pesanan hingga tiba?',
    answer:
      'Estimasi pengiriman untuk area Jabodetabek adalah 1-2 hari kerja. Wilayah pulau Jawa lainnya berkisar 2-3 hari kerja, sedangkan luar Pulau Jawa berkisar 3-6 hari kerja tergantung pada zona logistik tujuan dan jenis layanan kurir yang Anda pilih saat checkout.',
  },
  {
    id: 'shipping-official-couriers',
    category: 'pengiriman',
    categoryLabel: 'Pengiriman',
    question: 'Ekspedisi kurir resmi apa saja yang bekerja sama dengan ShelfStack?',
    answer:
      'Kami bekerja sama secara resmi dengan tiga ekspedisi terpercaya di Indonesia: JNE (Reguler dan YES), SiCepat Express (BEST dan Reguler), serta J&T Express. Seluruh paket dikemas dengan standar proteksi kurasi ShelfStack dan asuransi pengiriman penuh.',
  },
  {
    id: 'shipping-tracking-number',
    category: 'pengiriman',
    categoryLabel: 'Pengiriman',
    question: 'Bagaimana cara memeriksa status nomor resi pengiriman paket?',
    answer:
      'Nomor resi resmi diterbitkan otomatis setelah paket diserahkan kepada pihak kurir ekspedisi. Kunjungi halaman Lacak Pesanan untuk mengecek linimasa perjalanan paket Anda secara real-time tanpa perlu membuka situs kurir eksternal.',
    actionLink: {
      text: 'Lacak Pengiriman Pesanan',
      to: '/tracking',
    },
  },

  // Garansi
  {
    id: 'warranty-two-years-terms',
    category: 'garansi',
    categoryLabel: 'Garansi',
    question: 'Bagaimana ketentuan garansi resmi 2 tahun di ShelfStack?',
    answer:
      'Seluruh koleksi produk esensial dan perlengkapan di ShelfStack dilindungi jaminan garansi resmi selama 2 tahun sejak tanggal penerimaan produk. Garansi mencakup biaya perbaikan fungsional dan penggantian suku cadang asli jika produk mengalami kendala operasional non-pemakaian.',
  },
  {
    id: 'warranty-claim-defects',
    category: 'garansi',
    categoryLabel: 'Garansi',
    question: 'Apa saja syarat untuk mengajukan klaim garansi cacat produksi?',
    answer:
      'Syarat klaim meliputi: (1) Invoice digital atau nomor pesanan resmi ShelfStack, (2) Bukti rekaman video kendala fungsi teknis produk, serta (3) Unit produk lengkap beserta kemasan asli dan aksesoris bawaan. Garansi tidak menanggung kerusakan akibat kelalaian pribadi, benturan fisik, atau rembesan cairan pada unit non-waterproof.',
  },
  {
    id: 'warranty-inspection-period',
    category: 'garansi',
    categoryLabel: 'Garansi',
    question: 'Berapa lama proses inspeksi dan penanganan klaim garansi?',
    answer:
      'Pemeriksaan teknis di Service Center membutuhkan waktu 2-4 hari kerja setelah produk tiba. Unit pengganti baru atau unit yang selesai diservis akan dikirimkan kembali ke alamat Anda tanpa biaya pengiriman tambahan untuk klaim yang memenuhi validasi.',
  },

  // Pengembalian
  {
    id: 'return-policy-seven-days',
    category: 'pengembalian',
    categoryLabel: 'Pengembalian',
    question: 'Bagaimana kebijakan retur produk 7 hari di ShelfStack?',
    answer:
      'Kami menyediakan jaminan kepuasan belanja dengan kebijakan pengembalian barang dalam kurun waktu 7 hari kalender terhitung sejak barang diterima. Fasilitas ini berlaku untuk kendala produk cacat bawaan, salah pengiriman varian, atau ketidaksesuaian spesifikasi katalog.',
  },
  {
    id: 'return-item-condition',
    category: 'pengembalian',
    categoryLabel: 'Pengembalian',
    question: 'Apa syarat kondisi fisik barang yang dapat diajukan untuk retur?',
    answer:
      'Barang harus dalam kondisi baru, belum digunakan untuk aktivitas harian berat, segel resmi pabrik utuh, serta lengkap dengan dus kemasan asli dan buku panduan manual. Kami mewajibkan rekaman video saat membuka paket (unboxing) sebagai bukti pendukung klaim.',
  },
  {
    id: 'return-refund-workflow',
    category: 'pengembalian',
    categoryLabel: 'Pengembalian',
    question: 'Bagaimana alur dan jangka waktu proses pengembalian dana (refund)?',
    answer:
      'Setelah paket retur tiba di gudang dan lolos inspeksi kualitas, proses refund diproses dalam 1-3 hari kerja. Dana transaksi VA dan QRIS dikembalikan ke rekening bank atau saldo e-wallet Anda, sedangkan transaksi Kartu Kredit dikreditkan kembali ke limit kartu sesuai siklus penagihan bank penerbit (5-14 hari kerja).',
    actionLink: {
      text: 'Ajukan Pengembalian via Kontak',
      to: '/contact',
    },
  },
]

const route = useRoute()

const searchQuery = ref('')
const selectedCategory = ref<string>('all')
const openItemIds = ref<string[]>([])

const categoryTabs = computed<UiTabItem[]>(() => [
  { value: 'all', label: 'Semua', count: faqs.length },
  {
    value: 'pemesanan',
    label: 'Pemesanan',
    count: faqs.filter((f) => f.category === 'pemesanan').length,
  },
  {
    value: 'pembayaran',
    label: 'Pembayaran',
    count: faqs.filter((f) => f.category === 'pembayaran').length,
  },
  {
    value: 'pengiriman',
    label: 'Pengiriman',
    count: faqs.filter((f) => f.category === 'pengiriman').length,
  },
  {
    value: 'garansi',
    label: 'Garansi',
    count: faqs.filter((f) => f.category === 'garansi').length,
  },
  {
    value: 'pengembalian',
    label: 'Pengembalian',
    count: faqs.filter((f) => f.category === 'pengembalian').length,
  },
])

const validCategories = ['pemesanan', 'pembayaran', 'pengiriman', 'garansi', 'pengembalian']

const syncCategoryFromHash = () => {
  const hash = route?.hash ? route.hash.replace(/^#/, '').toLowerCase().trim() : ''
  if (!hash) return

  if (hash === 'semua' || hash === 'all') {
    selectedCategory.value = 'all'
  } else if (validCategories.includes(hash)) {
    selectedCategory.value = hash
  }
}

onMounted(() => {
  syncCategoryFromHash()
})

watch(
  () => route?.hash,
  () => {
    syncCategoryFromHash()
  },
)

watch(selectedCategory, (newCat) => {
  if (typeof window !== 'undefined' && window.location) {
    try {
      const targetHash = newCat === 'all' ? '' : `#${newCat}`
      if (window.location.hash !== targetHash) {
        if (targetHash) {
          window.history.replaceState(null, '', `${window.location.pathname}${targetHash}`)
        } else {
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
    } catch {
      // Abaikan jika lingkungan eksekusi membatasi replaceState
    }
  }
})

const filteredFaqs = computed(() => {
  let list = faqs
  if (selectedCategory.value !== 'all') {
    list = list.filter((item) => item.category === selectedCategory.value)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return list

  return list.filter(
    (item) =>
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.categoryLabel.toLowerCase().includes(query),
  )
})

const isOpen = (id: string) => openItemIds.value.includes(id)

const toggleItem = (id: string) => {
  const index = openItemIds.value.indexOf(id)
  if (index > -1) {
    openItemIds.value.splice(index, 1)
  } else {
    openItemIds.value.push(id)
  }
}

const expandAll = () => {
  openItemIds.value = filteredFaqs.value.map((item) => item.id)
}

const collapseAll = () => {
  openItemIds.value = []
}

const resetSearch = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
}

const getBadgeVariant = (
  category: string,
): 'default' | 'info' | 'warning' | 'success' | 'danger' => {
  switch (category) {
    case 'pembayaran':
      return 'info'
    case 'pengiriman':
      return 'warning'
    case 'garansi':
      return 'success'
    case 'pengembalian':
      return 'danger'
    case 'pemesanan':
    default:
      return 'default'
  }
}
</script>

<template>
  <div class="min-h-screen bg-brand-canvas-soft/40 py-8 sm:py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-brand-muted mb-6" aria-label="Breadcrumb">
        <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline">
          Beranda
        </NuxtLink>
        <span class="text-brand-hair">/</span>
        <span class="text-brand-ink font-semibold">Pusat Bantuan</span>
      </nav>

      <!-- Hero Header Section -->
      <header class="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div class="inline-flex mb-3">
          <UiBadge label="Pusat Bantuan & Kebijakan" variant="info" />
        </div>
        <h1 class="font-display text-2xl sm:text-4xl font-bold text-brand-ink tracking-tight m-0">
          Ada yang Bisa Kami Bantu?
        </h1>
        <p class="text-xs sm:text-sm text-brand-muted mt-2 m-0 leading-relaxed">
          Temukan panduan lengkap seputar pemesanan, pembayaran Midtrans, kurir logistik, klaim
          garansi 2 tahun, dan ketentuan retur produk.
        </p>

        <!-- Search Bar -->
        <div class="mt-6 max-w-xl mx-auto">
          <UiInput
            v-model="searchQuery"
            placeholder="Cari kendala atau topik bantuan (contoh: resi, QRIS, retur)..."
            left-icon="pi-search"
            size="md"
            data-testid="help-search-input"
            aria-label="Cari topik bantuan"
          />
        </div>
      </header>

      <!-- Category Tabs Navigation -->
      <section class="mb-6 sm:mb-8" aria-label="Kategori Bantuan">
        <div class="overflow-x-auto pb-1 [scrollbar-width:none]">
          <UiTabs
            v-model="selectedCategory"
            :items="categoryTabs"
            aria-label="Kategori Pertanyaan"
            full-width
          />
        </div>
      </section>

      <!-- Results Count Bar & Controls -->
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs text-brand-muted">
        <div class="flex items-center gap-1.5">
          <span v-if="searchQuery">
            Hasil pencarian "<strong class="text-brand-ink">{{ searchQuery }}</strong
            >":
          </span>
          <span class="font-medium text-brand-ink"
            >{{ filteredFaqs.length }} pertanyaan ditampilkan</span
          >
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="searchQuery"
            type="button"
            class="text-brand-ink hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold"
            data-testid="btn-reset-search"
            @click="resetSearch"
          >
            Reset Pencarian
          </button>
          <div v-if="filteredFaqs.length > 0" class="flex items-center gap-2">
            <button
              type="button"
              class="text-brand-muted hover:text-brand-ink cursor-pointer bg-transparent border-0 p-0 text-xs transition-colors"
              data-testid="btn-expand-all"
              @click="expandAll"
            >
              Buka Semua
            </button>
            <span class="text-brand-hair">|</span>
            <button
              type="button"
              class="text-brand-muted hover:text-brand-ink cursor-pointer bg-transparent border-0 p-0 text-xs transition-colors"
              data-testid="btn-collapse-all"
              @click="collapseAll"
            >
              Tutup Semua
            </button>
          </div>
        </div>
      </div>

      <!-- FAQ Accordion List -->
      <div v-if="filteredFaqs.length > 0" class="space-y-3" role="list">
        <article
          v-for="item in filteredFaqs"
          :key="item.id"
          class="bg-white border border-brand-hair rounded-card overflow-hidden transition-colors shadow-whisper"
          :class="{ 'border-brand-ink/40': isOpen(item.id) }"
          data-testid="faq-item"
          :data-category="item.category"
          role="listitem"
        >
          <button
            :id="`faq-btn-${item.id}`"
            type="button"
            class="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 cursor-pointer bg-transparent border-0 focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:outline-none transition-colors select-none"
            :aria-expanded="isOpen(item.id)"
            :aria-controls="`faq-panel-${item.id}`"
            data-testid="faq-toggle-button"
            @click="toggleItem(item.id)"
          >
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-left">
              <span class="self-start sm:self-center">
                <UiBadge :label="item.categoryLabel" :variant="getBadgeVariant(item.category)" />
              </span>
              <h2
                class="font-display font-semibold text-brand-ink text-sm sm:text-base m-0 leading-snug"
              >
                {{ item.question }}
              </h2>
            </div>
            <span
              class="w-7 h-7 rounded-full bg-brand-canvas-soft text-brand-muted flex items-center justify-center shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180 bg-brand-ink text-white': isOpen(item.id) }"
              aria-hidden="true"
            >
              <i class="pi pi-chevron-down text-xs" />
            </span>
          </button>

          <div
            v-show="isOpen(item.id)"
            :id="`faq-panel-${item.id}`"
            role="region"
            :aria-labelledby="`faq-btn-${item.id}`"
            class="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-brand-ink-soft leading-relaxed border-t border-brand-hair/60 pt-3"
            data-testid="faq-answer-panel"
          >
            <p class="m-0 leading-relaxed">{{ item.answer }}</p>
            <div v-if="item.actionLink" class="mt-3.5 pt-2 border-t border-brand-hair/40">
              <NuxtLink
                :to="item.actionLink.to"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:underline no-underline"
              >
                <span>{{ item.actionLink.text }}</span>
                <i class="pi pi-arrow-right text-[10px]" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </article>
      </div>

      <!-- Empty State -->
      <div v-else class="my-6">
        <UiEmptyState
          icon="pi-search"
          title="Pertanyaan Tidak Ditemukan"
          :description="`Tidak ada jawaban yang sesuai dengan pencarian '${searchQuery}'. Coba gunakan kata kunci lain atau tampilkan seluruh kategori.`"
          action-label="Reset Filter & Tampilkan Semua"
          @action="resetSearch"
        />
      </div>

      <!-- Quick Support Banner -->
      <footer
        class="mt-12 sm:mt-16 bg-white border border-brand-hair rounded-card p-6 sm:p-8 text-center shadow-whisper"
      >
        <div
          class="w-12 h-12 rounded-full bg-brand-canvas-soft text-brand-ink flex items-center justify-center mx-auto mb-3"
        >
          <i class="pi pi-question-circle text-xl" aria-hidden="true" />
        </div>
        <h2 class="font-display text-lg sm:text-xl font-bold text-brand-ink m-0 tracking-tight">
          Masih Butuh Bantuan?
        </h2>
        <p class="text-xs sm:text-sm text-brand-muted mt-1.5 max-w-md mx-auto m-0 leading-relaxed">
          Tim customer care kami siap mendampingi kebutuhan transaksi Anda setiap hari kerja pukul
          09.00 - 18.00 WIB.
        </p>
        <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
          <UiButton to="/contact" variant="primary" icon="pi pi-envelope" data-testid="btn-contact">
            Hubungi Kami
          </UiButton>
          <UiButton
            to="/tracking"
            variant="outline"
            icon="pi pi-compass"
            data-testid="btn-tracking"
          >
            Lacak Pesanan
          </UiButton>
        </div>
      </footer>
    </div>
  </div>
</template>
