import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch, type Slots } from 'vue'
import type { UiSelectOption } from '~/components/ui/UiSelect.vue'

export interface UiSelectPropsInput {
  id?: string
  modelValue: string | number | null
  options?: Array<UiSelectOption | string | number>
  label?: string
  placeholder?: string
  prefix?: string
  disabled?: boolean
  error?: string
  hint?: string
  size?: 'sm' | 'md'
  block?: boolean
  pill?: boolean
  align?: 'left' | 'right'
  title?: string
}

export function useUiSelect(
  props: UiSelectPropsInput,
  onSelectValue: (value: string) => void,
  slots: Slots,
) {
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

  function scrollActiveIntoView() {
    if (!listboxRef.value || activeIndex.value < 0) return
    const items = listboxRef.value.querySelectorAll('[role="option"]')
    const target = items[activeIndex.value] as HTMLElement | undefined
    if (target) {
      target.scrollIntoView({ block: 'nearest' })
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

  function toggleDropdown() {
    if (props.disabled) return
    if (isOpen.value) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }

  function selectOption(opt: UiSelectOption) {
    if (opt.disabled) return
    const strVal = String(opt.value)
    onSelectValue(strVal)
    closeDropdown()
    nextTick(() => {
      triggerRef.value?.focus()
    })
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

  function onTriggerKeydown(event: KeyboardEvent) {
    if (props.disabled) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen.value) openDropdown()
      else navigateOptions(event.key === 'ArrowDown' ? 1 : -1)
      return
    }

    if (event.key === 'Home' && isOpen.value) {
      event.preventDefault()
      activeIndex.value = 0
      scrollActiveIntoView()
      return
    }

    if (event.key === 'End' && isOpen.value) {
      event.preventDefault()
      activeIndex.value = normalizedOptions.value.length - 1
      scrollActiveIntoView()
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
      } else if (activeIndex.value >= 0 && activeIndex.value < normalizedOptions.value.length) {
        const target = normalizedOptions.value[activeIndex.value]
        if (target && !target.disabled) selectOption(target)
      }
      return
    }

    if (event.key === 'Escape' && isOpen.value) {
      event.preventDefault()
      closeDropdown()
      triggerRef.value?.focus()
      return
    }

    if (event.key === 'Tab' && isOpen.value) {
      closeDropdown()
    }
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

  return {
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
  }
}
