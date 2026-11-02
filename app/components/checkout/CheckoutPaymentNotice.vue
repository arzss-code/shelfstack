<script setup lang="ts">
const config = useRuntimeConfig()
const isSandbox = computed(() => Boolean(config.public.enableMidtransSandbox))

const paymentChannels = ['QRIS', 'GoPay', 'ShopeePay', 'BCA VA', 'Mandiri VA', 'BNI VA', 'BRI VA']
</script>

<template>
  <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft">
      <div class="flex items-center gap-2">
        <i class="pi pi-credit-card text-brand-ink text-base" />
        <h2 class="font-display text-base font-bold text-brand-ink m-0">Metode Pembayaran</h2>
      </div>
      <span class="text-[11px] text-brand-muted">Midtrans Snap Gateway</span>
    </div>

    <!-- Payment Notice Body -->
    <div class="p-4 bg-brand-canvas-soft/60 rounded-xl border border-brand-hairsoft space-y-3">
      <div class="flex items-start gap-3">
        <div
          class="w-8 h-8 rounded-lg bg-brand-ink text-white flex items-center justify-center shrink-0 mt-0.5"
        >
          <i class="pi pi-shield text-sm" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-display font-bold text-xs sm:text-sm text-brand-ink m-0">
              {{
                isSandbox
                  ? 'Simulasi Pembayaran (Sandbox Test Mode)'
                  : 'Gateway Pembayaran Aman Terverifikasi'
              }}
            </h3>
            <span
              v-if="isSandbox"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
            >
              Sandbox
            </span>
          </div>
          <p class="text-xs text-brand-muted m-0 mt-1 leading-relaxed">
            <template v-if="isSandbox">
              Mode simulasi sandbox aktif untuk pengujian. Anda dapat menyelesaikan transaksi
              simulasi melalui QRIS, GoPay, atau Virtual Account tanpa memotong dana nyata.
            </template>
            <template v-else>
              Pembayaran diproses secara instan melalui sistem Midtrans dengan verifikasi otomatis
              tanpa perlu konfirmasi manual.
            </template>
          </p>
        </div>
      </div>

      <!-- Supported Channels Pill Strip -->
      <div class="pt-3 border-t border-brand-hairsoft">
        <p class="text-[11px] text-brand-muted mb-2 font-medium">Saluran Pembayaran Resmi:</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="channel in paymentChannels"
            :key="channel"
            class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-brand-hair text-brand-ink"
          >
            {{ channel }}
          </span>
        </div>
      </div>
    </div>

    <!-- Security Trust Badges -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-brand-muted pt-1">
      <div class="flex items-center gap-1.5">
        <i class="pi pi-lock text-brand-ink text-xs" />
        <span>Enkripsi SSL 256-Bit</span>
      </div>
      <div class="flex items-center gap-1.5">
        <i class="pi pi-check-circle text-brand-ink text-xs" />
        <span>Verifikasi Instan</span>
      </div>
      <div class="flex items-center gap-1.5">
        <i class="pi pi-verified text-brand-ink text-xs" />
        <span>Lisensi Resmi Bank Indonesia</span>
      </div>
    </div>
  </div>
</template>
