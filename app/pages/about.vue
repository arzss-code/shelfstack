<script setup lang="ts">
import UiBadge from '~/components/ui/UiBadge.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiButton from '~/components/ui/UiButton.vue'

try {
  useSeoMeta({
    title: 'Tentang Kami - ShelfStack',
    description:
      'ShelfStack adalah destinasi e-commerce terkurasi untuk periferal meja kerja, furnitur ergonomis, dan perangkat audio presisi.',
  })
} catch {
  // Fallback aman untuk lingkungan unit test tanpa instance NuxtApp
}
</script>

<template>
  <div class="py-4 sm:py-8">
    <!-- Breadcrumb -->
    <nav class="mb-8 flex items-center gap-2 text-xs text-brand-muted" aria-label="Breadcrumb">
      <NuxtLink to="/" class="no-underline transition-colors hover:text-brand-ink">
        Beranda
      </NuxtLink>
      <span class="text-brand-hair">/</span>
      <span class="font-semibold text-brand-ink">Tentang Kami</span>
    </nav>

    <!-- Hero / Curatorial Mission -->
    <section class="mb-14 sm:mb-18">
      <div class="mb-4 inline-flex items-center gap-2">
        <UiBadge label="Filosofi Kurasi" variant="info" />
        <span class="text-xs font-medium text-brand-muted">Single-Vendor Curated Storefront</span>
      </div>
      <h1
        class="mb-6 max-w-3xl font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl lg:text-5xl"
      >
        Ruang Kerja Presisi untuk Profesional Digital, Engineer, dan Studio Kreatif.
      </h1>
      <p class="max-w-3xl font-body text-base leading-relaxed text-brand-muted sm:text-lg">
        ShelfStack hadir sebagai destinasi tunggal terkurasi bagi individu dan studio yang menolak
        kompromi mutu pada ruang kerja harian. Kami percaya bahwa fokus mendalam dan karya
        berkualitas lahir dari kombinasi rekayasa material jujur, ergonomi fungsional teruji, dan
        kesederhanaan visual modern.
      </p>
    </section>

    <!-- Proven Stats Strip -->
    <section class="mb-16 sm:mb-20">
      <div class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        <UiCard :padded="true" class="text-left">
          <p class="mb-1 font-display text-3xl font-bold text-brand-ink sm:text-4xl">5 Kategori</p>
          <p class="text-xs font-semibold text-brand-ink sm:text-sm">Koleksi Terkurasi</p>
          <p class="mt-1 text-xs leading-normal text-brand-muted">
            Katalog terpilih yang diuji untuk beban kerja produktivitas intensif.
          </p>
        </UiCard>

        <UiCard :padded="true" class="text-left">
          <p class="mb-1 font-display text-3xl font-bold text-brand-ink sm:text-4xl">100%</p>
          <p class="text-xs font-semibold text-brand-ink sm:text-sm">Lulus Uji Standar</p>
          <p class="mt-1 text-xs leading-normal text-brand-muted">
            Setiap unit lulus verifikasi ergonomi, stabilitas mekanis, dan durabilitas.
          </p>
        </UiCard>

        <UiCard :padded="true" class="text-left">
          <p class="mb-1 font-display text-3xl font-bold text-brand-ink sm:text-4xl">2 Tahun</p>
          <p class="text-xs font-semibold text-brand-ink sm:text-sm">Garansi Resmi</p>
          <p class="mt-1 text-xs leading-normal text-brand-muted">
            Jaminan penggantian unit dan proteksi purnajual langsung tanpa syarat rumit.
          </p>
        </UiCard>

        <UiCard :padded="true" class="text-left">
          <p class="mb-1 font-display text-2xl font-bold text-brand-ink sm:text-3xl lg:text-4xl">
            Cepat &amp; Aman
          </p>
          <p class="text-xs font-semibold text-brand-ink sm:text-sm">
            Pengiriman Cepat Seluruh Indonesia
          </p>
          <p class="mt-1 text-xs leading-normal text-brand-muted">
            Proteksi pengemasan khusus dan pengiriman terlacak ke seluruh nusantara.
          </p>
        </UiCard>
      </div>
    </section>

    <!-- Core Pillars Section -->
    <section class="mb-16 sm:mb-20">
      <div class="mb-8 max-w-2xl">
        <span class="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          Standar Kualitas
        </span>
        <h2
          class="mb-3 mt-1 font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl"
        >
          Tiga Pilar Rekayasa ShelfStack
        </h2>
        <p class="font-body text-sm leading-relaxed text-brand-muted sm:text-base">
          Setiap produk dalam koleksi ShelfStack harus memenuhi tiga pilar komitmen utama sebelum
          disediakan untuk Anda:
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <!-- Pillar 1 -->
        <UiCard :padded="true" class="flex flex-col justify-between border-brand-hair">
          <div>
            <div
              class="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-brand-ink"
            >
              <i class="pi pi-box text-base" />
            </div>
            <h3 class="mb-2 font-display text-lg font-bold text-brand-ink">Material Presisi</h3>
            <p class="mb-3 text-xs font-semibold text-brand-accent">
              Billet 6063 Aluminum, Solid American Walnut, Studio Acoustic Engineering
            </p>
            <p class="font-body text-xs leading-relaxed text-brand-muted sm:text-sm">
              Kami memprioritaskan material kelas industri yang tahan lama. Kombinasi aluminium
              presisi hasil pemesinan CNC, kayu kenari padat pilihan, dan rekayasa akustik studio
              memastikan tiap permukaan memberikan sentuhan taktil kokoh serta bebas getaran yang
              mengganggu.
            </p>
          </div>
        </UiCard>

        <!-- Pillar 2 -->
        <UiCard :padded="true" class="flex flex-col justify-between border-brand-hair">
          <div>
            <div
              class="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-brand-ink"
            >
              <i class="pi pi-shield text-base" />
            </div>
            <h3 class="mb-2 font-display text-lg font-bold text-brand-ink">
              Transparansi &amp; Keaslian
            </h3>
            <p class="mb-3 text-xs font-semibold text-brand-accent">
              100% Produk Original dengan Garansi Resmi 2 Tahun
            </p>
            <p class="font-body text-xs leading-relaxed text-brand-muted sm:text-sm">
              ShelfStack menolak produk tiruan maupun perantara yang meragukan. Seluruh perangkat
              kami didatangkan langsung dari prinsipal resmi lengkap dengan nomor seri terdaftar dan
              perlindungan garansi resmi 2 tahun untuk kepastian investasi ruang kerja Anda.
            </p>
          </div>
        </UiCard>

        <!-- Pillar 3 -->
        <UiCard :padded="true" class="flex flex-col justify-between border-brand-hair">
          <div>
            <div
              class="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-brand-ink"
            >
              <i class="pi pi-check-circle text-base" />
            </div>
            <h3 class="mb-2 font-display text-lg font-bold text-brand-ink">
              Kurasi Tanpa Kompromi
            </h3>
            <p class="mb-3 text-xs font-semibold text-brand-accent">
              Setiap unit melalui pengujian ergonomi dan durabilitas nyata
            </p>
            <p class="font-body text-xs leading-relaxed text-brand-muted sm:text-sm">
              Dari ratusan periferal di pasar, hanya produk yang terbukti mampu menjaga postur
              alami, memiliki manajemen kabel rapi, dan sanggup menahan ribuan jam penggunaan harian
              yang lolos seleksi akhir kurator kami.
            </p>
          </div>
        </UiCard>
      </div>
    </section>

    <!-- Single Vendor Assurance Box -->
    <section class="mb-16">
      <div class="rounded-card border border-brand-hair bg-brand-canvas-soft p-6 sm:p-10">
        <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div class="space-y-4 lg:col-span-7">
            <UiBadge label="Jaminan Standar Tunggal" variant="default" />
            <h2 class="font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
              Model Toko Tunggal untuk Mutu Konsisten
            </h2>
            <p class="font-body text-sm leading-relaxed text-brand-muted sm:text-base">
              Tidak seperti marketplace terbuka dengan ribuan penjual acak dan kualitas beragam,
              ShelfStack mengoperasikan seluruh inventaris secara langsung. Setiap unit diperiksa
              secara fisik di gudang kurasi kami sebelum dikemas rapat dengan pelindung benturan.
            </p>
            <div class="flex flex-wrap gap-4 pt-2 text-xs font-medium text-brand-ink">
              <span class="inline-flex items-center gap-1.5">
                <i class="pi pi-check text-xs text-brand-success" /> Tanpa Penjual Pihak Ketiga
              </span>
              <span class="inline-flex items-center gap-1.5">
                <i class="pi pi-check text-xs text-brand-success" /> Pengemasan Berlapis Khusus
              </span>
              <span class="inline-flex items-center gap-1.5">
                <i class="pi pi-check text-xs text-brand-success" /> Uji Fisik Pra-Pengiriman
              </span>
            </div>
          </div>

          <div
            class="border-t border-brand-hair pt-6 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
          >
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Pusat Kurasi &amp; Gudang Logistik
            </p>
            <p class="mb-1 font-display text-base font-bold text-brand-ink">
              ShelfStack Hub Semarang
            </p>
            <p class="mb-4 text-xs leading-relaxed text-brand-muted sm:text-sm">
              Fasilitas kendali mutu dan logistik sentral kami berlokasi di Semarang, Jawa Tengah,
              mendukung pengiriman berkecepatan tinggi ke berbagai kota di Indonesia.
            </p>
            <NuxtLink
              to="/contact"
              class="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline"
            >
              Hubungi Tim Dukungan <i class="pi pi-arrow-right text-[10px]" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Direct CTA Strip -->
    <section class="mb-8">
      <UiCard
        :padded="true"
        class="border border-brand-hair bg-white px-6 py-10 text-center sm:py-14"
      >
        <div class="mx-auto max-w-2xl space-y-4">
          <h2 class="font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
            Temukan Perangkat Meja Kerja Anda
          </h2>
          <p class="font-body text-sm leading-relaxed text-brand-muted sm:text-base">
            Tingkatkan kenyamanan, fokus, dan estetika ruang kerja Anda dengan koleksi peralatan
            terkurasi ShelfStack.
          </p>
          <div class="flex flex-wrap justify-center gap-3 pt-3">
            <UiButton
              to="/katalog"
              variant="primary"
              size="lg"
              icon="pi-arrow-right"
              icon-pos="right"
            >
              Eksplorasi Katalog Produk
            </UiButton>
            <UiButton to="/contact" variant="outline" size="lg">
              Hubungi Layanan Pelanggan
            </UiButton>
          </div>
        </div>
      </UiCard>
    </section>
  </div>
</template>
