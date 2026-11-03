<script setup lang="ts">
defineProps<{
  tab: 'wallet' | 'public'
  isLoggedIn: boolean
}>()

const emit = defineEmits<{
  switchTab: [tab: 'wallet' | 'public']
}>()
</script>

<template>
  <div class="rounded-xl border border-dashed border-brand-hair p-6 text-center">
    <div
      class="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-canvas-soft text-brand-muted"
    >
      <i
        :class="[
          'text-base',
          tab === 'wallet' ? (isLoggedIn ? 'pi pi-ticket' : 'pi pi-user') : 'pi pi-tag',
        ]"
      />
    </div>

    <div v-if="tab === 'wallet'">
      <template v-if="!isLoggedIn">
        <h4 class="m-0 text-xs font-bold text-brand-ink">Masuk untuk Melihat Voucher Saya</h4>
        <p class="m-0 mt-1 text-[11.5px] text-brand-muted max-w-xs mx-auto">
          Masuk ke akun Anda untuk melihat voucher yang sudah Anda klaim di dompet.
        </p>
        <button
          type="button"
          class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-ink/90 transition-colors cursor-pointer border-0"
          @click="emit('switchTab', 'public')"
        >
          <span>Lihat Promo Tersedia</span>
          <i class="pi pi-arrow-right text-[10px]" />
        </button>
      </template>

      <template v-else>
        <h4 class="m-0 text-xs font-bold text-brand-ink">Belum Ada Voucher Tersimpan</h4>
        <p class="m-0 mt-1 text-[11.5px] text-brand-muted max-w-xs mx-auto">
          Dompet voucher Anda masih kosong. Temukan penawaran terbaik di tab Promo Tersedia.
        </p>
        <button
          type="button"
          class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-ink/90 transition-colors cursor-pointer border-0"
          @click="emit('switchTab', 'public')"
        >
          <span>Jelajahi Promo Tersedia</span>
          <i class="pi pi-arrow-right text-[10px]" />
        </button>
      </template>
    </div>

    <div v-else>
      <h4 class="m-0 text-xs font-bold text-brand-ink">Belum Ada Promo Publik Tersedia</h4>
      <p class="m-0 mt-1 text-[11.5px] text-brand-muted max-w-xs mx-auto">
        Saat ini belum ada promo publik aktif. Anda tetap bisa memasukkan kode kupon khusus secara
        manual di atas.
      </p>
    </div>
  </div>
</template>
