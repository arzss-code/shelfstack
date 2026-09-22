<template>
  <section class="w-full pt-2">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      <!-- Left Column: Editorial Statement & Actions -->
      <div class="lg:col-span-6 flex flex-col justify-center space-y-6">
        <div class="space-y-4">
          <!-- Headline Utama -->
          <h1
            class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-ink leading-[1.08] text-balance m-0"
          >
            Etalase rapi di depan, operasional tertib di belakang.
          </h1>

          <p class="font-body text-base sm:text-lg text-brand-muted max-w-xl leading-relaxed m-0">
            ShelfStack mengkurasi perlengkapan harian berkualitas tinggi untuk kebutuhan kerja,
            rumah tangga, dan gaya hidup modern. Didesain dengan keandalan maksimal, daya tahan
            kuat, dan estetika minimalis.
          </p>
        </div>

        <!-- Call to Action Buttons -->
        <div class="flex flex-wrap items-center gap-3 pt-1">
          <NuxtLink
            to="/katalog"
            class="bg-brand-ink text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-brand-inkhover transition-all flex items-center gap-2 no-underline shadow-whisper"
          >
            <span>Lihat Katalog</span>
            <i class="pi pi-arrow-right text-xs" />
          </NuxtLink>

          <NuxtLink
            to="/auth/login"
            class="bg-brand-canvas-soft hover:bg-brand-field text-brand-ink font-semibold text-sm px-6 py-3.5 rounded-full transition-all border border-brand-hair flex items-center gap-2 no-underline shadow-whisper"
          >
            <span>Masuk</span>
          </NuxtLink>
        </div>

        <!-- Informative Store Credibility Highlights -->
        <div class="pt-5 border-t border-brand-hair/60 grid grid-cols-3 gap-4 max-w-md">
          <div>
            <p class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tracking-tight">
              1.300+
            </p>
            <p class="font-body text-xs text-brand-muted m-0 mt-0.5 font-medium">Produk Pilihan</p>
          </div>
          <div>
            <p class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tracking-tight">
              5 Kategori
            </p>
            <p class="font-body text-xs text-brand-muted m-0 mt-0.5 font-medium">
              Kerja &amp; Rumah
            </p>
          </div>
          <div>
            <p
              class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tracking-tight flex items-center gap-1"
            >
              <span>4.9</span>
              <i class="pi pi-star-fill text-xs text-brand-warning" />
            </p>
            <p class="font-body text-xs text-brand-muted m-0 mt-0.5 font-medium">18rb+ Ulasan</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Curatorial Showcase Mosaic -->
      <div class="lg:col-span-6 relative">
        <div class="grid grid-cols-12 gap-3 h-80 sm:h-96">
          <!-- Main Hero Tile: Wireless Headphones -->
          <div
            class="col-span-7 bg-brand-canvas-soft rounded-card overflow-hidden relative group border border-brand-hair shadow-whisper h-full"
          >
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwVY6_XJIJ--I5tlVeVHvg6ErT_oBXt2avwd8dlAuTVukdzmLAppAhyNQAGXm3rQFEX1mHUEJ1GZ0wxvknebBIyNihYqTnXUswGHZuBSXpTUJrW6irkYFSwJUdz3lXaf3SIaU32wSKZaVrV6lC7Krf-diQ9YtZ80tMZPN0gDm7158w3dT3TGRm9DJY3Zr0K4RKBXS_5cVnFyD0hA50xpvdjViEWoa2fQmCh6xzjHcub1jp-D9HREja"
              alt="Headphone Nirkabel Studio"
            >
            <div
              class="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-full px-3.5 py-2 flex items-center justify-between border border-brand-hair shadow-whisper"
            >
              <div class="min-w-0 pr-2">
                <p class="text-xs font-bold text-brand-ink m-0 leading-tight truncate">
                  Headphone Studio ANC
                </p>
                <p class="text-[11px] text-brand-muted m-0 truncate">Koleksi Terlaris</p>
              </div>
              <span class="text-xs font-bold text-brand-accent shrink-0">Rp2.680.000</span>
            </div>
          </div>

          <!-- Secondary Hero Mosaic Stack -->
          <div class="col-span-5 flex flex-col gap-3 h-full">
            <!-- Top Row: Desk Lamp -->
            <div
              class="flex-1 min-h-0 bg-brand-canvas-soft rounded-card overflow-hidden relative group border border-brand-hair shadow-whisper"
            >
              <img
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhuBSFbEmAvUs-dIR2YRW-AgUpd_FXgqc62yOMrFXAqiJxphILJy3g73g9zMSiczWs5C_QAJAN1CjOVg_pzST382d0uUBGS5pFhsCPOFK1nOrZaHe-97eQ5JqcvSwsi3UzEkT3yFNe2vkYGKvByoxn2fF4xlojiv56WR8B1rwrUZFxLT-WZVzHWHvp1T17Fqfe44ym_WRhnIIM_2T_g3dkxEIvLv9oyO86-o48wqWDKZfPrK2obggw"
                alt="Lampu Meja Kerja"
              >
              <div
                class="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center justify-between border border-brand-hair shadow-whisper"
              >
                <div class="min-w-0 pr-1.5">
                  <p class="text-[11px] font-bold text-brand-ink m-0 leading-tight truncate">
                    Lampu Meja Task
                  </p>
                  <p class="text-[10px] text-brand-muted m-0 truncate">Pencahayaan</p>
                </div>
                <span class="text-[11px] font-bold text-brand-accent shrink-0">Rp850.000</span>
              </div>
            </div>

            <!-- Bottom Row: EDC Commuter Bag -->
            <div
              class="flex-1 min-h-0 bg-brand-canvas-soft rounded-card overflow-hidden relative group border border-brand-hair shadow-whisper"
            >
              <img
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaW1aKJlLR-zy1At4XWYvwZTHyVzcedxmF5czH_xXSLAw5u-HsTZgUrlfag8Lcz8Wy41SeSwYS-HeeyVsHZK3HIKWSVxEmb50sDQgwEwzPqy8Tk7DfzdvdVw4uC3VyiWSo8w_SV806yxW6xxj4tygQ5PGNzL4_0kdeany5eVB7SlX4r2_9T2mzzvz4Eqy6YNr5Hqd0-C230EfZJntIcrv_ptSdiTpKbYG9ESr-91MiSkickFdwXSq7"
                alt="Tas Komuter Multifungsi"
              >
              <div
                class="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center justify-between border border-brand-hair shadow-whisper"
              >
                <div class="min-w-0 pr-1.5">
                  <p class="text-[11px] font-bold text-brand-ink m-0 leading-tight truncate">
                    Tas Komuter EDC
                  </p>
                  <p class="text-[10px] text-brand-muted m-0 truncate">Tahan Cuaca</p>
                </div>
                <span class="text-[11px] font-bold text-brand-accent shrink-0">Rp1.120.000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
