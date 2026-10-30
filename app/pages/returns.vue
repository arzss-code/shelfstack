<script setup lang="ts">
import UiBadge from '~/components/ui/UiBadge.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiButton from '~/components/ui/UiButton.vue'

useSeoMeta({
  title: 'Kebijakan Pengembalian & Garansi - ShelfStack',
  description: 'Jaminan kepuasan belanja dan komitmen perlindungan konsumen ShelfStack.',
})

const guarantees = [
  {
    id: 'return-7-days',
    badge: 'Uji Fungsi Awal',
    title: 'Jaminan Retur 7 Hari',
    desc: 'Pengembalian atau penggantian unit jika terdapat cacat pabrik dalam 7 hari sejak diterima.',
    icon: 'pi-replay',
    variant: 'info' as const,
  },
  {
    id: 'warranty-2-years',
    badge: 'Proteksi Penuh',
    title: 'Garansi Resmi 2 Tahun',
    desc: 'Perlindungan perbaikan atau penggantian komponen untuk seluruh perangkat keras kurasi.',
    icon: 'pi-shield',
    variant: 'success' as const,
  },
  {
    id: 'full-refund',
    badge: 'Kepastian Dana',
    title: 'Pengembalian Dana Penuh',
    desc: 'Refund 100% via metode pembayaran awal jika unit pengganti tidak tersedia.',
    icon: 'pi-wallet',
    variant: 'default' as const,
  },
]

const returnSteps = [
  {
    number: '01',
    title: 'Hubungi Layanan Pelanggan',
    desc: 'Laporkan kendala produk melalui formulir /contact atau email resmi kami di support@shelfstack.id.',
    highlight: 'Respons cepat dalam 1x24 jam kerja.',
  },
  {
    number: '02',
    title: 'Verifikasi Bukti',
    desc: 'Lampirkan video unboxing tanpa jeda dan foto nomor seri produk yang mengalami kendala.',
    highlight: 'Validasi identitas nomor batch dan kondisi fisik.',
  },
  {
    number: '03',
    title: 'Kirimkan Produk ke Gudang',
    desc: 'Pengiriman ke gudang kurasi sentral di Semarang dengan menyertakan nomor tiket retur resmi.',
    highlight: 'Bebas biaya kirim balik untuk cacat pabrik terverifikasi.',
  },
  {
    number: '04',
    title: 'Penggantian Unit atau Refund',
    desc: 'Diproses dalam 1-3 hari kerja pasca inspeksi fisik oleh tim kendali mutu kami.',
    highlight: 'Pilihan unit baru atau pengembalian dana 100%.',
  },
]

