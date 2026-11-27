<script setup lang="ts">
import { ref } from 'vue'
import type { UiSelectOption } from '~/components/ui/UiSelect.vue'

defineProps<{
  isOpen: boolean
  listboxId: string
  selectId: string
  activeIndex: number
  modelValue: string | number | null
  normalizedOptions: UiSelectOption[]
  teleport: boolean
  floatingStyle: Record<string, string>
  align: 'left' | 'right'
  block: boolean
}>()

const emit = defineEmits<{
  select: [opt: UiSelectOption]
  hoverIndex: [idx: number]
}>()

const listboxEl = ref<HTMLElement | null>(null)
defineExpose({ listboxEl })
</script>

<template>
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
      ref="listboxEl"
      role="listbox"
      tabindex="-1"
      :aria-activedescendant="activeIndex >= 0 ? `${selectId}-opt-${activeIndex}` : undefined"
      :style="teleport ? floatingStyle : undefined"
      :class="[
        teleport ? 'fixed z-[70]' : 'absolute z-50 mt-1.5',
        'max-h-60 overflow-y-auto bg-brand-canvas border border-brand-hair rounded-card p-1 shadow-floating outline-none',
        !teleport && (align === 'right' ? 'right-0' : 'left-0'),
        !teleport && (block ? 'w-full' : 'min-w-full w-max max-w-xs sm:max-w-sm'),
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
          'w-full flex items-center justify-between gap-2.5 px-3 py-1.5 text-left text-xs rounded-xl transition-colors cursor-pointer select-none border-0 whitespace-nowrap',
          String(opt.value) === String(modelValue)
            ? 'bg-brand-canvas-soft text-brand-ink font-semibold'
            : activeIndex === idx
              ? 'bg-brand-canvas-soft/80 text-brand-ink font-medium'
              : 'text-brand-ink hover:bg-brand-canvas-soft hover:text-brand-ink font-normal',
          opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
        ]"
        @click="emit('select', opt)"
        @mouseenter="emit('hoverIndex', idx)"
      >
        <div class="flex flex-col min-w-0">
          <span class="truncate">{{ opt.label }}</span>
          <span v-if="opt.description" class="text-[10px] text-brand-muted truncate">
            {{ opt.description }}
          </span>
        </div>
        <i
          v-if="String(opt.value) === String(modelValue)"
          class="pi pi-check text-[11px] text-brand-ink shrink-0 font-bold"
          aria-hidden="true"
        />
      </button>
    </div>
  </Transition>
</template>
