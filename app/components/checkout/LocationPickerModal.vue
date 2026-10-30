<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  INDONESIA_PROVINCES,
  POPULAR_CITIES,
  getCitiesByProvince,
  searchLocations,
  type Province,
  type City,
} from '~~/shared/data/locations/indonesia-regions'
import type { LocationSelection } from '~~/shared/schemas/location'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
  }>(),
  { modelValue: false },
)

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  select: [location: LocationSelection]
}>()

const activeTab = ref<'search' | 'cascading'>('search')
const searchQuery = ref('')
const selectedProvince = ref<Province | null>(null)

const searchResults = computed<City[]>(() => {
  const q = searchQuery.value.trim()
  return q ? searchLocations(q, 30) : []
})

const citiesInProvince = computed<City[]>(() => {
  return selectedProvince.value ? getCitiesByProvince(selectedProvince.value.id) : []
})

const closeModal = () => {
  emit('update:modelValue', false)
  searchQuery.value = ''
  selectedProvince.value = null
}

const handleSelectCity = (city: City) => {
  emit('select', {
    cityId: city.id,
    cityName: city.name,
    provinceId: city.provinceId,
    provinceName: city.provinceName,
    postalCode: city.postalCode,
    type: city.type,
  })
  closeModal()
}

const handleSelectPopular = (pop: { id: string; name: string; postal: string }) => {
  const found = searchLocations(pop.name, 1)[0]
  if (found) {
    handleSelectCity(found)
  } else {
    searchQuery.value = pop.name
    activeTab.value = 'search'
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) closeModal()
}

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKeydown)
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      searchQuery.value = ''
      selectedProvince.value = null
      activeTab.value = 'search'
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-ink/50 backdrop-blur-xs"
      data-testid="location-picker-modal"
    >
      <div
        class="bg-white rounded-card border border-brand-hair shadow-whisper w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Modal Header -->
        <div
          class="p-4 sm:p-5 border-b border-brand-hairsoft flex items-center justify-between shrink-0"
        >
          <div>
            <h3 class="font-display font-bold text-base text-brand-ink m-0">
              Pilih Kota atau Kabupaten
            </h3>
            <p class="text-xs text-brand-muted m-0 mt-0.5">
              Data resmi 38 Provinsi &amp; 514 Kota/Kabupaten Indonesia
            </p>
          </div>
          <button
            type="button"
            class="w-8 h-8 rounded-full border border-brand-hair hover:border-brand-ink/40 text-brand-muted hover:text-brand-ink flex items-center justify-center transition-colors cursor-pointer"
            data-testid="close-location-modal"
            @click="closeModal"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </div>

        <!-- Search Bar & Chips -->
        <div class="p-4 border-b border-brand-hairsoft bg-brand-canvas-soft/40 shrink-0 space-y-3">
          <div class="relative flex items-center">
            <i
              class="pi pi-search absolute left-3.5 text-brand-muted text-xs pointer-events-none"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Ketik kota, kabupaten, atau kode pos (cth. Jakarta, Bandung, 40115)..."
              class="w-full pl-9 pr-9 py-2 text-xs rounded-full border border-brand-hair bg-white text-brand-ink placeholder:text-brand-faint focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink"
              data-testid="location-search-input"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-3 text-brand-muted hover:text-brand-ink cursor-pointer"
              @click="searchQuery = ''"
            >
              <i class="pi pi-times-circle text-xs" />
            </button>
          </div>

          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span class="text-brand-muted shrink-0 font-medium">Populer:</span>
            <button
              v-for="pop in POPULAR_CITIES.slice(0, 7)"
              :key="pop.id"
              type="button"
              class="px-2.5 py-0.5 rounded-full border border-brand-hair bg-white hover:border-brand-ink/40 text-brand-ink shrink-0 transition-colors cursor-pointer"
              @click="handleSelectPopular(pop)"
            >
              {{ pop.name }}
            </button>
          </div>
        </div>

        <!-- Mode Tabs -->
        <div class="flex border-b border-brand-hairsoft text-xs font-semibold shrink-0">
          <button
            type="button"
            class="flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer"
            :class="
              activeTab === 'search'
                ? 'border-brand-ink text-brand-ink bg-brand-canvas-soft/30'
                : 'border-transparent text-brand-muted hover:text-brand-ink'
            "
            @click="activeTab = 'search'"
          >
            Pencarian Cepat
          </button>
          <button
            type="button"
            class="flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer"
            :class="
              activeTab === 'cascading'
                ? 'border-brand-ink text-brand-ink bg-brand-canvas-soft/30'
                : 'border-transparent text-brand-muted hover:text-brand-ink'
            "
            @click="activeTab = 'cascading'"
          >
            Pilihan Bertingkat (Provinsi)
          </button>
        </div>

        <!-- View Body -->
        <div class="flex-1 overflow-y-auto p-4 divide-y divide-brand-hairsoft">
          <!-- TAB 1: Search / Autocomplete -->
          <template v-if="activeTab === 'search'">
            <div v-if="searchQuery.trim().length >= 2">
              <div v-if="searchResults.length > 0" class="space-y-1">
                <button
                  v-for="city in searchResults"
                  :key="city.id"
                  type="button"
                  class="w-full text-left p-3 rounded-xl hover:bg-brand-canvas-soft/60 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                  :data-testid="`city-result-${city.id}`"
                  @click="handleSelectCity(city)"
                >
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-display font-semibold text-xs text-brand-ink">{{
                        city.name
                      }}</span>
                      <span
                        class="text-[10px] px-1.5 py-0.2 rounded bg-brand-canvas-soft text-brand-muted border border-brand-hairsoft"
                      >
                        {{ city.type }}
                      </span>
                    </div>
                    <p class="text-[11px] text-brand-muted m-0 mt-0.5">{{ city.provinceName }}</p>
                  </div>
                  <span
                    class="font-mono text-xs font-semibold text-brand-ink bg-brand-field px-2 py-0.5 rounded"
                  >
                    {{ city.postalCode }}
                  </span>
                </button>
              </div>

              <div v-else class="text-center py-12 space-y-2">
                <i class="pi pi-search text-2xl text-brand-faint" />
                <p class="text-xs font-semibold text-brand-ink m-0">Lokasi Tidak Ditemukan</p>
                <p class="text-[11px] text-brand-muted m-0 max-w-xs mx-auto">
                  Tidak ada kota yang cocok dengan "{{ searchQuery }}". Silakan gunakan tab Pilihan
                  Bertingkat.
                </p>
              </div>
            </div>

            <div v-else class="text-center py-10 space-y-3">
              <i class="pi pi-map-marker text-2xl text-brand-muted" />
              <div>
                <p class="text-xs font-semibold text-brand-ink m-0">
                  Ketik Nama Kota atau Pilih Populer
                </p>
                <p class="text-[11px] text-brand-muted m-0 mt-0.5">
                  Ketik minimal 2 karakter untuk melihat saran otomatis kota &amp; kode pos
                </p>
              </div>
            </div>
          </template>

          <!-- TAB 2: Cascading Selector -->
          <template v-else>
            <div v-if="selectedProvince" class="space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-brand-hairsoft">
                <button
                  type="button"
                  class="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-ink cursor-pointer"
                  @click="selectedProvince = null"
                >
                  <i class="pi pi-arrow-left text-[10px]" />
                  <span>Kembali ke Daftar Provinsi</span>
                </button>
                <span class="font-bold text-xs text-brand-ink">{{ selectedProvince.name }}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  v-for="city in citiesInProvince"
                  :key="city.id"
                  type="button"
                  class="text-left p-3 rounded-xl border border-brand-hair hover:border-brand-ink/40 hover:bg-brand-canvas-soft/40 transition-colors cursor-pointer flex flex-col justify-between"
                  @click="handleSelectCity(city)"
                >
                  <span class="font-bold text-xs text-brand-ink">{{ city.name }}</span>
                  <div class="flex items-center justify-between text-[11px] text-brand-muted mt-2">
                    <span>{{ city.type }}</span>
                    <span class="font-mono">{{ city.postalCode }}</span>
                  </div>
                </button>
              </div>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                v-for="prov in INDONESIA_PROVINCES"
                :key="prov.id"
                type="button"
                class="text-left p-2.5 rounded-lg hover:bg-brand-canvas-soft/60 flex items-center justify-between text-xs transition-colors cursor-pointer group"
                @click="selectedProvince = prov"
              >
                <span class="font-medium text-brand-ink group-hover:font-semibold">{{
                  prov.name
                }}</span>
                <i
                  class="pi pi-chevron-right text-[10px] text-brand-muted group-hover:text-brand-ink transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
