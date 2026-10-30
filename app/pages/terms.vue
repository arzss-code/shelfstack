<script setup lang="ts">
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiCard from '~/components/ui/UiCard.vue'

try {
  useSeoMeta({
    title: 'Syarat & Ketentuan - ShelfStack',
    description: 'Ketentuan hukum dan kesepakatan penggunaan platform e-commerce ShelfStack.',
  })
} catch {
  // Fallback aman untuk lingkungan unit test tanpa instance NuxtApp
}

interface TermClause {
  number: string
  title: string
  lead: string
  points: {
    label: string
    text: string
  }[]
}

const clauses: TermClause[] = [
  {
    number: '01',
    title: 'Ketentuan Umum & Definisi Akun',
    lead: 'Ketentuan dasar keanggotaan dan hak akses pengguna pada platform kurasi tunggal ShelfStack.',
    points: [
      {
        label: 'Platform Kurasi Tunggal',
        text: 'ShelfStack beroperasi sebagai platform e-commerce dengan sistem single-vendor curated storefront. Seluruh produk yang dipajang dikurasi, diuji kelayakannya, dan didistribusikan secara terpusat untuk menjamin konsistensi mutu.',
      },
      {
        label: 'Persyaratan Usia & Kelayakan',
        text: 'Pengguna platform wajib berusia minimal 18 tahun atau telah cakap hukum menurut peraturan perundang-undangan. Pengguna di bawah usia 18 tahun wajib menggunakan layanan di bawah bimbingan dan persetujuan orang tua atau wali sah.',
      },
      {
        label: 'Integritas & Kerahasiaan Akun',
        text: 'Pengguna berkewajiban menjaga kerahasiaan kredensial autentikasi, kata sandi, dan data akun pribadi. Segala aktivitas transaksi yang terjadi melalui akun pengguna menjadi tanggung jawab penuh dari pemilik akun bersangkutan.',
      },
    ],
  },
  {
    number: '02',
    title: 'Pemesanan & Transaksi Pembayaran',
    lead: 'Mekanisme pemesanan, integrasi payment gateway Midtrans Snap, penguncian stok, dan keabsahan harga.',
    points: [
      {
        label: 'Gerbang Pembayaran Midtrans Snap',
        text: 'Seluruh transaksi pembayaran diproses melalui payment gateway resmi Midtrans Snap berstandar PCI-DSS Level 1, mendukung pembayaran Virtual Account bank nasional, QRIS instan, serta Kartu Kredit/Debit dengan protokol 3D Secure.',
      },
      {
        label: 'Mekanisme Penguncian Stok',
        text: 'Saat pesanan berhasil dibuat, sistem secara otomatis melakukan penguncian stok barang selama jendela waktu pembayaran berlaku. Apabila pembayaran tidak diselesaikan tepat waktu, pesanan dinyatakan kedaluwarsa dan alokasi stok segera dilepas kembali ke inventaris publik.',
      },
      {
        label: 'Keabsahan Harga & Koreksi Teknis',
        text: 'Semua harga yang ditampilkan menggunakan mata uang Rupiah (IDR) dan telah mencakup pajak yang berlaku. Dalam kasus anomali teknis berupa kesalahan pencantuman harga yang nyata (obvious pricing glitch), ShelfStack berhak membatalkan transaksi dengan melakukan pengembalian dana 100% penuh kepada pembeli.',
      },
    ],
  },
  {
    number: '03',
    title: 'Kupon Promo & Pembatasan Kuota',
    lead: 'Aturan pemanfaatan voucher diskon, potongan harga, dan ketentuan pembatasan kuota promosi.',
    points: [
      {
        label: 'Pembatasan Kuota & Masa Berlaku',
        text: 'Setiap kupon promo memiliki limitasi kuota penukaran, pembatasan kuota penggunaan per akun pengguna, serta periode masa berlaku yang ditetapkan dan diverifikasi langsung oleh sistem basis data.',
      },
      {
        label: 'Ketentuan Penggunaan & Penggabungan',
        text: 'Kupon promo tidak dapat ditukar menjadi uang tunai, dipindahtangankan, atau digabungkan dengan kode promosi lainnya, kecuali dinyatakan sebaliknya secara tegas dalam syarat khusus promosi bersangkutan.',
      },
      {
        label: 'Tindakan atas Penyalahgunaan',
        text: 'ShelfStack berhak membatalkan pesanan, mendiskualifikasi kupon, atau menonaktifkan akun jika terindikasi adanya kecurangan, pendaftaran akun ganda terorganisir, atau upaya manipulasi kuota promo.',
      },
    ],
  },
  {
    number: '04',
    title: 'Pengiriman & Risiko Kehilangan',
    lead: 'Pengelolaan ekspedisi logistik, tanggung jawab ekspedisi & asuransi barang transit, dan kewajiban inspeksi pembeli.',
    points: [
      {
        label: 'Tanggung Jawab Ekspedisi & Asuransi',
        text: 'ShelfStack bekerjasama dengan mitra ekspedisi logistik resmi (JNE, SiCepat, J&T). Seluruh kiriman bernilai tinggi dilindungi oleh skema asuransi pengiriman untuk menutupi risiko kehilangan atau kerusakan selama penanganan ekspedisi logistik.',
      },
      {
        label: 'Estimasi Pengantaran & Jadwal Kurir',
        text: 'Estimasi durasi pengiriman bervariasi bergantung pada lokasi tujuan dan jenis layanan ekspedisi yang dipilih pelanggan. Keterlambatan akibat kendala operasional kurir di luar kendali wajar akan dikoordinasikan secara transparan.',
      },
      {
        label: 'Kewajiban Video Unboxing',
        text: 'Sebagai syarat mutlak pengajuan klaim asuransi pengiriman atau retur barang cacat saat tiba, pelanggan wajib membuat rekaman video unboxing utuh tanpa putus dan tanpa jeda saat membuka kemasan paket kiriman pertama kali.',
      },
    ],
  },
  {
    number: '05',
    title: 'Garansi & Batasan Tanggung Jawab',
    lead: 'Cakupan jaminan mutu purnajual, klaim kerusakan pabrik, dan batas tanggung jawab hukum platform.',
    points: [
      {
        label: 'Cakupan Garansi Resmi',
        text: 'Produk yang dipasarkan ShelfStack dilindungi oleh garansi resmi (hingga 2 tahun untuk perangkat meja dan periferal audio terpilih). Garansi mencakup kerusakan cacat pabrik (factory defect) dan malfungsi perangkat normal.',
      },
      {
        label: 'Pengecualian Klaim Garansi',
        text: 'Garansi tidak mencakup kerusakan fisik akibat kelalaian pemakaian pribadi, korosi cairan, bencana alam, modifikasi sirkuit, atau perbaikan tidak resmi di luar instruksi layanan servis ShelfStack.',
      },
      {
        label: 'Batas Tanggung Jawab Finansial',
        text: 'Sejauh diizinkan oleh peraturan perundang-undangan, batasan tanggung jawab finansial total ShelfStack atas segala klaim yang berhubungan dengan transaksi dibatasi maksimal sebesar nilai nominal yang telah dibayarkan oleh pembeli pada pesanan terkait.',
      },
    ],
  },
  {
    number: '06',
    title: 'Hak Kekayaan Intelektual & Hukum yang Berlaku',
    lead: 'Perlindungan hak cipta karya cipta visual serta yurisdiksi penyelesaian sengketa hukum.',
    points: [
      {
        label: 'Hak Kekayaan Intelektual',
        text: 'Seluruh materi visual, logo grafis, karya tipografi, dokumentasi fotografi kurasi, kode antarmuka, dan teks editorial pada platform ini adalah hak kekayaan intelektual milik ShelfStack dan dilindungi oleh undang-undang hak cipta.',
      },
      {
        label: 'Hukum Republik Indonesia',
        text: 'Syarat dan ketentuan ini tunduk, diatur, dan ditafsirkan secara menyeluruh menurut ketentuan hukum Republik Indonesia.',
      },
      {
        label: 'Penyelesaian Sengketa',
        text: 'Setiap sengketa atau perselisihan yang timbul dari pelaksanaan kesepakatan ini akan diselesaikan terlebih dahulu melalui musyawarah untuk mencapai mufakat. Jika musyawarah tidak menghasilkan penyelesaian dalam 30 hari kalender, para pihak sepakat memilih domisili hukum di Pengadilan Negeri Jakarta Selatan.',
      },
    ],
  },
]
</script>

