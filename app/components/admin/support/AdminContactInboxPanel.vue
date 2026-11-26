<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { ContactMessageStatus } from '~~/shared/schemas/contact'

interface ContactInboxItem {
  id: string
  ticket_code: string
  name: string
  email: string
  category: string
  order_number: string | null
  message: string
  status: ContactMessageStatus
  admin_notes: string | null
  resolved_at: string | null
  created_at: string
}

const toast = useUiToast()

const items = ref<ContactInboxItem[]>([])
const selectedId = ref<string | null>(null)
const statusFilter = ref<'all' | ContactMessageStatus>('all')
const searchQuery = ref('')
const loading = ref(true)
const saving = ref(false)
const errorMsg = ref<string | null>(null)

const editState = reactive<{
  status: ContactMessageStatus
  admin_notes: string
}>({
  status: 'open',
  admin_notes: '',
})

const selectedItem = computed(() => items.value.find((i) => i.id === selectedId.value) || null)

const statusFilterOptions: Array<{ value: 'all' | ContactMessageStatus; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'open', label: 'Baru' },
  { value: 'in_progress', label: 'Diproses' },
  { value: 'resolved', label: 'Selesai' },
]

const statusSelectOptions = [
  { value: 'open', label: 'Baru (Open)' },
  { value: 'in_progress', label: 'Sedang Diproses' },
  { value: 'resolved', label: 'Selesai Ditindaklanjuti' },
]

function getStatusBadge(status: ContactMessageStatus): {
  label: string
  variant: 'warning' | 'info' | 'success'
} {
  if (status === 'resolved') return { label: 'Selesai', variant: 'success' }
  if (status === 'in_progress') return { label: 'Diproses', variant: 'info' }
  return { label: 'Baru', variant: 'warning' }
}

