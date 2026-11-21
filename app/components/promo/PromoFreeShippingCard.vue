<template>
  <article
    class="relative bg-brand-canvas border border-brand-hair hover:border-amber-300 rounded-2xl shadow-whisper overflow-hidden transition-all duration-200 flex"
  >
    <!-- Left Badge Stub -->
    <div
      class="w-24 sm:w-28 shrink-0 bg-amber-50/80 p-3 sm:p-3.5 flex flex-col justify-between items-center text-center"
    >
      <UiBadge label="Ekspedisi" variant="warning" />
      <div class="my-auto py-1">
        <p
          class="text-xl sm:text-2xl font-extrabold text-amber-800 tracking-tight leading-none whitespace-nowrap"
        >
          BEBAS
        </p>
        <p class="text-[10px] font-semibold text-amber-700 leading-tight mt-0.5">Ongkir</p>
      </div>
      <p
        class="text-[10px] font-medium text-brand-muted pt-1.5 border-t border-amber-200/50 w-full truncate"
      >
        Min. Rp 500rb
      </p>
    </div>

    <!-- Right Details -->
    <div class="flex-1 p-3 sm:p-3.5 flex flex-col justify-between space-y-2.5 min-w-0">
      <div>
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-xs sm:text-sm font-bold text-brand-ink truncate">
            Gratis Ongkos Kirim Seluruh Indonesia
          </h2>
          <UiBadge label="Otomatis" variant="warning" />
        </div>
        <p class="mt-1 text-xs text-brand-muted leading-relaxed line-clamp-2">
          Potongan ongkos kirim otomatis aktif saat belanja mencapai Rp 500.000 untuk kurir JNE,
          SiCepat, dan J&amp;T.
        </p>
      </div>

      <div class="flex items-center justify-between gap-3 pt-2 border-t border-brand-hairsoft">
        <span class="text-[11px] text-brand-muted"> Terpotong otomatis di form pengiriman. </span>
        <UiButton to="/katalog" variant="accent" size="xs">Belanja Sekarang</UiButton>
      </div>
    </div>
  </article>
</template>
