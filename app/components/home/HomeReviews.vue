<script setup lang="ts">
// Customer Testimonials
const reviews = [
  {
    quote:
      'Headphone studio dan meja kerja yang saya pesan tiba dengan kondisi sempurna. Kualitas materialnya benar-benar terasa kokoh dan memuaskan.',
    author: 'Hendra Setiawan',
    role: 'Kreator Konten & Audio',
    city: 'Jakarta',
    tag: 'Tech & Gadget',
  },
  {
    quote:
      'Teko gooseneck dan cangkir keramiknya sangat presisi untuk seduh kopi harian. Pengemasan sangat rapi dan protektif.',
    author: 'Sarah Lestari',
    role: 'Penggemar Kopi Manual',
    city: 'Bandung',
    tag: 'Rumah & Dapur',
  },
  {
    quote:
      'Katalognya sangat tertata dan estetik. Pengalaman belanja online paling memuaskan untuk merapikan setup meja kerja di rumah.',
    author: 'Budi Kurniawan',
    role: 'Desainer Produk',
    city: 'Surabaya',
    tag: 'Furnitur & Meja',
  },
]
</script>

<template>
  <section class="w-full">
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
      <div>
        <h2 class="font-display m-0 text-2xl sm:text-4xl font-bold text-brand-ink">
          Ulasan Pembeli Terverifikasi
        </h2>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-brand-muted">
        <div class="flex text-brand-warning">
          <i class="pi pi-star-fill text-xs" />
          <i class="pi pi-star-fill text-xs" />
          <i class="pi pi-star-fill text-xs" />
          <i class="pi pi-star-fill text-xs" />
          <i class="pi pi-star-fill text-xs" />
        </div>
        <span class="font-bold text-brand-ink">4.92 / 5.0</span>
        <span>dari 18.400+ pesanan terkirim</span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="rev in reviews"
        :key="rev.author"
        class="bg-brand-canvas-soft border border-brand-hair rounded-card p-6 flex flex-col justify-between gap-4 shadow-whisper"
      >
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex text-brand-warning text-xs">
              <i class="pi pi-star-fill" />
              <i class="pi pi-star-fill" />
              <i class="pi pi-star-fill" />
              <i class="pi pi-star-fill" />
              <i class="pi pi-star-fill" />
            </div>
            <span
              class="bg-white border border-brand-hair px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-brand-muted"
            >
              {{ rev.tag }}
            </span>
          </div>
          <p class="font-body text-xs sm:text-sm text-brand-ink leading-relaxed m-0">
            "{{ rev.quote }}"
          </p>
        </div>

        <div class="flex items-center gap-3 pt-3 border-t border-brand-hairsoft">
          <div
            class="w-8 h-8 rounded-full bg-brand-ink text-white text-xs font-bold flex items-center justify-center"
          >
            {{ rev.author.charAt(0) }}
          </div>
          <div>
            <p class="text-xs font-bold text-brand-ink m-0">{{ rev.author }}</p>
            <p class="text-[11px] text-brand-muted m-0">{{ rev.role }} · {{ rev.city }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
