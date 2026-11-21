<script setup lang="ts">
import { useSlots } from 'vue'
import { useUiSelect } from '~/composables/useUiSelect'

export interface UiSelectOption {
  value: string | number
  label: string
  disabled?: boolean
  description?: string
}

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue: string | number | null
    options?: Array<UiSelectOption | string | number>
    /** Label field di atas kontrol. */
    label?: string
    /** Placeholder saat belum ada nilai terpilih. */
    placeholder?: string
    /** Prefix teks di dalam tombol kontrol (misal: "Urutkan:"). */
    prefix?: string
    disabled?: boolean
    error?: string
    /** Sarana bantu di bawah kontrol, tampil hanya bila tidak ada error. */
    hint?: string
    /** `sm` untuk strip filter/toolbar, `md` untuk field formulir. */
    size?: 'sm' | 'md'
    block?: boolean
    /** Memaksa bentuk stadium pill (rounded-full). Default true jika size sm. */
    pill?: boolean
    /** Posisi popover: left atau right. */
    align?: 'left' | 'right'
    title?: string
  }>(),
  {
    id: undefined,
    options: undefined,
    label: '',
    placeholder: 'Pilih opsi...',
    prefix: '',
    disabled: false,
    error: '',
    hint: '',
    size: 'md',
    block: false,
    pill: undefined,
    align: 'left',
    title: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const slots = useSlots()

const {
  selectId,
  listboxId,
  describedBy,
  isOpen,
  activeIndex,
  rootRef,
  triggerRef,
  listboxRef,
  normalizedOptions,
  selectedOption,
  displayLabel,
  triggerClass,
  toggleDropdown,
  selectOption,
  onTriggerKeydown,
} = useUiSelect(
  props,
  (val) => {
    emit('update:modelValue', val)
    emit('change', val)
  },
  slots,
)
</script>

<template>
  <div
    ref="rootRef"
    :class="[
      'relative flex flex-col gap-1.5',
      block ? 'w-full' : 'inline-block',
      isOpen ? 'z-50' : '',
    ]"
  >
    <label v-if="label" :for="selectId" class="text-xs font-semibold text-brand-ink sm:text-sm">
      {{ label }}
    </label>

    <div class="relative" :class="{ 'z-50': isOpen }">
      <!-- Hidden native select untuk kompatibilitas form autofill dan screen reader -->
      <select
        :id="selectId"
        tabindex="-1"
        aria-hidden="true"
        :value="modelValue ?? ''"
        :disabled="disabled"
        class="sr-only pointer-events-none"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="placeholder" value="" disabled :selected="!modelValue">
          {{ placeholder }}
        </option>
        <option
          v-for="opt in normalizedOptions"
          :key="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
          :selected="String(opt.value) === String(modelValue)"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- Custom Trigger Button -->
      <button
        ref="triggerRef"
        type="button"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        :aria-controls="listboxId"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        :disabled="disabled"
        :title="title"
        :class="triggerClass"
        @click="toggleDropdown"
        @keydown="onTriggerKeydown"
      >
        <span class="flex items-center gap-1.5 min-w-0 truncate">
          <span
            v-if="prefix"
            class="text-brand-muted text-[11px] font-semibold uppercase tracking-wider shrink-0"
          >
            {{ prefix }}
          </span>
          <span
            :class="[
              'truncate',
              selectedOption ? 'text-brand-ink' : 'text-brand-faint font-normal',
            ]"
          >
            {{ displayLabel }}
          </span>
        </span>

        <svg
          class="w-3 h-3 text-brand-muted shrink-0 transition-transform duration-200 origin-center"
          :class="{ 'rotate-180': isOpen }"
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

      <!-- Custom Floating Popover Menu -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="transform scale-95 opacity-0 -translate-y-1"
        enter-to-class="transform scale-100 opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="transform scale-100 opacity-100 translate-y-0"
        leave-to-class="transform scale-95 opacity-0 -translate-y-1"
      >
        <div
          v-if="isOpen"
          :id="listboxId"
          ref="listboxRef"
          role="listbox"
          tabindex="-1"
          :aria-activedescendant="activeIndex >= 0 ? `${selectId}-opt-${activeIndex}` : undefined"
          :class="[
            'absolute z-50 mt-1.5 max-h-60 overflow-y-auto bg-brand-canvas border border-brand-hair rounded-card p-1 shadow-floating outline-none',
            align === 'right' ? 'right-0' : 'left-0',
            block ? 'w-full' : 'min-w-full w-max max-w-xs sm:max-w-sm',
          ]"
        >
          <div
            v-if="normalizedOptions.length === 0"
            class="px-3 py-2 text-xs text-brand-muted text-center"
          >
            Tidak ada opsi
          </div>
          <button
            v-for="(opt, idx) in normalizedOptions"
            :id="`${selectId}-opt-${idx}`"
            :key="opt.value"
            type="button"
            role="option"
            :aria-selected="String(opt.value) === String(modelValue)"
            :disabled="opt.disabled"
            :class="[
              'w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-xs rounded-xl transition-colors cursor-pointer select-none border-0',
              String(opt.value) === String(modelValue)
                ? 'bg-brand-canvas-soft text-brand-ink font-semibold'
                : activeIndex === idx
                  ? 'bg-brand-canvas-soft/80 text-brand-ink font-medium'
                  : 'text-brand-ink hover:bg-brand-canvas-soft hover:text-brand-ink font-normal',
              opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
            ]"
            @click="selectOption(opt)"
            @mouseenter="activeIndex = idx"
          >
            <div class="flex flex-col min-w-0">
              <span class="truncate">{{ opt.label }}</span>
              <span v-if="opt.description" class="text-[10px] text-brand-muted truncate">
                {{ opt.description }}
              </span>
            </div>
            <i
              v-if="String(opt.value) === String(modelValue)"
              class="pi pi-check text-[11px] text-brand-accent shrink-0 font-bold"
              aria-hidden="true"
            />
          </button>
        </div>
      </Transition>
    </div>

    <!-- Hidden slot for backwards compatibility if callers pass <option> children -->
    <div v-if="$slots.default" class="hidden" aria-hidden="true">
      <slot />
    </div>

    <p v-if="error" :id="describedBy" class="m-0 text-[11px] font-medium text-rose-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="describedBy" class="m-0 text-[11px] text-brand-muted">
      {{ hint }}
    </p>
  </div>
</template>
