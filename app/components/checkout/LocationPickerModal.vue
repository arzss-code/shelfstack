<script setup lang="ts">
import type { AdministrativeSelection } from '~~/shared/schemas/location'
import { useLocationPicker } from '~/composables/useLocationPicker'

const props = withDefaults(defineProps<{ modelValue?: boolean }>(), { modelValue: false })
const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  select: [location: AdministrativeSelection]
}>()

const {
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
} = useLocationPicker(props, emit)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]"
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
              class="w-full pl-9 pr-9 py-2 text-xs rounded-full border border-brand-hair bg-brand-canvas-soft/60 focus:bg-brand-canvas focus:border-brand-ink focus:ring-1 focus:ring-brand-ink outline-none text-brand-ink placeholder:text-brand-muted transition-all"
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
