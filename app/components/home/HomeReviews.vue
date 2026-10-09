<script setup lang="ts">
export interface TrustCommitment {
  title: string
  tag: string
  icon: string
  description: string
  metric: string
}

const commitments: TrustCommitment[] = [
  {
    title: 'Kurasi Fisik 100% Asli',
    tag: 'Keaslian Terjamin',
    icon: 'pi pi-shield',
    description:
      'Setiap unit produk melewati pemeriksaan fisik dan inspeksi kualitas langsung sebelum diarsipkan ke inventaris resmi ShelfStack.',
    metric: 'Inspeksi Fisik Mandiri',
  },
  {
    title: 'Jaminan Pengembalian 30 Hari',
    tag: 'Garansi Resmi',
    icon: 'pi pi-refresh',
    description:
      'Kebijakan purna jual transparan. Dapatkan penggantian unit atau pengembalian dana penuh jika produk mengalami cacat produksi.',
    metric: 'Garansi Purna Jual',
  },
  {
    title: 'Pengemasan Tahan Benturan',
    tag: 'Standar Logistik',
    icon: 'pi pi-box',
    description:
      'Protokol proteksi ganda dengan bantalan berdensitas tinggi dan segel keamanan untuk menjaga keutuhan produk hingga alamat tujuan.',
    metric: 'Proteksi Berlapis',
  },
  {
    title: 'Layanan Pelanggan Responsif',
    tag: 'Dukungan Langsung',
    icon: 'pi pi-headphones',
    description:
      'Dukungan operasional langsung oleh tim ShelfStack untuk bantuan pesanan, konfirmasi pembayaran, dan informasi teknis produk.',
    metric: 'Dukungan Operasional',
  },
]
</script>

<template>
  <section class="w-full" data-testid="customer-trust-section">
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1.5 text-brand-accent">
          <i class="pi pi-verified text-base" />
          <span class="text-xs font-bold tracking-wide uppercase">Jaminan & Integritas Produk</span>
        </div>
        <h2 class="font-display m-0 text-2xl sm:text-4xl font-bold text-brand-ink">
          Standar Kualitas & Kepuasan Pelanggan ShelfStack
        </h2>
        <p class="font-body text-sm sm:text-base text-brand-muted max-w-2xl m-0 mt-2">
          Komitmen transparansi tanpa rekayasa. Setiap pesanan dilindungi kurasi ketat, garansi
          resmi, dan perlindungan purna jual terpercaya.
        </p>
      </div>

      <div
        class="flex items-center gap-2 bg-brand-canvas-soft border border-brand-hair px-4 py-2 rounded-card text-xs text-brand-ink shrink-0 shadow-whisper"
      >
        <i class="pi pi-check-circle text-emerald-600 text-sm" />
        <span class="font-semibold">Standar Operasional Terverifikasi</span>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="item in commitments"
        :key="item.title"
        class="bg-brand-canvas-soft border border-brand-hair rounded-card p-6 flex flex-col justify-between gap-4 shadow-whisper transition-all hover:border-brand-accent/40"
        data-testid="trust-commitment-card"
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <div
              class="w-10 h-10 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center"
            >
              <i :class="[item.icon, 'text-lg']" />
            </div>
            <span
              class="bg-white border border-brand-hair px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-brand-muted"
            >
              {{ item.tag }}
            </span>
          </div>

          <h3 class="font-display text-base font-bold text-brand-ink m-0 mb-2">
            {{ item.title }}
          </h3>

          <p class="font-body text-xs sm:text-sm text-brand-muted leading-relaxed m-0">
            {{ item.description }}
          </p>
        </div>

        <div
          class="pt-3 border-t border-brand-hairsoft flex items-center justify-between text-[11px] text-brand-muted"
        >
          <span class="font-medium">{{ item.metric }}</span>
          <i class="pi pi-check text-brand-accent text-xs" />
        </div>
      </div>
    </div>
  </section>
</template>
