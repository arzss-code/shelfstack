<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'

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
const uid = useId()
const selectId = computed(() => props.id ?? `ui-select-${uid}`)
const listboxId = computed(() => `${selectId.value}-listbox`)
const describedBy = computed(() =>
  props.error || props.hint ? `${selectId.value}-help` : undefined,
)

const isOpen = ref(false)
const activeIndex = ref(-1)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const listboxRef = ref<HTMLElement | null>(null)

// Ekstraksi opsi baik dari props.options maupun fallback slot <option>
const parsedSlotOptions = ref<UiSelectOption[]>([])

function extractSlotOptions() {
  if (props.options && props.options.length > 0) {
    parsedSlotOptions.value = []
    return
  }
  const defaultSlot = slots.default?.()
  if (!defaultSlot) {
    parsedSlotOptions.value = []
    return
  }
  const list: UiSelectOption[] = []
  for (const vnode of defaultSlot) {
    if (
      vnode.type === 'option' ||
      (typeof vnode.type === 'string' && vnode.type.endsWith('option'))
    ) {
      const val = vnode.props?.value ?? ''
      let label = ''
      if (typeof vnode.children === 'string') {
        label = vnode.children
      } else if (Array.isArray(vnode.children)) {
        label = vnode.children
          .map((c: unknown) => {
            if (typeof c === 'string') return c
            if (typeof c === 'object' && c !== null && 'children' in c) {
              return String((c as { children?: unknown }).children ?? '')
            }
            return ''
          })
          .join('')
      }
      list.push({
        value: val,
        label: label.trim() || String(val),
        disabled: Boolean(vnode.props?.disabled),
      })
    }
  }
  parsedSlotOptions.value = list
}

watch(
  () => props.options,
  () => {
    extractSlotOptions()
  },
  { immediate: true },
)

const normalizedOptions = computed<UiSelectOption[]>(() => {
  if (props.options && props.options.length > 0) {
    return props.options.map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: opt, label: String(opt) }
      }
      return opt
    })
  }
  return parsedSlotOptions.value
})

const selectedOption = computed(() => {
  const val = props.modelValue
  if (val === null || val === undefined || val === '') return null
  return normalizedOptions.value.find((opt) => String(opt.value) === String(val)) ?? null
})

const displayLabel = computed(() => {
  if (selectedOption.value) {
    return selectedOption.value.label
  }
  return props.placeholder || 'Pilih opsi...'
})

const isPill = computed(() => {
  if (props.pill !== undefined) return props.pill
  return props.size === 'sm'
})

const triggerClass = computed(() => {
  const geometry =
    props.size === 'sm'
      ? isPill.value
        ? 'h-10 rounded-full py-2 px-3.5 text-xs'
        : 'h-8 rounded-full py-1 px-3 text-xs'
      : isPill.value
        ? 'h-11 rounded-full py-2.5 px-4 text-sm'
        : 'h-11 rounded-field py-2.5 px-3.5 text-sm'

  const border = props.error
    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
    : isOpen.value
      ? 'border-brand-ink ring-2 ring-brand-ink/10'
      : 'border-brand-hair hover:border-brand-faint focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10'

  return [
    'inline-flex items-center justify-between gap-2 border bg-white text-brand-ink transition-all',
    'cursor-pointer select-none text-left outline-none font-medium',
    'disabled:cursor-not-allowed disabled:bg-brand-field disabled:text-brand-muted disabled:border-brand-hairsoft',
    props.block ? 'w-full' : 'min-w-[120px]',
    geometry,
    border,
  ].join(' ')
})

function toggleDropdown() {
  if (props.disabled) return
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

function openDropdown() {
  if (props.disabled) return
  isOpen.value = true
  const curIdx = normalizedOptions.value.findIndex(
    (opt) => String(opt.value) === String(props.modelValue),
  )
  activeIndex.value = curIdx >= 0 ? curIdx : 0
  nextTick(() => {
    scrollActiveIntoView()
  })
}

function closeDropdown() {
  isOpen.value = false
  activeIndex.value = -1
}

function selectOption(opt: UiSelectOption) {
  if (opt.disabled) return
  const strVal = String(opt.value)
  emit('update:modelValue', strVal)
  emit('change', strVal)
  closeDropdown()
  nextTick(() => {
    triggerRef.value?.focus()
  })
}

function scrollActiveIntoView() {
  if (!listboxRef.value || activeIndex.value < 0) return
  const items = listboxRef.value.querySelectorAll('[role="option"]')
  const target = items[activeIndex.value] as HTMLElement | undefined
  if (target) {
    target.scrollIntoView({ block: 'nearest' })
  }
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
      } else {
        navigateOptions(1)
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
      } else {
        navigateOptions(-1)
      }
      break
    case 'Home':
      if (isOpen.value) {
        event.preventDefault()
        activeIndex.value = 0
        scrollActiveIntoView()
      }
      break
    case 'End':
      if (isOpen.value) {
        event.preventDefault()
        activeIndex.value = normalizedOptions.value.length - 1
        scrollActiveIntoView()
      }
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
      } else if (activeIndex.value >= 0 && activeIndex.value < normalizedOptions.value.length) {
        const target = normalizedOptions.value[activeIndex.value]
        if (target && !target.disabled) {
          selectOption(target)
        }
      }
      break
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault()
        closeDropdown()
        triggerRef.value?.focus()
      }
      break
    case 'Tab':
      if (isOpen.value) {
        closeDropdown()
      }
      break
  }
}

function navigateOptions(step: number) {
  const count = normalizedOptions.value.length
  if (count === 0) return
  let next = activeIndex.value + step
  if (next < 0) next = count - 1
  if (next >= count) next = 0

  let attempts = 0
  while (normalizedOptions.value[next]?.disabled && attempts < count) {
    next = (next + step + count) % count
    attempts++
  }

  activeIndex.value = next
  scrollActiveIntoView()
}

function handleClickOutside(event: MouseEvent) {
  if (!isOpen.value) return
  const target = event.target as Node | null
  if (rootRef.value && target && !rootRef.value.contains(target)) {
    closeDropdown()
  }
}

onMounted(() => {
  extractSlotOptions()
  document.addEventListener('pointerdown', handleClickOutside, { passive: true })
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleClickOutside)
})
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
            'absolute z-50 mt-1.5 max-h-60 overflow-y-auto bg-white border border-brand-hair rounded-card p-1 shadow-floating outline-none',
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
