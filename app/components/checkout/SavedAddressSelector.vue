<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UserAddress, CreateAddressInput } from '~~/shared/schemas/address'
import { useAddresses } from '~/composables/useAddresses'
import SavedAddressForm from '~/components/checkout/SavedAddressForm.vue'

const props = withDefaults(
  defineProps<{
    selectedId?: string | null
  }>(),
  {
    selectedId: null,
  },
)

const emit = defineEmits<{
  select: [address: UserAddress]
}>()

const { addresses, loading, error, fetchAddresses, saveAddress, selectDefault } = useAddresses()

const isAddingNew = ref(false)
const isSubmittingNew = ref(false)
const addFormError = ref('')

onMounted(async () => {
  await fetchAddresses()
  if (addresses.value.length > 0) {
    const target = props.selectedId
      ? addresses.value.find((a) => a.id === props.selectedId)
      : addresses.value.find((a) => a.is_default) || addresses.value[0]

    if (target) {
      emit('select', target)
    }
  }
})

const handleSelect = (addr: UserAddress) => {
  emit('select', addr)
}

const handleSetDefault = async (addr: UserAddress, event: Event) => {
  event.stopPropagation()
  try {
    await selectDefault(addr.id)
    emit('select', addr)
  } catch {
    // Error is exposed in composable error state
  }
}

const openAddForm = () => {
  addFormError.value = ''
  isAddingNew.value = true
}

const cancelAddForm = () => {
  isAddingNew.value = false
  addFormError.value = ''
}

const handleSaveNewAddress = async (data: CreateAddressInput) => {
  addFormError.value = ''
  isSubmittingNew.value = true
  try {
    const created = await saveAddress(data)
    isAddingNew.value = false
    emit('select', created)
  } catch (err: unknown) {
    const errObj = err as { data?: { message?: string } } | null
    addFormError.value =
      errObj?.data?.message ||
      (err instanceof Error ? err.message : '') ||
      'Gagal menyimpan alamat baru.'
  } finally {
    isSubmittingNew.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Action -->
    <div class="flex items-center justify-between gap-2 pb-1">
      <div class="flex items-center gap-2">
        <i class="pi pi-bookmark text-brand-accent text-sm" />
        <h3 class="font-display text-sm font-bold text-brand-ink m-0">Alamat Tersimpan</h3>
        <span
          v-if="!loading && addresses.length > 0"
          class="text-[11px] font-semibold text-brand-muted bg-brand-canvas-soft px-2 py-0.5 rounded-full border border-brand-hairsoft"
        >
          {{ addresses.length }}
        </span>
      </div>

      <UiButton
        v-if="!isAddingNew"
        variant="outline"
        size="sm"
        icon="pi-plus"
        class="text-xs"
        @click="openAddForm"
      >
        Tambah Alamat Baru
      </UiButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="i in 2"
        :key="i"
        class="border border-brand-hairsoft rounded-card p-4 bg-brand-canvas-soft/40 animate-pulse space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="h-4 w-28 bg-brand-hair rounded" />
          <div class="h-4 w-12 bg-brand-hair rounded" />
        </div>
        <div class="h-3 w-44 bg-brand-hair/70 rounded" />
        <div class="h-3 w-36 bg-brand-hair/70 rounded" />
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="p-3 bg-brand-danger-tint border border-brand-danger-edge rounded-card flex items-center justify-between text-xs text-brand-danger-text"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle shrink-0" />
        <span>{{ error }}</span>
      </div>
      <UiButton
        variant="ghost"
        size="sm"
        class="text-xs text-brand-danger-text"
        @click="fetchAddresses"
      >
        Coba Lagi
      </UiButton>
    </div>

    <!-- Form Tambah Alamat Baru Modular Component -->
    <SavedAddressForm
      v-if="isAddingNew"
      :is-submitting="isSubmittingNew"
      :error="addFormError"
      :initial-default="addresses.length === 0"
      @save="handleSaveNewAddress"
      @cancel="cancelAddForm"
    />

    <!-- Empty State -->
    <div
      v-else-if="!loading && addresses.length === 0"
      class="p-6 border border-dashed border-brand-hair rounded-card text-center bg-brand-canvas-soft space-y-2"
    >
      <i class="pi pi-map text-2xl text-brand-muted" />
      <h4 class="font-display font-semibold text-xs sm:text-sm text-brand-ink m-0">
        Belum ada alamat tersimpan
      </h4>
      <p class="text-xs text-brand-muted m-0 max-w-sm mx-auto">
        Simpan alamat pengiriman untuk mempercepat transaksi pemesanan berikutnya.
      </p>
      <div class="pt-2">
        <UiButton variant="primary" size="sm" icon="pi-plus" class="text-xs" @click="openAddForm">
          Tambah Alamat Baru
        </UiButton>
      </div>
    </div>

    <!-- List Saved Address Cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="addr in addresses"
        :key="addr.id"
        :class="[
          'relative p-4 rounded-card border-2 transition-all duration-150 text-left cursor-pointer flex flex-col justify-between gap-3',
          selectedId === addr.id
            ? 'border-brand-ink bg-brand-canvas-soft/40 shadow-whisper'
            : 'border-brand-hair bg-brand-canvas hover:border-brand-ink/30 hover:shadow-whisper',
        ]"
        @click="handleSelect(addr)"
      >
        <div class="space-y-1.5">
          <!-- Top Row: Name, Phone & Badge -->
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <span class="font-display font-bold text-xs sm:text-sm text-brand-ink block truncate">
                {{ addr.name }}
              </span>
              <span class="text-[11px] text-brand-muted block">
                {{ addr.phone }}
              </span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <span
                v-if="addr.is_default"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-success-tint text-brand-success-text border border-brand-success-edge"
              >
                Utama
              </span>
              <button
                v-else
                type="button"
                class="text-[10px] text-brand-muted hover:text-brand-ink hover:underline transition-colors border-0 bg-transparent cursor-pointer p-0"
                title="Jadikan Alamat Utama"
                @click="(e) => handleSetDefault(addr, e)"
              >
                Set Utama
              </button>
            </div>
          </div>

          <!-- Street & City -->
          <p class="text-xs text-brand-ink m-0 leading-relaxed line-clamp-2">
            {{ addr.street }}
          </p>
          <p class="text-[11px] text-brand-muted m-0">{{ addr.city }}, {{ addr.postal }}</p>

          <!-- Note -->
          <div
            v-if="addr.note"
            class="text-[11px] text-brand-muted/90 flex items-center gap-1 pt-1 border-t border-brand-hairsoft truncate"
          >
            <i class="pi pi-info-circle text-[10px] shrink-0" />
            <span class="truncate">{{ addr.note }}</span>
          </div>
        </div>

        <!-- Action / Selection Status -->
        <div class="pt-2 border-t border-brand-hairsoft flex items-center justify-between gap-2">
          <div
            v-if="selectedId === addr.id"
            class="flex items-center gap-1.5 text-xs text-brand-accent font-semibold"
          >
            <i class="pi pi-check-circle text-sm" />
            <span>Alamat Terpilih</span>
          </div>
          <span v-else class="text-[11px] text-brand-muted"> Klik untuk memilih </span>

          <UiButton
            v-if="selectedId !== addr.id"
            variant="secondary"
            size="sm"
            class="text-[11px] py-1 px-3"
            @click.stop="handleSelect(addr)"
          >
            Pilih Alamat Ini
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
