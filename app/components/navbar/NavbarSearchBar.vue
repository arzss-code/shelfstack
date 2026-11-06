<script setup lang="ts">
defineProps<{
  searchQuery: string
  selectedCategory: string
  dropdownCategories: string[]
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  search: []
  selectCategory: [category: string]
}>()

const isCategoryDropdownOpen = ref(false)
const categoryDropdownRef = ref<HTMLElement | null>(null)

function handleSelectCategory(cat: string) {
  isCategoryDropdownOpen.value = false
  emit('selectCategory', cat)
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node | null
  if (
    isCategoryDropdownOpen.value &&
    target &&
    categoryDropdownRef.value &&
    !categoryDropdownRef.value.contains(target)
  ) {
    isCategoryDropdownOpen.value = false
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
  <search class="flex-1 max-w-2xl mx-2 sm:mx-6 hidden md:block">
    <form
      class="relative flex items-center w-full h-11 bg-brand-field hover:bg-brand-canvas-soft rounded-full px-2 border border-brand-hair focus-within:border-brand-ink focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-ink/20 transition-colors shadow-whisper"
      @submit.prevent="emit('search')"
    >
      <!-- Single Category Dropdown Button -->
      <div ref="categoryDropdownRef" class="relative shrink-0">
        <button
          type="button"
          :aria-expanded="isCategoryDropdownOpen"
          aria-haspopup="listbox"
          class="whitespace-nowrap flex items-center gap-1.5 text-xs text-brand-ink font-semibold px-3 py-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          @click="isCategoryDropdownOpen = !isCategoryDropdownOpen"
        >
          <span>{{ selectedCategory }}</span>
          <svg
            class="w-3 h-3 text-brand-muted shrink-0 transition-transform duration-200 origin-center"
            :class="{ 'rotate-180': isCategoryDropdownOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <!-- Category Dropdown List -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="transform scale-95 opacity-0 -translate-y-1"
          enter-to-class="transform scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="transform scale-100 opacity-100 translate-y-0"
          leave-to-class="transform scale-95 opacity-0 -translate-y-1"
        >
          <div
            v-if="isCategoryDropdownOpen"
            class="absolute left-0 top-full mt-2 w-56 max-h-64 overflow-y-auto bg-brand-canvas border border-brand-hair rounded-card shadow-floating p-1.5 z-50"
          >
            <button
              v-for="cat in dropdownCategories"
              :key="cat"
              type="button"
              class="w-full text-left px-3 py-2 text-xs font-medium text-brand-ink hover:bg-brand-canvas-soft rounded-field transition-colors flex items-center justify-between cursor-pointer border-0"
              @click="handleSelectCategory(cat)"
            >
              <span>{{ cat }}</span>
              <i
                v-if="selectedCategory === cat"
                class="pi pi-check text-[10px] text-brand-accent font-bold"
              />
            </button>
          </div>
        </Transition>
      </div>

      <span class="w-px h-5 bg-brand-hair mx-1 shrink-0" aria-hidden="true" />

      <input
        :value="searchQuery"
        type="search"
        name="q"
        enterkeyhint="search"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        aria-label="Cari produk"
        class="w-full bg-transparent px-3 text-xs sm:text-sm text-brand-ink placeholder:text-brand-faint focus:outline-none"
        placeholder="Cari produk kebutuhan kerja, rumah, audio, furnitur..."
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />

      <UiTooltip text="Cari produk" position="bottom">
        <button
          type="submit"
          class="w-8 h-8 rounded-full bg-brand-ink text-white flex items-center justify-center shrink-0 hover:bg-brand-inkhover transition-colors cursor-pointer shadow-whisper"
          aria-label="Cari produk"
        >
          <i class="pi pi-search text-xs" aria-hidden="true" />
        </button>
      </UiTooltip>
    </form>
  </search>
</template>
