<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'
import { useProductStore } from '~/features/products/stores/product'

const { isLoggedIn } = useAuth()

let productStore: ReturnType<typeof useProductStore> | null = null
try {
  productStore = useProductStore()
} catch {
  productStore = null
}

const catalogMetricValue = computed(() => {
  const count = productStore?.products?.filter((p) => !p.deleted_at).length ?? 0
  return count > 0 ? `${count} Koleksi` : 'Terkurasi'
})
</script>

<template>
  <section class="w-full pt-2">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      <!-- Left Column: Editorial Statement & Actions -->
      <div class="lg:col-span-6 flex flex-col justify-center space-y-6">
        <div class="space-y-4">
          <h1
            class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-ink leading-[1.08] text-balance m-0"
          >
            Perlengkapan kerja dan ruang hidup yang dirancang tahan lama.
          </h1>

          <p class="font-body text-base sm:text-lg text-brand-muted max-w-xl leading-relaxed m-0">
            ShelfStack mengkurasi perangkat audio, periferal meja kerja, dan furnitur minimalis
            berstandar material jelas dan bergaransi resmi.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 pt-1">
          <NuxtLink
            to="/katalog"
            class="bg-brand-ink text-brand-onink font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-brand-inkhover transition-colors flex items-center gap-2 no-underline shadow-whisper min-h-[44px]"
          >
            <span>Lihat Katalog</span>
            <i class="pi pi-arrow-right text-xs" aria-hidden="true" />
          </NuxtLink>

          <NuxtLink
            v-if="!isLoggedIn"
            to="/auth/login"
            class="bg-brand-canvas-soft hover:bg-brand-field text-brand-ink font-semibold text-sm px-6 py-3.5 rounded-full transition-colors border border-brand-hair flex items-center gap-2 no-underline shadow-whisper min-h-[44px]"
          >
            <span>Masuk</span>
          </NuxtLink>
        </div>

        <div class="pt-5 border-t border-brand-hair/60 grid grid-cols-3 gap-4 max-w-md">
          <div>
            <p
              class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tracking-tight tabular-nums"
            >
              {{ catalogMetricValue }}
            </p>
            <p class="font-body text-xs text-brand-muted m-0 mt-0.5 font-medium">Produk Aktif</p>
          </div>
          <div>
            <p
              class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tracking-tight tabular-nums"
            >
              5 Kategori
            </p>
            <p class="font-body text-xs text-brand-muted m-0 mt-0.5 font-medium">
              Kerja &amp; Rumah
            </p>
          </div>
          <div>
            <p
              class="font-display text-xl sm:text-2xl font-bold m-0 tracking-tight flex items-center gap-1 text-brand-success-text tabular-nums"
            >
              <span>7 Hari</span>
              <i class="pi pi-verified text-sm text-brand-success" aria-hidden="true" />
            </p>
            <p class="font-body text-xs text-brand-muted m-0 mt-0.5 font-medium">Jaminan Retur</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Interactive Curatorial Category Showcase Mosaic -->
      <div class="lg:col-span-6 relative">
        <div class="grid grid-cols-12 gap-3 h-80 sm:h-96">
          <NuxtLink
            to="/c/tech"
            aria-label="Jelajahi kategori Tech dan Gadget"
            class="col-span-7 bg-brand-canvas-soft rounded-card overflow-hidden relative group border border-brand-hair shadow-whisper h-full block no-underline"
          >
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwVY6_XJIJ--I5tlVeVHvg6ErT_oBXt2avwd8dlAuTVukdzmLAppAhyNQAGXm3rQFEX1mHUEJ1GZ0wxvknebBIyNihYqTnXUswGHZuBSXpTUJrW6irkYFSwJUdz3lXaf3SIaU32wSKZaVrV6lC7Krf-diQ9YtZ80tMZPN0gDm7158w3dT3TGRm9DJY3Zr0K4RKBXS_5cVnFyD0hA50xpvdjViEWoa2fQmCh6xzjHcub1jp-D9HREja"
              alt="Headphone Nirkabel Studio dalam koleksi Tech & Gadget"
              width="800"
              height="800"
              fetchpriority="high"
              decoding="async"
            />
            <div
              class="absolute bottom-3 left-3 right-3 bg-brand-canvas/95 backdrop-blur-md rounded-full px-3.5 py-2 flex items-center justify-between border border-brand-hair shadow-whisper"
            >
              <div class="min-w-0 pr-2">
                <p class="text-xs font-bold text-brand-ink m-0 leading-tight truncate">
                  Audio &amp; Gadget Kerja
                </p>
                <p class="text-[11px] text-brand-muted m-0 truncate">Kategori Tech</p>
              </div>
              <span class="text-xs font-bold text-brand-accent-text shrink-0">Jelajahi</span>
            </div>
          </NuxtLink>

          <div class="col-span-5 flex flex-col gap-3 h-full">
            <NuxtLink
              to="/c/home"
              aria-label="Jelajahi kategori Rumah dan Dapur"
              class="flex-1 min-h-0 bg-brand-canvas-soft rounded-card overflow-hidden relative group border border-brand-hair shadow-whisper block no-underline"
            >
              <img
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhuBSFbEmAvUs-dIR2YRW-AgUpd_FXgqc62yOMrFXAqiJxphILJy3g73g9zMSiczWs5C_QAJAN1CjOVg_pzST382d0uUBGS5pFhsCPOFK1nOrZaHe-97eQ5JqcvSwsi3UzEkT3yFNe2vkYGKvByoxn2fF4xlojiv56WR8B1rwrUZFxLT-WZVzHWHvp1T17Fqfe44ym_WRhnIIM_2T_g3dkxEIvLv9oyO86-o48wqWDKZfPrK2obggw"
                alt="Lampu Meja Kerja dalam koleksi Rumah & Dapur"
                width="480"
                height="360"
                decoding="async"
              />
              <div
                class="absolute bottom-2.5 left-2.5 right-2.5 bg-brand-canvas/95 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center justify-between border border-brand-hair shadow-whisper"
              >
                <div class="min-w-0 pr-1.5">
                  <p class="text-[11px] font-bold text-brand-ink m-0 leading-tight truncate">
                    Pencahayaan Meja
                  </p>
                  <p class="text-[10px] text-brand-muted m-0 truncate">Rumah &amp; Dapur</p>
                </div>
                <i class="pi pi-arrow-right text-[10px] text-brand-accent shrink-0" />
              </div>
            </NuxtLink>

            <NuxtLink
              to="/c/lifestyle"
              aria-label="Jelajahi kategori Pakaian dan Aksesoris"
              class="flex-1 min-h-0 bg-brand-canvas-soft rounded-card overflow-hidden relative group border border-brand-hair shadow-whisper block no-underline"
            >
              <img
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmK-nhltzS02RWfXj2Rx0Z8IvcV4TaPXHuYYeWMUhax_zC2LYbpNt--0RSd434mVakffTmk5s3va6NmCFXP32mL8xAUGwVx2oxYnYz_MI8jzlChs_vH53-QpQZQN9HgXIrNIxEUh-Gqko7SDdTs-v0pIb9qEn65QsCAFwAPLeEveKSsEmDVLW9YfSvaX7Q_HkhaHpfmUVv35TntI0JCNP3GnMk9WRyV4KVSnNZt_4xLlROZJMms7kg"
                alt="Tas Komuter Multifungsi dalam koleksi Pakaian & Aksesoris"
                width="480"
                height="360"
                decoding="async"
              />
              <div
                class="absolute bottom-2.5 left-2.5 right-2.5 bg-brand-canvas/95 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center justify-between border border-brand-hair shadow-whisper"
              >
                <div class="min-w-0 pr-1.5">
                  <p class="text-[11px] font-bold text-brand-ink m-0 leading-tight truncate">
                    Perlengkapan EDC
                  </p>
                  <p class="text-[10px] text-brand-muted m-0 truncate">Gaya Hidup</p>
                </div>
                <i class="pi pi-arrow-right text-[10px] text-brand-accent shrink-0" />
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
