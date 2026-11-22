<script setup lang="ts">
import { useInstantSearch } from '~/composables/useInstantSearch'
import SearchAutocompletePopover from '~/components/search/SearchAutocompletePopover.vue'

const props = withDefaults(
  defineProps<{
    searchQuery: string
    selectedCategory?: string
    dropdownCategories?: string[]
  }>(),
  {
    selectedCategory: 'Semua Kategori',
    dropdownCategories: () => [],
  },
)

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  search: []
  selectCategory: [category: string]
}>()

const searchBarContainerRef = ref<HTMLElement | null>(null)

// Composable instant search dengan sinkronisasi query
const queryRef = toRef(props, 'searchQuery')
const instantSearch = useInstantSearch(queryRef)

function handleInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:searchQuery', val)
}

function handleSubmit() {
  if (instantSearch.isOpen.value && instantSearch.activeIndex.value >= 0) {
    instantSearch.selectActiveItem()
  } else {
    instantSearch.close()
    emit('search')
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node | null
  if (!target) return

  if (
    instantSearch.isOpen.value &&
    searchBarContainerRef.value &&
    !searchBarContainerRef.value.contains(target)
  ) {
    instantSearch.close()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleClickOutside, { passive: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleClickOutside)
})
</script>

<template>
  <search
    ref="searchBarContainerRef"
    class="relative flex-1 max-w-2xl mx-2 sm:mx-6 hidden md:block"
  >
    <form
      class="relative flex items-center w-full h-11 bg-brand-field hover:bg-brand-canvas-soft rounded-full pl-4 pr-1.5 border border-brand-hair focus-within:border-brand-ink focus-within:bg-brand-canvas focus-within:ring-2 focus-within:ring-brand-ink/20 transition-colors shadow-whisper"
      @submit.prevent="handleSubmit"
    >
      <input
        :value="searchQuery"
        type="search"
        name="q"
        enterkeyhint="search"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        role="combobox"
        :aria-expanded="instantSearch.isOpen.value"
        aria-autocomplete="list"
        aria-controls="instant-search-popover"
        :aria-activedescendant="
          instantSearch.activeIndex.value >= 0
            ? `search-option-${instantSearch.activeIndex.value}`
            : undefined
        "
        aria-label="Cari produk"
        class="w-full bg-transparent px-3 text-xs sm:text-sm text-brand-ink placeholder:text-brand-faint focus:outline-none"
        placeholder="Cari produk kebutuhan kerja, rumah, audio, furnitur..."
        @input="handleInput"
        @focus="instantSearch.openOnFocus"
        @click="instantSearch.openOnFocus"
        @keydown.down.prevent="instantSearch.navigateNext()"
        @keydown.up.prevent="instantSearch.navigatePrev()"
        @keydown.esc="instantSearch.close()"
      />

      <UiTooltip text="Cari produk" position="bottom">
        <button
          type="submit"
          class="relative w-8 h-8 rounded-full bg-brand-ink text-brand-onink flex items-center justify-center shrink-0 hover:bg-brand-inkhover transition-colors cursor-pointer shadow-whisper before:content-[''] before:absolute before:-inset-1.5"
          aria-label="Cari produk"
        >
          <i class="pi pi-search text-xs" aria-hidden="true" />
        </button>
      </UiTooltip>
    </form>

    <!-- Floating Live Omnibox Autocomplete Popover -->
    <SearchAutocompletePopover
      :is-open="instantSearch.isOpen.value"
      :is-loading="instantSearch.isLoading.value"
      :error-message="instantSearch.errorMessage.value"
      :query="searchQuery"
      :products="instantSearch.products.value"
      :categories="instantSearch.categories.value"
      :active-index="instantSearch.activeIndex.value"
      :recent-searches="instantSearch.recentSearches.value"
      :popular-tags="instantSearch.popularTags"
      @select-category="instantSearch.selectCategory"
      @select-product="instantSearch.selectProduct"
      @submit-search="instantSearch.submitFullSearch"
      @select-tag="instantSearch.selectSearchTag"
      @remove-recent="instantSearch.removeRecentSearch"
      @clear-recent="instantSearch.clearRecentSearches"
      @retry="instantSearch.retrySearch"
      @close="instantSearch.close"
    />
  </search>
</template>
