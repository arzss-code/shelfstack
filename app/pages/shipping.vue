<script setup lang="ts">
import UiBadge from '~/components/ui/UiBadge.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiButton from '~/components/ui/UiButton.vue'

useSeoMeta({
  title: 'Informasi Pengiriman - ShelfStack',
  description: 'Panduan estimasi pengiriman, proteksi paket, dan opsi kurir resmi ShelfStack.',
})

const featureCards = [
  {
    id: 'free-shipping',
    badge: 'Min. Belanja Rp 500.000',
    title: 'Gratis Ongkir Nasional',
    desc: 'Bebas biaya kirim untuk pesanan di atas Rp 500.000 ke seluruh Indonesia.',
    icon: 'pi-truck',
  },
  {
    id: 'packaging-standard',
    badge: 'Proteksi Menyeluruh',
    title: 'Standar Kemasan Studio',
    desc: 'Perlindungan ganda: bubble wrap tebal, kardus berlabel fragile, dan asuransi penuh untuk barang elektronik.',
    icon: 'pi-box',
  },
  {
    id: 'verified-couriers',
    badge: 'Resi Otomatis',
    title: 'Kurir Resmi Terverifikasi',
    desc: 'JNE, SiCepat, J&T dengan pelacakan nomor resi otomatis.',
    icon: 'pi-verified',
  },
]

const deliveryEstimates = [
  {
    destination: 'Jabodetabek',
    coverage: 'Jakarta, Bogor, Depok, Tangerang, Bekasi',
    duration: '1-2 hari kerja',
    serviceType: 'Reguler & Prioritas',
    insurance: 'Termasuk Asuransi Penuh',
  },
  {
    destination: 'Pulau Jawa',
    coverage: 'Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur, Banten',
    duration: '2-3 hari kerja',
    serviceType: 'Layanan Darat Cepat',
    insurance: 'Termasuk Asuransi Penuh',
  },
  {
    destination: 'Luar Pulau Jawa',
    coverage: 'Sumatra, Kalimantan, Sulawesi, Bali, Nusa Tenggara, Maluku, Papua',
    duration: '3-5 hari kerja',
    serviceType: 'Distribusi Kargo & Udara',
    insurance: 'Termasuk Asuransi Penuh',
  },
]

