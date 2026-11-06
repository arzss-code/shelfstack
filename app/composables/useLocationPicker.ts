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

export type CascadeTab = 'province' | 'city' | 'district' | 'postal'

export function useLocationPicker(
  props: { modelValue?: boolean },
  emit: {
    (e: 'update:modelValue', val: boolean): void
    (e: 'select', location: AdministrativeSelection): void
  },
) {
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

  const createItem = <T>(
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

  return {
    activeTab,
    searchQuery,
    selectedProvince,
    selectedCity,
    selectedDistrict,
    tabs,
    searchResults,
    activeListItems,
    isTabDisabled,
    closeModal,
    handleItemClick,
    handleSelectSearchResult,
  }
}
