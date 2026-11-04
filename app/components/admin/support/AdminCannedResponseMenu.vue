<script setup lang="ts">
import { ref, computed } from 'vue'

export interface CannedResponseItem {
  key: string
  label: string
  text: string
  category?: string
}

const emit = defineEmits<{
  select: [text: string]
  selectResponse: [text: string]
  close: []
}>()

const cannedResponses: CannedResponseItem[] = [
  {
    key: 'greeting',
    label: 'Salam Pembuka',
    text: 'Halo! Ada yang bisa kami bantu terkait pesanan Anda hari ini?',
    category: 'Umum',
  },
  {
    key: 'ask_order_id',
    label: 'Permintaan Nomor Pesanan',
    text: 'Boleh informasikan nomor pesanan resmi Anda?',
    category: 'Pesanan',
  },
  {
    key: 'shipping_info',
    label: 'Informasi Estimasi Pengiriman',
    text: 'Pesanan Anda saat ini dalam proses penyiapan oleh tim gudang sentral.',
    category: 'Logistik',
  },
  {
    key: 'refund_processed',
    label: 'Konfirmasi Pengembalian Dana',
    text: 'Pengajuan pengembalian dana telah berhasil diproses.',
    category: 'Keuangan',
  },
  {
    key: 'closing_resolved',
    label: 'Salam Penutup & Kendala Selesai',
    text: 'Senang bisa membantu Anda! Selamat beraktivitas.',
    category: 'Penutup',
  },
]

const searchQuery = ref('')

const filteredResponses = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return cannedResponses
  return cannedResponses.filter(
    (item) => item.label.toLowerCase().includes(q) || item.text.toLowerCase().includes(q),
  )
})

const onSelectResponse = (text: string) => {
  emit('select', text)
  emit('selectResponse', text)
}
</script>

<template>
  <div
    class="canned-response-menu w-80 rounded-card border border-brand-hair bg-white p-3 shadow-floating text-brand-ink z-40"
  >
    <div class="flex items-center justify-between pb-2 mb-2 border-b border-brand-hair">
      <div class="flex items-center gap-1.5">
        <i class="pi pi-bolt text-xs text-brand-accent" />
        <span class="text-xs font-bold text-brand-ink">Respon Cepat</span>
      </div>
      <span class="text-[10px] font-medium text-brand-muted tabular-nums">
        {{ filteredResponses.length }} template
      </span>
    </div>

    <!-- Search Input -->
    <div class="relative mb-2">
      <i
        class="pi pi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted"
      />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari template balasan..."
        class="w-full rounded-field border border-brand-hair bg-brand-canvas-soft pl-7 pr-2 py-1 text-[11px] text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:bg-white focus:outline-none transition-colors"
      />
    </div>

    <!-- List of Canned Responses -->
    <div class="space-y-1 max-h-64 overflow-y-auto pr-0.5">
      <button
        v-for="item in filteredResponses"
        :key="item.key"
        type="button"
        :data-key="item.key"
        class="canned-item canned-response-btn group w-full rounded-field p-2 text-left text-xs transition-colors hover:bg-brand-canvas-soft border border-transparent hover:border-brand-hair focus:bg-brand-canvas-soft focus:outline-none"
        @click="onSelectResponse(item.text)"
      >
        <div class="flex items-center justify-between gap-1">
          <span
            class="font-semibold text-brand-ink group-hover:text-brand-accent transition-colors"
          >
            {{ item.label }}
          </span>
          <span
            v-if="item.category"
            class="text-[9px] font-medium px-1.5 py-0.2 rounded bg-brand-canvas border border-brand-hair text-brand-muted"
          >
            {{ item.category }}
          </span>
        </div>
        <p class="truncate text-brand-muted text-[11px] mt-1 m-0 leading-tight">
          {{ item.text }}
        </p>
      </button>
    </div>
  </div>
</template>
