<script setup lang="ts">
import {
  CONTACT_STATUS_FILTER_OPTIONS as statusFilterOptions,
  CONTACT_STATUS_SELECT_OPTIONS as statusSelectOptions,
  formatContactDateTime as formatDateTime,
  getContactStatusBadge as getStatusBadge,
  useAdminContacts,
} from '~/composables/useAdminContacts'

const {
  items,
  statusFilter,
  searchQuery,
  loading,
  saving,
  errorMsg,
  editState,
  selectedItem,
  hasActiveFilters,
  selectContact,
  fetchContacts,
  saveUpdate,
  applyStatusFilter,
  resetFilters,
  triggerSearchNow: triggerNow,
} = useAdminContacts()
</script>

<template>
  <div class="flex flex-col gap-2.5 md:flex-1 md:min-h-0">
    <div class="flex flex-wrap items-center justify-between gap-2.5 pt-0.5 shrink-0">
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="opt in statusFilterOptions"
          :key="opt.value"
          type="button"
          class="inline-flex h-8 items-center px-3.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer"
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

      <form class="w-full sm:w-64" @submit.prevent="triggerNow">
        <label for="admin-contact-search" class="sr-only">Cari pesan kontak</label>
        <UiInput
          id="admin-contact-search"
          v-model="searchQuery"
          type="search"
          size="sm"
          left-icon="pi-search"
          placeholder="Cari tiket, nama, email..."
        />
      </form>
    </div>

    <UiAlert v-if="errorMsg" tone="danger" class="text-xs shrink-0">
      <div class="flex items-center justify-between gap-2">
        <span>{{ errorMsg }}</span>
        <UiButton size="sm" variant="outline" @click="fetchContacts">Coba Lagi</UiButton>
      </div>
    </UiAlert>

    <div v-if="loading && items.length === 0" class="space-y-3" aria-busy="true">
      <div v-for="i in 4" :key="i" class="h-16 rounded-card bg-brand-field animate-pulse" />
    </div>

    <UiEmptyState
      v-else-if="items.length === 0"
      :icon="hasActiveFilters ? 'pi-search' : 'pi-envelope'"
      :title="hasActiveFilters ? 'Tidak Ada Pesan Ditemukan' : 'Belum Ada Pesan Kontak'"
      :description="
        hasActiveFilters
          ? 'Ubah kata kunci pencarian atau filter status untuk melihat pesan lain.'
          : 'Pesan yang dikirim pelanggan melalui formulir /contact akan tampil di sini.'
      "
      :action-label="hasActiveFilters ? 'Reset Filter' : ''"
      @action="resetFilters"
    />

    <div
      v-else
      :aria-busy="loading ? 'true' : undefined"
      :class="[
        'grid grid-cols-1 lg:grid-cols-12 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper overflow-hidden md:flex-1 md:min-h-0 transition-opacity',
        loading ? 'opacity-60' : '',
      ]"
    >
      <div
        class="lg:col-span-5 divide-y divide-brand-hairsoft border-b lg:border-b-0 lg:border-r border-brand-hair overflow-y-auto max-h-[360px] lg:max-h-none md:h-full"
      >
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="w-full text-left p-3.5 transition-colors cursor-pointer border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
          :class="
            selectedItem?.id === item.id
              ? 'bg-brand-canvas-soft border-l-2 border-l-brand-ink'
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