const officialCouriers = [
  {
    name: 'JNE',
    fullName: 'JNE Express',
    services: 'REG (Reguler), YES (Yakin Esok Sampai)',
    note: 'Jangkauan terluas hingga pelosok kecamatan.',
  },
  {
    name: 'SiCepat',
    fullName: 'SiCepat Ekspres',
    services: 'SiUntung (Reguler), BEST (Besok Sampai Tujuan)',
    note: 'Pelacakan cepat dan armada modern terintegrasi.',
  },
  {
    name: 'J&T',
    fullName: 'J&T Express',
    services: 'EZ (Reguler), J&T Super',
    note: 'Operasional 365 hari tanpa libur pengantaran.',
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
      <span class="font-semibold text-brand-ink">Informasi Pengiriman</span>
    </nav>

    <!-- Header Section -->
    <header class="mb-12 sm:mb-16">
      <div class="mb-4 inline-flex items-center gap-2">
        <UiBadge label="Standar Logistik" variant="info" />
        <span class="text-xs font-medium text-brand-muted">Pengiriman Aman &amp; Terlacak</span>
      </div>
      <h1
        class="mb-4 max-w-3xl font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl lg:text-5xl"
      >
        Informasi Pengiriman &amp; Ekspedisi
      </h1>
      <p class="max-w-3xl font-body text-base leading-relaxed text-brand-muted sm:text-lg">
        Panduan estimasi pengiriman, proteksi paket, dan opsi kurir resmi ShelfStack.
      </p>
    </header>

    <!-- 3 Feature Cards -->
    <section class="mb-16 sm:mb-20" aria-labelledby="features-heading">
      <h2 id="features-heading" class="sr-only">Keunggulan Pengiriman ShelfStack</h2>
      <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
        <UiCard
          v-for="feature in featureCards"
          :key="feature.id"
          :padded="true"
          class="flex flex-col justify-between border-brand-hair bg-white"
        >
          <div>
            <div class="mb-4 flex items-center justify-between">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-canvas-soft text-brand-ink border border-brand-hair"
              >
                <i :class="['pi', feature.icon, 'text-base']" aria-hidden="true" />
              </div>
              <span class="text-[11px] font-semibold tracking-wide text-brand-muted uppercase">
                {{ feature.badge }}
              </span>
            </div>
            <h3 class="mb-2 font-display text-lg font-bold text-brand-ink">
              {{ feature.title }}
            </h3>
            <p class="font-body text-sm leading-relaxed text-brand-muted">
              {{ feature.desc }}
            </p>
          </div>
        </UiCard>
      </div>
    </section>

    <!-- Estimasi Waktu Tiba Grid / Table -->
    <section class="mb-16 sm:mb-20" aria-labelledby="estimates-heading">
      <div class="mb-6">
        <span class="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          Ketepatan Waktu
        </span>
        <h2
          id="estimates-heading"
          class="mb-2 mt-1 font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl"
        >
          Estimasi Waktu Tiba
        </h2>
        <p class="font-body text-sm leading-relaxed text-brand-muted sm:text-base">
          Estimasi dihitung sejak paket diserahkan ke jasa kurir logistik. Pesanan terkonfirmasi
          sebelum pukul 14:00 WIB diproses pada hari kerja yang sama.
        </p>
      </div>

      <UiCard :padded="false" class="border-brand-hair bg-white overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[560px] text-left text-sm">
            <thead
              class="border-b border-brand-hair bg-brand-canvas-soft text-xs font-semibold uppercase tracking-wider text-brand-ink"
            >
              <tr>
                <th scope="col" class="px-6 py-4">Wilayah Tujuan</th>
                <th scope="col" class="px-6 py-4">Estimasi Pengiriman</th>
                <th scope="col" class="px-6 py-4">Jenis Layanan</th>
                <th scope="col" class="px-6 py-4">Proteksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-hair">
              <tr
                v-for="estimate in deliveryEstimates"
                :key="estimate.destination"
                class="hover:bg-brand-canvas-soft/40 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="font-semibold text-brand-ink">{{ estimate.destination }}</div>
                  <div class="text-xs text-brand-muted mt-0.5">{{ estimate.coverage }}</div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5 font-bold text-brand-ink">
                    <i class="pi pi-clock text-xs text-brand-muted" aria-hidden="true" />
                    {{ estimate.duration }}
                  </span>
                </td>
                <td class="px-6 py-4 text-brand-muted">
                  {{ estimate.serviceType }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-brand-success-tint px-2.5 py-0.5 text-xs font-medium text-brand-success-text border border-brand-success-edge"
                  >
                    <i class="pi pi-shield text-[10px]" aria-hidden="true" />
                    {{ estimate.insurance }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiCard>
    </section>

    <!-- Opsi Kurir Resmi -->
    <section class="mb-16 sm:mb-20" aria-labelledby="couriers-heading">
      <div class="mb-6">
        <span class="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          Ekspedisi Terpercaya
        </span>
        <h2
          id="couriers-heading"
          class="mb-2 mt-1 font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl"
        >
          Opsi Kurir Resmi ShelfStack
        </h2>
        <p class="font-body text-sm leading-relaxed text-brand-muted sm:text-base">
          Kami bermitra langsung dengan penyedia jasa pengiriman resmi berlisensi nasional untuk
          menjamin kecepatan, keakuratan pelacakan, dan keamanan paket.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
        <UiCard
          v-for="courier in officialCouriers"
          :key="courier.name"
          :padded="true"
          class="border-brand-hair bg-white"
        >
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-display text-xl font-bold text-brand-ink">
              {{ courier.name }}
            </h3>
            <span class="text-xs font-medium text-brand-muted">
              {{ courier.fullName }}
            </span>
          </div>
          <div
            class="mb-3 rounded bg-brand-canvas-soft p-2.5 text-xs text-brand-ink font-medium border border-brand-hairsoft"
          >
            <span class="text-brand-muted block text-[11px] uppercase tracking-wider mb-0.5"
              >Layanan:</span
            >
            {{ courier.services }}
          </div>
          <p class="text-xs leading-relaxed text-brand-muted">
            {{ courier.note }}
          </p>
        </UiCard>
      </div>
    </section>

    <!-- Direct CTA Strip -->
    <section
      class="rounded-card border border-brand-hair bg-brand-canvas-soft p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
      aria-labelledby="cta-heading"
    >
      <div>
        <h2 id="cta-heading" class="font-display text-xl font-bold text-brand-ink sm:text-2xl">
          Ingin Cek Status Paket Anda?
        </h2>
        <p class="mt-1 max-w-xl font-body text-sm leading-relaxed text-brand-muted">
          Gunakan nomor resi pengiriman untuk melacak posisi paket Anda secara langsung, atau
          pelajari ketentuan logistik pada pusat bantuan.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <UiButton to="/tracking" variant="primary" icon="pi-compass"> Lacak Nomor Resi </UiButton>
        <UiButton to="/help" variant="secondary" icon="pi-question-circle">
          Lihat FAQ Pengiriman
        </UiButton>
      </div>
    </section>
  </div>
</template>