function selectContact(item: ContactInboxItem) {
  selectedId.value = item.id
  editState.status = item.status
  editState.admin_notes = item.admin_notes || ''
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchContacts() {
  loading.value = true
  errorMsg.value = null
  try {
    const res = await $fetch<{
      data: { items: ContactInboxItem[] }
    }>('/api/admin/contacts', {
      params: {
        status: statusFilter.value,
        q: searchQuery.value.trim() || undefined,
      },
    })
    items.value = res.data?.items || []
    if (items.value.length > 0 && !selectedItem.value) {
      selectContact(items.value[0]!)
    }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    errorMsg.value = e.data?.message || e.message || 'Gagal memuat inbox pesan kontak.'
  } finally {
    loading.value = false
  }
}

async function saveUpdate() {
  if (!selectedItem.value) return
  saving.value = true
  try {
    const res = await $fetch<{ data: ContactInboxItem }>(
      `/api/admin/contacts/${selectedItem.value.id}`,
      {
        method: 'PATCH',
        body: {
          status: editState.status,
          admin_notes: editState.admin_notes.trim() || null,
        },
      },
    )
    const idx = items.value.findIndex((i) => i.id === selectedItem.value?.id)
    if (idx !== -1 && res.data) {
      items.value[idx] = res.data
    }
    toast.show({ title: 'Tersimpan', message: 'Status pesan kontak diperbarui.', tone: 'success' })
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    toast.show({
      title: 'Gagal Memperbarui',
      message: e.data?.message || e.message || 'Gagal memperbarui status pesan kontak.',
      tone: 'error',
    })
  } finally {
    saving.value = false
  }
}

function applyStatusFilter(value: 'all' | ContactMessageStatus) {
  statusFilter.value = value
  fetchContacts()
}

onMounted(() => {
  fetchContacts()
})
</script>

<template>
  <div class="flex flex-col gap-3 md:flex-1 md:min-h-0 md:overflow-hidden">
    <div class="flex flex-wrap items-center justify-between gap-2.5 shrink-0">
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="opt in statusFilterOptions"
          :key="opt.value"
          type="button"
          class="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer min-h-[34px]"
          :class="
            statusFilter === opt.value
              ? 'bg-brand-ink text-brand-onink border-brand-ink'
              : 'bg-brand-canvas text-brand-muted border-brand-hair hover:text-brand-ink'
          "
          @click="applyStatusFilter(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <form class="flex items-center gap-2 w-full sm:w-auto" @submit.prevent="fetchContacts">
        <div class="w-full sm:w-64">
          <label for="admin-contact-search" class="sr-only">Cari pesan kontak</label>
          <UiInput
            id="admin-contact-search"
            v-model="searchQuery"
            size="sm"
            left-icon="pi-search"
            placeholder="Cari tiket, nama, email..."
          />
        </div>
        <UiButton type="submit" size="sm" variant="secondary">Cari</UiButton>
      </form>
    </div>

    <UiAlert v-if="errorMsg" tone="danger" class="text-xs shrink-0">
      <div class="flex items-center justify-between gap-2">
        <span>{{ errorMsg }}</span>
        <UiButton size="sm" variant="outline" @click="fetchContacts">Coba Lagi</UiButton>
      </div>
    </UiAlert>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-card bg-brand-field animate-pulse" />
    </div>

    <UiEmptyState
      v-else-if="items.length === 0"
      icon="pi-envelope"
      title="Belum Ada Pesan Kontak"
      description="Pesan yang dikirim pelanggan melalui formulir /contact akan tampil di sini."
    />

    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-12 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper overflow-hidden md:flex-1 md:min-h-0"
    >
      <div
        class="lg:col-span-5 divide-y divide-brand-hairsoft border-b lg:border-b-0 lg:border-r border-brand-hair overflow-y-auto max-h-[360px] lg:max-h-none md:h-full"
      >
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="w-full text-left p-4 transition-colors cursor-pointer border-0"
          :class="
            selectedItem?.id === item.id
              ? 'bg-brand-accent-tint/50 ring-1 ring-inset ring-brand-accent-edge'
              : 'bg-brand-canvas hover:bg-brand-canvas-soft'
          "
          @click="selectContact(item)"
        >
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-xs font-bold text-brand-ink">{{ item.ticket_code }}</span>
            <UiBadge
              :label="getStatusBadge(item.status).label"
              :variant="getStatusBadge(item.status).variant"
            />
          </div>
          <p class="m-0 text-xs font-semibold text-brand-ink truncate">
            {{ item.name }} · {{ item.category }}
          </p>
          <p class="m-0 mt-1 text-xs text-brand-muted line-clamp-2">{{ item.message }}</p>
        </button>
      </div>

      <div v-if="selectedItem" class="lg:col-span-7 p-4 space-y-3.5 overflow-y-auto md:h-full">
        <div
          class="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-brand-hairsoft"
        >
          <div>
            <h2 class="m-0 font-display text-base font-bold text-brand-ink">
              {{ selectedItem.category }}
            </h2>
            <p class="m-0 mt-1 text-xs text-brand-muted">
              {{ selectedItem.name }} ({{ selectedItem.email }}) ·
              {{ formatDateTime(selectedItem.created_at) }}
            </p>
            <p
              v-if="selectedItem.order_number"
              class="m-0 mt-1 text-xs text-brand-accent-text font-semibold"
            >
              No. Pesanan Terkait: {{ selectedItem.order_number }}
            </p>
          </div>
          <UiBadge
            :label="getStatusBadge(selectedItem.status).label"
            :variant="getStatusBadge(selectedItem.status).variant"
          />
        </div>

        <div
          class="rounded-card border border-brand-hairsoft bg-brand-canvas-soft p-4 text-xs text-brand-ink leading-relaxed whitespace-pre-line"
        >
          {{ selectedItem.message }}
        </div>

        <form class="space-y-3 pt-2 border-t border-brand-hairsoft" @submit.prevent="saveUpdate">
          <UiSelect
            v-model="editState.status"
            label="Status Penanganan"
            :options="statusSelectOptions"
            block
          />
          <UiTextarea
            v-model="editState.admin_notes"
            label="Catatan Tindak Lanjut Admin"
            placeholder="Catat hasil respons email atau eskalasi tim..."
            :rows="3"
          />
          <div class="flex justify-end">
            <UiButton type="submit" variant="primary" size="sm" :loading="saving">
              Simpan Tindak Lanjut
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
