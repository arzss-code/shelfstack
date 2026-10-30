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

const tabs: { key: CascadeTab; label: string }[] = [
  { key: 'province', label: 'Provinsi' },
  { key: 'city', label: 'Kota' },
  { key: 'district', label: 'Kecamatan' },
  { key: 'postal', label: 'Kode Pos' },
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
      createItem(p.id, p.name.toUpperCase(), selectedProvince.value?.id === p.id, 'province', p),
    )
  }
  if (activeTab.value === 'city') {
    return cities.value.map((c) =>
      createItem(c.id, c.fullName.toUpperCase(), selectedCity.value?.id === c.id, 'city', c),
    )
  }
  if (activeTab.value === 'district') {
    return districts.value.map((d) =>
      createItem(d.id, d.name.toUpperCase(), selectedDistrict.value?.id === d.id, 'district', d),
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
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand-ink/50 backdrop-blur-xs"
      data-testid="location-picker-modal"
    >
      <div
        class="bg-white rounded-card border border-brand-hair shadow-whisper w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Modal Top Header (Shopee Style) -->
        <div class="p-3 sm:p-4 border-b border-brand-hairsoft bg-white shrink-0 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-bold text-sm sm:text-base text-brand-ink m-0">
              Pilih Alamat Administratif
            </h3>
            <button
              type="button"
              class="w-7 h-7 rounded-full border border-brand-hair hover:border-brand-ink/40 text-brand-muted hover:text-brand-ink flex items-center justify-center transition-colors cursor-pointer"
              data-testid="close-location-modal"
              @click="closeModal"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>

          <!-- Shopee Search Input Bar -->
          <div class="relative flex items-center">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Provinsi, Kota, Kecamatan, Kode Pos"
              class="w-full pl-3.5 pr-14 py-2 text-xs rounded-lg border border-brand-hair focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-brand-ink placeholder:text-brand-muted/70 transition-colors"
              data-testid="location-search-input"
            />
            <div
              class="absolute right-3 flex items-center gap-1.5 text-brand-muted pointer-events-none"
            >
              <i class="pi pi-search text-xs" />
              <i class="pi pi-chevron-down text-[10px]" />
            </div>
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-8 text-brand-muted hover:text-brand-ink cursor-pointer"
              @click="searchQuery = ''"
            >
              <i class="pi pi-times-circle text-xs" />
            </button>
          </div>
        </div>

        <!-- 4 Shopee Cascading Tabs -->
        <div
          v-if="!searchQuery.trim()"
          class="flex border-b border-brand-hairsoft bg-brand-canvas-soft/30 text-xs shrink-0 select-none"
        >
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            :data-testid="`tab-${t.key}`"
            class="flex-1 py-2.5 text-center font-medium transition-colors cursor-pointer relative"
            :class="[
              activeTab === t.key
                ? 'text-orange-600 font-bold'
                : 'text-brand-muted hover:text-brand-ink',
              isTabDisabled(t.key) ? 'opacity-40 pointer-events-none' : '',
            ]"
            @click="!isTabDisabled(t.key) && (activeTab = t.key)"
          >
            {{ t.label }}
            <span
              v-if="activeTab === t.key"
              class="absolute bottom-0 left-2 right-2 h-0.5 bg-orange-600 rounded-full"
            />
          </button>
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
                class="w-full text-left p-2.5 rounded-lg hover:bg-brand-canvas-soft flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                @click="handleSelectSearchResult(res)"
              >
                <div class="min-w-0">
                  <p class="font-bold text-brand-ink m-0 truncate">
                    {{ res.districtName }}, {{ res.cityName }}
                  </p>
                  <p class="text-[11px] text-brand-muted m-0 mt-0.5 truncate">
                    {{ res.provinceName }}
                  </p>
                </div>
                <span
                  class="font-mono text-xs font-semibold text-brand-ink bg-brand-canvas-soft px-2 py-0.5 rounded shrink-0"
                >
                  {{ res.postalCode }}
                </span>
              </button>
            </div>
            <div v-else class="text-center py-10 text-brand-muted text-xs">
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
                class="w-full text-left px-3 py-2 rounded-md hover:bg-brand-canvas-soft flex items-center justify-between text-xs transition-colors cursor-pointer group"
                :class="
                  item.selected
                    ? 'font-bold text-orange-600 bg-brand-canvas-soft/70'
                    : 'text-brand-ink'
                "
                @click="handleItemClick(item)"
              >
                <span :class="item.type === 'postal' ? 'font-mono font-semibold' : ''">{{
                  item.label
                }}</span>
                <span v-if="item.sublabel" class="text-[11px] text-brand-muted">{{
                  item.sublabel
                }}</span>
                <i
                  v-else
                  class="pi pi-chevron-right text-[10px] text-brand-muted group-hover:text-brand-ink"
                />
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
