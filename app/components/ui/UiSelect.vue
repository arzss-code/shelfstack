<script setup lang="ts">
import { useSlots } from 'vue'
import UiSelectMenu from '~/components/ui/UiSelectMenu.vue'
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
    /** `xs` untuk kontrol header padat, `sm` untuk strip filter/toolbar, `md` untuk field formulir. */
    size?: 'xs' | 'sm' | 'md'
    block?: boolean
    /** Memaksa bentuk stadium pill (rounded-full). Default true jika size sm. */
    pill?: boolean
    /** Posisi popover: left atau right. */
    align?: 'left' | 'right'
    title?: string
    /** Kelas tambahan untuk elemen native select tersembunyi (kontrak aksesibilitas/test). */
    selectClass?: string
    /** Render popover ke body via ClientOnly agar bebas kliping overflow-hidden & aman SSR. */
    teleport?: boolean
    /** Ukuran ringkas h-7 sejajar tombol pagination Next/Prev. */
    compactTrigger?: boolean
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
    selectClass: '',
    teleport: false,
    compactTrigger: false,
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
  menuRef,
  floatingStyle,
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
      <select
        :id="selectId"
        tabindex="-1"
        aria-hidden="true"
        :value="modelValue ?? ''"
        :disabled="disabled"
        :class="['sr-only pointer-events-none', selectClass]"
        @change="
          (emit('update:modelValue', ($event.target as HTMLSelectElement).value),
          emit('change', ($event.target as HTMLSelectElement).value))
        "
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

      <ClientOnly v-if="teleport">
        <Teleport to="body">
          <UiSelectMenu
            ref="menuRef"
            :is-open="isOpen"
            :listbox-id="listboxId"
            :select-id="selectId"
            :active-index="activeIndex"
            :model-value="modelValue"
            :normalized-options="normalizedOptions"
            :teleport="true"
            :floating-style="floatingStyle"
            :align="align"
            :block="block"
            @select="selectOption"
            @hover-index="activeIndex = $event"
          />
        </Teleport>
      </ClientOnly>
      <UiSelectMenu
        v-else
        ref="menuRef"
        :is-open="isOpen"
        :listbox-id="listboxId"
        :select-id="selectId"
        :active-index="activeIndex"
        :model-value="modelValue"
        :normalized-options="normalizedOptions"
        :teleport="false"
        :floating-style="floatingStyle"
        :align="align"
        :block="block"
        @select="selectOption"
        @hover-index="activeIndex = $event"
      />
    </div>

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
