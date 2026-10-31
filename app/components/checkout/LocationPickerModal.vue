<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  getProvinces,
  getCitiesByProvince,
  getDistrictsByCity,
  getPostalCodesByDistrict,
  searchAdministrativeLocations,
  type Province,
  type City,
  type District,
  type AdministrativeSearchResult,
} from '~~/shared/data/locations/indonesia-regions'
import type { AdministrativeSelection } from '~~/shared/schemas/location'

const props = withDefaults(defineProps<{ modelValue?: boolean }>(), { modelValue: false })
const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  select: [location: AdministrativeSelection]
}>()

type CascadeTab = 'province' | 'city' | 'district' | 'postal'
const activeTab = ref<CascadeTab>('province')
const searchQuery = ref('')
const selectedProvince = ref<Province | null>(null)
const selectedCity = ref<City | null>(null)
const selectedDistrict = ref<District | null>(null)

const tabs = [
  { key: 'province' as const, label: 'Provinsi' },
  { key: 'city' as const, label: 'Kota' },
  { key: 'district' as const, label: 'Kecamatan' },
  { key: 'postal' as const, label: 'Kode Pos' },
]

const provinces = computed(() => getProvinces())
const cities = computed(() =>
  selectedProvince.value ? getCitiesByProvince(selectedProvince.value.id) : [],
)
const districts = computed(() =>
  selectedCity.value ? getDistrictsByCity(selectedCity.value.id) : [],
)
const postalCodes = computed(() =>
  selectedDistrict.value ? getPostalCodesByDistrict(selectedDistrict.value.id) : [],
)
const searchResults = computed(() =>
  searchQuery.value.trim().length >= 2
    ? searchAdministrativeLocations(searchQuery.value.trim(), 30)
    : [],
)

const isTabDisabled = (k: CascadeTab) =>
  (k === 'city' && !selectedProvince.value) ||
  (k === 'district' && !selectedCity.value) ||
  (k === 'postal' && !selectedDistrict.value)

const createItem = <T,>(
  id: string,
  label: string,
  selected: boolean,
  type: CascadeTab,
  raw: T,
  sublabel?: string,
) => ({ id, label, selected, type, raw, sublabel })

const activeListItems = computed(() => {
  if (activeTab.value === 'province') {
    return provinces.value.map((p) =>
      createItem(p.id, p.name, selectedProvince.value?.id === p.id, 'province', p),
    )
  }
  if (activeTab.value === 'city') {
    return cities.value.map((c) =>
      createItem(c.id, c.fullName, selectedCity.value?.id === c.id, 'city', c),
    )
  }
  if (activeTab.value === 'district') {
    return districts.value.map((d) =>
      createItem(d.id, d.name, selectedDistrict.value?.id === d.id, 'district', d),
    )
  }
  return postalCodes.value.map((pos) =>
    createItem(pos, pos, false, 'postal', pos, 'Pilih Kode Pos'),
  )
})

const closeModal = () => {
  emit('update:modelValue', false)
  searchQuery.value = ''
}

const handleItemClick = (item: (typeof activeListItems.value)[0]) => {
  if (item.type === 'province') {
    selectedProvince.value = item.raw as Province
    selectedCity.value = null
    selectedDistrict.value = null
    activeTab.value = 'city'
  } else if (item.type === 'city') {
    selectedCity.value = item.raw as City
    selectedDistrict.value = null
    activeTab.value = 'district'
  } else if (item.type === 'district') {
    selectedDistrict.value = item.raw as District
    activeTab.value = 'postal'
  } else {
    handleSelectPostal(item.raw as string)
  }
}

const emitAndClose = (selection: AdministrativeSelection) => {
  emit('select', selection)
  closeModal()
}

const handleSelectPostal = (postal: string) => {
  if (!selectedProvince.value || !selectedCity.value || !selectedDistrict.value) return
  emitAndClose({
    provinceId: selectedProvince.value.id,
    provinceName: selectedProvince.value.name,
    cityId: selectedCity.value.id,
    cityName: selectedCity.value.fullName,
    districtId: selectedDistrict.value.id,
    districtName: selectedDistrict.value.name,
    postalCode: postal,
    displayLabel: `${selectedDistrict.value.name}, ${selectedCity.value.fullName}, ${selectedProvince.value.name} (${postal})`,
  })
}