<template>
  <div class="py-4 sm:py-8">
    <!-- Breadcrumb -->
    <nav class="mb-8 flex items-center gap-2 text-xs text-brand-muted" aria-label="Breadcrumb">
      <NuxtLink to="/" class="no-underline transition-colors hover:text-brand-ink">
        Beranda
      </NuxtLink>
      <span class="text-brand-hair">/</span>
      <span class="font-semibold text-brand-ink">Syarat &amp; Ketentuan</span>
    </nav>

    <!-- Header / Hero Section -->
    <header class="mb-12 max-w-4xl sm:mb-16">
      <div class="mb-4 inline-flex items-center gap-2">
        <UiBadge label="Dokumen Hukum" variant="info" />
        <span class="text-xs font-medium text-brand-muted">Pembaruan Resmi · Versi 1.4</span>
      </div>
      <h1
        class="mb-4 font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl lg:text-5xl"
      >
        Syarat &amp; Ketentuan Layanan
      </h1>
      <p class="font-body text-base leading-relaxed text-brand-muted sm:text-lg">
        Ketentuan hukum dan kesepakatan penggunaan platform e-commerce ShelfStack
      </p>
      <div class="mt-4 flex items-center gap-3 text-xs text-brand-muted">
        <span>Berlaku efektif sejak: 30 Oktober 2026</span>
        <span class="h-1 w-1 rounded-full bg-brand-hair" />
        <span>Yurisdiksi: Republik Indonesia</span>
      </div>
    </header>

    <!-- Clauses List -->
    <div class="mb-16 space-y-6 sm:space-y-8">
      <UiCard
        v-for="clause in clauses"
        :key="clause.number"
        :padded="true"
        class="border-brand-hair"
      >
        <div class="mb-5 flex flex-wrap items-center gap-3 pb-4 border-b border-brand-hairsoft">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-canvas-soft text-xs font-bold text-brand-ink"
          >
            {{ clause.number }}
          </span>
          <h2 class="font-display text-lg font-bold text-brand-ink sm:text-xl">
            {{ clause.title }}
          </h2>
        </div>
        <p class="mb-6 text-sm text-brand-muted leading-relaxed">
          {{ clause.lead }}
        </p>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            v-for="(point, idx) in clause.points"
            :key="idx"
            class="rounded-xl border border-brand-hairsoft bg-brand-canvas-soft/40 p-4 transition-colors hover:bg-brand-canvas-soft/70"
          >
            <h3
              class="mb-1.5 font-display text-xs font-semibold uppercase tracking-wider text-brand-ink"
            >
              {{ point.label }}
            </h3>
            <p class="text-xs leading-relaxed text-brand-muted">
              {{ point.text }}
            </p>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Quick Contact Footer Banner -->
    <section class="mt-12">
      <UiCard :padded="true" class="border-brand-hair bg-white">
        <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div class="max-w-xl">
            <div class="mb-2 inline-flex items-center gap-2">
              <UiBadge label="Bantuan Legalitas" variant="default" />
            </div>
            <h2 class="font-display text-xl font-bold text-brand-ink sm:text-2xl">
              Pertanyaan seputar Syarat &amp; Ketentuan?
            </h2>
            <p class="mt-2 text-sm leading-relaxed text-brand-muted">
              Tim kepatuhan dan layanan pelanggan kami siap membantu Anda memahami klausul layanan,
              prosedur klaim garansi, atau menyelesaikan kendala transaksi.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <UiButton to="/contact" variant="primary" size="md"> Hubungi Kami </UiButton>
            <UiButton to="/help" variant="outline" size="md"> Pusat Bantuan </UiButton>
          </div>
        </div>
      </UiCard>
    </section>
  </div>
</template>