const eligibilityCriteria = [
  {
    title: 'Video Unboxing Lengkap',
    desc: 'Rekaman video tanpa jeda saat membuka segel paket pertama kali hingga unit diuji.',
  },
  {
    title: 'Kelengkapan Orisinal',
    desc: 'Produk harus disertai boks kemasan asli, kartu garansi, buku manual, dan seluruh aksesori bawaan.',
  },
  {
    title: 'Kondisi Bebas Modifikasi',
    desc: 'Segel pabrik dan nomor seri tidak rusak, serta unit belum pernah dibongkar pihak ketiga.',
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
      <span class="font-semibold text-brand-ink">Kebijakan Pengembalian &amp; Garansi</span>
    </nav>

    <!-- Header Section -->
    <header class="mb-12 sm:mb-16">
      <div class="mb-4 inline-flex items-center gap-2">
        <UiBadge label="Proteksi Konsumen" variant="success" />
        <span class="text-xs font-medium text-brand-muted">Jaminan Kualitas &amp; Purnajual</span>
      </div>
      <h1
        class="mb-4 max-w-3xl font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl lg:text-5xl"
      >
        Kebijakan Pengembalian &amp; Garansi
      </h1>
      <p class="max-w-3xl font-body text-base leading-relaxed text-brand-muted sm:text-lg">
        Jaminan kepuasan belanja dan komitmen perlindungan konsumen ShelfStack.
      </p>
    </header>

    <!-- Key Guarantees -->
    <section class="mb-16 sm:mb-20" aria-labelledby="guarantees-heading">
      <h2 id="guarantees-heading" class="sr-only">Tiga Jaminan Utama ShelfStack</h2>
      <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
        <UiCard
          v-for="item in guarantees"
          :key="item.id"
          :padded="true"
          class="flex flex-col justify-between border-brand-hair bg-white"
        >
          <div>
            <div class="mb-4 flex items-center justify-between">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-canvas-soft text-brand-ink border border-brand-hair"
              >
                <i :class="['pi', item.icon, 'text-base']" aria-hidden="true" />
              </div>
              <UiBadge :label="item.badge" :variant="item.variant" />
            </div>
            <h3 class="mb-2 font-display text-lg font-bold text-brand-ink">
              {{ item.title }}
            </h3>
            <p class="font-body text-sm leading-relaxed text-brand-muted">
              {{ item.desc }}
            </p>
          </div>
        </UiCard>
      </div>
    </section>

    <!-- 4-Step Return Process -->
    <section class="mb-16 sm:mb-20" aria-labelledby="process-heading">
      <div class="mb-8">
        <span class="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          Alur Transparan
        </span>
        <h2
          id="process-heading"
          class="mb-2 mt-1 font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl"
        >
          Tahapan Pengajuan Retur &amp; Klaim Garansi
        </h2>
        <p class="font-body text-sm leading-relaxed text-brand-muted sm:text-base">
          Proses terstruktur dan terukur untuk memastikan kendala perangkat Anda diselesaikan secara
          cepat.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <UiCard
          v-for="step in returnSteps"
          :key="step.number"
          :padded="true"
          class="border-brand-hair bg-white flex flex-col justify-between"
        >
          <div>
            <div class="mb-4 flex items-center justify-between">
              <span class="font-display text-2xl font-bold text-brand-muted/70">
                {{ step.number }}
              </span>
              <span class="h-2 w-2 rounded-full bg-brand-ink" />
            </div>
            <h3 class="mb-2 font-display text-base font-bold text-brand-ink">
              {{ step.title }}
            </h3>
            <p class="font-body text-xs leading-relaxed text-brand-muted">
              {{ step.desc }}
            </p>
          </div>
          <div
            class="mt-4 pt-3 border-t border-brand-hairsoft text-[11px] font-medium text-brand-muted"
          >
            {{ step.highlight }}
          </div>
        </UiCard>
      </div>
    </section>

    <!-- Syarat & Ketentuan Kelayakan -->
    <section class="mb-16 sm:mb-20" aria-labelledby="criteria-heading">
      <div class="mb-6">
        <span class="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          Kriteria Validasi
        </span>
        <h2
          id="criteria-heading"
          class="mb-2 mt-1 font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl"
        >
          Ketentuan Kelayakan Pengembalian
        </h2>
        <p class="font-body text-sm leading-relaxed text-brand-muted sm:text-base">
          Harap perhatikan syarat kelayakan berikut sebelum mengajukan permohonan retur atau klaim:
        </p>
      </div>

      <UiCard :padded="true" class="border-brand-hair bg-white">
        <div
          class="grid grid-cols-1 gap-6 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-brand-hair"
        >
          <div
            v-for="(criteria, idx) in eligibilityCriteria"
            :key="criteria.title"
            :class="[idx > 0 ? 'pt-6 md:pt-0 md:pl-6' : '']"
          >
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-check text-brand-success text-xs font-bold" aria-hidden="true" />
              <h3 class="font-display text-sm font-bold text-brand-ink">
                {{ criteria.title }}
              </h3>
            </div>
            <p class="text-xs leading-relaxed text-brand-muted">
              {{ criteria.desc }}
            </p>
          </div>
        </div>
      </UiCard>
    </section>

    <!-- Direct CTA Strip -->
    <section
      class="rounded-card border border-brand-hair bg-brand-canvas-soft p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
      aria-labelledby="cta-returns-heading"
    >
      <div>
        <h2
          id="cta-returns-heading"
          class="font-display text-xl font-bold text-brand-ink sm:text-2xl"
        >
          Ada Kendala dengan Produk Anda?
        </h2>
        <p class="mt-1 max-w-xl font-body text-sm leading-relaxed text-brand-muted">
          Tim customer care kami siap memandu proses klaim garansi dan pengembalian unit Anda dengan
          standar layanan responsif dan ramah.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <UiButton to="/contact" variant="primary" icon="pi-arrow-right" icon-pos="right">
          Ajukan Pengembalian
        </UiButton>
        <UiButton to="/help#pengembalian" variant="secondary" icon="pi-question-circle">
          Pelajari FAQ
        </UiButton>
      </div>
    </section>
  </div>
</template>