const handleSelectSearchResult = (res: AdministrativeSearchResult) => emitAndClose(res)
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
    if (open) searchQuery.value = ''
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-ink/45 backdrop-blur-[2px]"
      data-testid="location-picker-modal"
      @click.self="closeModal"
    >
      <div
        class="bg-brand-canvas rounded-t-card sm:rounded-card border border-brand-hair shadow-floating w-full max-w-lg max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Modal Top Header -->
        <div class="p-4 sm:p-5 border-b border-brand-hairsoft bg-brand-canvas shrink-0 space-y-3">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="font-display font-bold text-base text-brand-ink tracking-tight m-0">
                Pilih Alamat Administratif
              </h3>
              <p class="text-xs text-brand-muted m-0 mt-0.5">
                Pilih Provinsi, Kota, Kecamatan hingga Kode Pos
              </p>
            </div>
            <button
              type="button"
              class="h-8 w-8 rounded-full text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink flex items-center justify-center transition-colors cursor-pointer border-0 bg-transparent p-0"
              data-testid="close-location-modal"
              aria-label="Tutup dialog"
              @click="closeModal"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>

          <!-- Search Input Bar (Brand Pill Style) -->
          <div class="relative flex items-center">
            <i
              class="pi pi-search absolute left-3.5 text-xs text-brand-muted pointer-events-none"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari kecamatan, kota, provinsi, atau kode pos..."
              class="w-full pl-9 pr-9 py-2 text-xs rounded-full border border-brand-hair bg-brand-canvas-soft/60 focus:bg-white focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none text-brand-ink placeholder:text-brand-muted transition-all"
              data-testid="location-search-input"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-3.5 text-brand-muted hover:text-brand-ink transition-colors cursor-pointer border-0 bg-transparent p-0"
              @click="searchQuery = ''"
            >
              <i class="pi pi-times-circle text-xs" />
            </button>
          </div>
        </div>

        <!-- 4 Cascading Segmented Tabs -->
        <div
          v-if="!searchQuery.trim()"
          class="px-4 py-2.5 bg-brand-canvas border-b border-brand-hairsoft shrink-0 space-y-2"
        >
          <div
            role="tablist"
            aria-label="Tingkat Wilayah"
            class="rounded-full border border-brand-hair bg-brand-canvas-soft p-1 flex items-center gap-1 text-xs select-none"
          >
            <button
              v-for="t in tabs"
              :key="t.key"
              type="button"
              role="tab"
              :aria-selected="activeTab === t.key"
              :data-testid="`tab-${t.key}`"
              class="flex-1 py-1.5 px-2 rounded-full text-center text-xs font-semibold transition-all cursor-pointer border-0"
              :class="[
                activeTab === t.key
                  ? 'bg-brand-ink text-white shadow-whisper'
                  : 'text-brand-muted hover:text-brand-ink hover:bg-brand-canvas',
                isTabDisabled(t.key) ? 'opacity-35 pointer-events-none' : '',
              ]"
              @click="!isTabDisabled(t.key) && (activeTab = t.key)"
            >
              {{ t.label }}
            </button>
          </div>

          <!-- Selection Breadcrumb trail -->
          <div
            v-if="selectedProvince"
            class="flex items-center gap-1.5 text-[11px] text-brand-muted overflow-x-auto no-scrollbar truncate pt-0.5"
          >
            <span class="font-medium text-brand-ink truncate">{{ selectedProvince.name }}</span>
            <template v-if="selectedCity">
              <i class="pi pi-angle-right text-[9px] text-brand-faint shrink-0" />
              <span class="font-medium text-brand-ink truncate">{{ selectedCity.fullName }}</span>
            </template>
            <template v-if="selectedDistrict">
              <i class="pi pi-angle-right text-[9px] text-brand-faint shrink-0" />
              <span class="font-medium text-brand-ink truncate">{{ selectedDistrict.name }}</span>
            </template>
          </div>
        </div>

        <!-- Scrollable List Body -->
        <div class="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-brand-hairsoft">
          <!-- SEARCH AUTOCOMPLETE VIEW -->
          <template v-if="searchQuery.trim()">
            <div v-if="searchResults.length > 0" class="space-y-1">
              <button
                v-for="res in searchResults"
                :key="res.id"
                type="button"
                data-testid="search-result-item"
                class="w-full text-left p-3 rounded-lg hover:bg-brand-canvas-soft flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer border-b border-brand-hairsoft last:border-0"
                @click="handleSelectSearchResult(res)"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-brand-ink text-xs truncate">
                      {{ res.districtName }}
                    </span>
                    <span class="text-brand-faint text-[10px]">&bull;</span>
                    <span class="text-xs text-brand-muted truncate">
                      {{ res.cityName }}
                    </span>
                  </div>
                  <p class="text-[11px] text-brand-muted/80 m-0 mt-0.5 truncate">
                    {{ res.provinceName }}
                  </p>
                </div>
                <span
                  class="text-[11px] font-semibold text-brand-ink bg-brand-canvas-soft px-2.5 py-1 rounded-full border border-brand-hair shrink-0 tabular"
                >
                  {{ res.postalCode }}
                </span>
              </button>
            </div>
            <div v-else class="text-center py-12 text-brand-muted text-xs">
              Tidak ada wilayah yang cocok dengan "{{ searchQuery }}"
            </div>
          </template>

          <!-- CONSOLIDATED CASCADING LIST -->
          <template v-else>
            <div class="space-y-0.5">
              <button
                v-for="item in activeListItems"
                :key="item.id"
                type="button"
                :data-testid="`${item.type}-item-${item.id}`"
                class="w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer group"
                :class="
                  item.selected
                    ? 'font-bold text-brand-ink bg-brand-canvas-soft ring-1 ring-brand-hair'
                    : 'text-brand-ink hover:bg-brand-canvas-soft/80'
                "
                @click="handleItemClick(item)"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <i v-if="item.selected" class="pi pi-check text-xs text-brand-ink shrink-0" />
                  <span :class="item.selected ? 'font-bold' : 'font-medium'" class="truncate">
                    {{ item.label }}
                  </span>
                </div>
                <span v-if="item.sublabel" class="text-[11px] text-brand-muted shrink-0">
                  {{ item.sublabel }}
                </span>
                <i
                  v-else
                  class="pi pi-chevron-right text-[10px] text-brand-muted group-hover:text-brand-ink group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
