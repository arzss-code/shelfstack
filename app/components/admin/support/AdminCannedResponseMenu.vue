<script setup lang="ts">
import { ref, computed } from 'vue'

export interface CannedResponseItem {
  key: string
  label: string
  text: string
}

const emit = defineEmits<{
  select: [text: string]
  selectResponse: [text: string]
}>()

const cannedResponses: CannedResponseItem[] = [
  {
    key: 'greeting',
    label: 'Salam Pembuka',
    text: 'Halo! Ada yang bisa kami bantu terkait pesanan Anda hari ini?',
  },
  {
    key: 'ask_order_id',
    label: 'Permintaan Nomor Pesanan',
    text: 'Boleh informasikan nomor pesanan resmi Anda?',
  },
  {
    key: 'shipping_info',
    label: 'Informasi Estimasi Pengiriman',
    text: 'Pesanan Anda saat ini dalam proses penyiapan oleh tim gudang sentral.',
  },
  {
    key: 'refund_processed',
    label: 'Konfirmasi Pengembalian Dana',
    text: 'Pengajuan pengembalian dana telah berhasil diproses.',
  },
  {
    key: 'closing_resolved',
    label: 'Salam Penutup & Kendala Selesai',
    text: 'Senang bisa membantu Anda! Selamat beraktivitas.',
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
    class="canned-response-menu w-72 rounded-card border border-brand-hair bg-white p-2 shadow-floating"
  >
    <div class="flex items-center justify-between px-2 py-1">
      <span class="text-xs font-semibold text-brand-muted">Pilih Pesan Cepat</span>
      <span class="text-[10px] text-brand-faint tabular-nums"
        >{{ filteredResponses.length }} template</span
      >
    </div>

    <!-- Optional quick filter for canned responses -->
    <div v-if="cannedResponses.length > 5" class="px-1 py-1">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari template..."
        class="w-full rounded border border-brand-hair px-2 py-1 text-[11px] text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:outline-none transition-colors"
      />
    </div>

    <!-- List of Canned Responses -->
    <div class="mt-1 space-y-0.5 max-h-60 overflow-y-auto">
      <button
        v-for="item in filteredResponses"
        :key="item.key"
        type="button"
        :data-key="item.key"
        class="canned-item canned-response-btn w-full rounded p-2 text-left text-xs transition-colors hover:bg-brand-canvas-soft focus:bg-brand-canvas-soft focus:outline-none"
        @click="onSelectResponse(item.text)"
      >
        <div class="font-medium text-brand-ink">{{ item.label }}</div>
        <div class="truncate text-brand-muted mt-0.5">{{ item.text }}</div>
      </button>
    </div>
  </div>
</template>
