<script setup lang="ts">
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiCard from '~/components/ui/UiCard.vue'

try {
  useSeoMeta({
    title: 'Kebijakan Privasi - ShelfStack',
    description: 'Komitmen transparansi dan keamanan privasi data pengguna ShelfStack.',
  })
} catch {
  // Fallback aman untuk lingkungan unit test tanpa instance NuxtApp
}

interface PrivacySection {
  number: string
  title: string
  lead: string
  points: {
    label: string
    text: string
  }[]
}

const sections: PrivacySection[] = [
  {
    number: '01',
    title: 'Informasi yang Kami Kumpulkan',
    lead: 'Informasi identitas dan rincian transaksi yang dikumpulkan secara transparan saat Anda mengakses layanan ShelfStack.',
    points: [
      {
        label: 'Data Profil Pengguna',
        text: 'Informasi profil mencakup data profil seperti nama lengkap, alamat email terverifikasi, nomor telepon aktif, dan kredensial akun yang Anda berikan saat melakukan pendaftaran.',
      },
      {
        label: 'Alamat Pengiriman',
        text: 'Data alamat pengiriman meliputi rincian nama penerima, jalan, nomor bangunan, kelurahan, kecamatan, kota/kabupaten, provinsi, kode pos, serta nomor kontak darurat penerima paket.',
      },
      {
        label: 'Riwayat Pesanan',
        text: 'Catatan riwayat pesanan mencakup daftar produk kurasi yang dibeli, nomor faktur pesanan, riwayat tanggal transaksi, status pembayaran, serta rincian logistik pengantaran kurir.',
      },
    ],
  },
  {
    number: '02',
    title: 'Penggunaan Informasi',
    lead: 'Cara kami mengolah data pengguna untuk menghadirkan pengalaman belanja presisi, aman, dan tanpa kendala.',
    points: [
      {
        label: 'Pemrosesan Pesanan',
        text: 'Data digunakan untuk pemrosesan pesanan secara menyeluruh, mengamankan alokasi stok gudang, menerbitkan faktur transaksi resmi, serta memvalidasi status pelunasan pembayaran.',
      },
      {
        label: 'Notifikasi Transaksi',
        text: 'Mengirimkan notifikasi transaksi real-time seputar konfirmasi pembayaran Midtrans, nomor resi pelacakan kurir logistik, dan pembaruan esensial mengenai keamanan akun.',
      },
      {
        label: 'Pengiriman Kurir',
        text: 'Mengkoordinasikan proses pengiriman kurir dengan meneruskan rincian alamat dan kontak penerima kepada mitra logistik berlisensi (JNE, SiCepat, J&T) demi ketepatan pengantaran.',
      },
    ],
  },
  {
    number: '03',
    title: 'Keamanan & Enkripsi Data',
    lead: 'Arsitektur proteksi data berlapis untuk menjaga integritas dan kerahasiaan informasi pengguna dari akses tidak sah.',
    points: [
      {
        label: 'PostgreSQL Row-Level Security',
        text: 'Penerapan PostgreSQL Row-Level Security (RLS) pada basis data Supabase kami memastikan setiap baris data pengguna terisolasi secara ketat dan hanya dapat diakses oleh pemilik akun sah.',
      },
      {
        label: 'Otentikasi JWT Supabase',
        text: 'Pengelolaan sesi masuk memanfaatkan otentikasi JWT Supabase (JSON Web Token) dengan transmisi data terenkripsi SSL/TLS 256-bit standar perbankan untuk mencegah manipulasi sesi.',
      },
      {
        label: 'Gerbang Pembayaran Terenkripsi',
        text: 'Transaksi finansial dikelola melalui gerbang pembayaran terenkripsi Midtrans Snap bersertifikasi PCI-DSS Level 1. ShelfStack tidak pernah menyimpan rincian nomor kartu kredit mentah atau kode CVV.',
      },
    ],
  },
  {
    number: '04',
    title: 'Hak Pengguna atas Data Pribadi',
    lead: 'Wewenang penuh pengguna untuk mengontrol, memperbarui, atau menghapus informasi pribadi yang tersimpan.',
    points: [
      {
        label: 'Pembaruan Data Pribadi',
        text: 'Pengguna berhak melakukan pembaruan data profil, alamat pengiriman, dan preferensi akun secara mandiri kapan saja melalui menu pengaturan akun pengguna.',
      },
      {
        label: 'Penghapusan Akun via Dukungan',
        text: 'Pengguna memiliki hak hukum untuk mengajukan penghapusan akun via dukungan pelanggan resmi (right to erasure), yang mencakup penghapusan data pribadi secara permanen dari basis data aktif.',
      },
      {
        label: 'Transparansi Pemrosesan Data',
        text: 'Pengguna berhak memperoleh penjelasan tertulis mengenai cakupan data pribadi miliknya yang disimpan dan diproses dalam ekosistem layanan ShelfStack.',
      },
    ],
  },
  {
    number: '05',
    title: 'Penggunaan Cookie & Sesi Belanja',
    lead: 'Pemanfaatan mekanisme penyimpanan lokal untuk kelancaran navigasi belanja tanpa pelacakan invasif pihak ketiga.',
    points: [
      {
        label: 'Penyimpanan Keranjang Lokal',
        text: 'Kami memanfaatkan teknologi penyimpanan keranjang dan sesi lokal (local storage) pada peramban web agar item belanja Anda tetap tersimpan saat berpindah halaman atau menutup aplikasi.',
      },
      {
        label: 'Cookie Sesi Esensial',
        text: 'Cookie esensial dipakai hanya untuk mempertahankan status login akun dan mengamankan pertukaran token dari potensi serangan pemalsuan permintaan lintas-situs (CSRF).',
      },
      {
        label: 'Kontrol Pengguna pada Peramban',
        text: 'Pengguna memiliki kebebasan penuh untuk menghapus atau menonaktifkan cookie melalui pengaturan peramban web tanpa mengganggu hak penelusuran katalog publik ShelfStack.',
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
      <span class="font-semibold text-brand-ink">Kebijakan Privasi</span>
    </nav>

    <!-- Header / Hero Section -->
    <header class="mb-12 max-w-4xl sm:mb-16">
      <div class="mb-4 inline-flex items-center gap-2">
        <UiBadge label="Privasi &amp; Keamanan" variant="info" />
        <span class="text-xs font-medium text-brand-muted">Pembaruan Resmi · Versi 1.3</span>
      </div>
      <h1
        class="mb-4 font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl lg:text-5xl"
      >
        Kebijakan Privasi &amp; Perlindungan Data
      </h1>
      <p class="font-body text-base leading-relaxed text-brand-muted sm:text-lg">
        Komitmen transparansi dan keamanan privasi data pengguna ShelfStack
      </p>
      <div class="mt-4 flex items-center gap-3 text-xs text-brand-muted">
        <span>Berlaku efektif sejak: 30 Oktober 2026</span>
        <span class="h-1 w-1 rounded-full bg-brand-hair" />
        <span>Standar Keamanan: PCI-DSS &amp; Supabase RLS</span>
      </div>
    </header>

    <!-- Sections List -->
    <div class="mb-16 space-y-6 sm:space-y-8">
      <UiCard
        v-for="section in sections"
        :key="section.number"
        :padded="true"
        class="border-brand-hair"
      >
        <div class="mb-5 flex flex-wrap items-center gap-3 pb-4 border-b border-brand-hairsoft">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-canvas-soft text-xs font-bold text-brand-ink"
          >
            {{ section.number }}
          </span>
          <h2 class="font-display text-lg font-bold text-brand-ink sm:text-xl">
            {{ section.title }}
          </h2>
        </div>
        <p class="mb-6 text-sm text-brand-muted leading-relaxed">
          {{ section.lead }}
        </p>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            v-for="(point, idx) in section.points"
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
              <UiBadge label="Bantuan Privasi" variant="default" />
            </div>
            <h2 class="font-display text-xl font-bold text-brand-ink sm:text-2xl">
              Pertanyaan mengenai Privasi Data Anda?
            </h2>
            <p class="mt-2 text-sm leading-relaxed text-brand-muted">
              Jika Anda ingin melakukan pembaruan data, mengajukan penghapusan akun via dukungan
              pelanggan, atau memiliki pertanyaan seputar perlindungan privasi data di ShelfStack,
              tim kami siap membantu.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <UiButton to="/contact" variant="primary" size="md"> Hubungi Tim Dukungan </UiButton>
          </div>
        </div>
      </UiCard>
    </section>
  </div>
</template>
