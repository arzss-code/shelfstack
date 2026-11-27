import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch, type Slots } from 'vue'
import type { UiSelectOption } from '~/components/ui/UiSelect.vue'
import {
  buildUiSelectTriggerClass,
  computeUiSelectFloatingStyle,
} from '~/composables/useUiSelectLayout'

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
  size?: 'xs' | 'sm' | 'md'
  block?: boolean
  pill?: boolean
  align?: 'left' | 'right'
  title?: string
  teleport?: boolean
  compactTrigger?: boolean
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
  const floatingStyle = ref<Record<string, string>>({})
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
    () => extractSlotOptions(),
    { immediate: true },
  )

  const normalizedOptions = computed<UiSelectOption[]>(() => {
    if (props.options && props.options.length > 0) {
      return props.options.map((opt) =>
        typeof opt === 'string' || typeof opt === 'number'
          ? { value: opt, label: String(opt) }
          : opt,
      )
    }
    return parsedSlotOptions.value
  })

  const selectedOption = computed(() => {
    const val = props.modelValue
    if (val === null || val === undefined || val === '') return null
    return normalizedOptions.value.find((opt) => String(opt.value) === String(val)) ?? null
  })

  const displayLabel = computed(() => {
    if (selectedOption.value) return selectedOption.value.label
    return props.placeholder || 'Pilih opsi...'
  })

  const triggerClass = computed(() =>
    buildUiSelectTriggerClass({
      size: props.size,
      pill: props.pill,
      error: props.error,
      isOpen: isOpen.value,
      block: props.block,
      compactTrigger: props.compactTrigger,
      align: props.align,
    }),
  )

  function updateFloatingPosition() {
    floatingStyle.value = props.teleport
      ? computeUiSelectFloatingStyle(triggerRef.value, props.align)
      : {}
  }

  function scrollActiveIntoView() {
    if (!listboxRef.value || activeIndex.value < 0) return
    const items = listboxRef.value.querySelectorAll('[role="option"]')
    const target = items[activeIndex.value] as HTMLElement | undefined
    if (target) target.scrollIntoView({ block: 'nearest' })
  }

  function openDropdown() {
    if (props.disabled) return
    isOpen.value = true
    updateFloatingPosition()
    const curIdx = normalizedOptions.value.findIndex(
      (opt) => String(opt.value) === String(props.modelValue),
    )
    activeIndex.value = curIdx >= 0 ? curIdx : 0
    nextTick(() => {
      updateFloatingPosition()
      scrollActiveIntoView()
    })
  }

  function closeDropdown() {
    isOpen.value = false
    activeIndex.value = -1
  }

  function toggleDropdown() {
    if (props.disabled) return
    if (isOpen.value) closeDropdown()
    else openDropdown()
  }

  function selectOption(opt: UiSelectOption) {
    if (opt.disabled) return
    onSelectValue(String(opt.value))
    closeDropdown()
    nextTick(() => triggerRef.value?.focus())
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
      if (!isOpen.value) openDropdown()
      else if (activeIndex.value >= 0 && activeIndex.value < normalizedOptions.value.length) {
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
    if (event.key === 'Tab' && isOpen.value) closeDropdown()
  }

  function handleClickOutside(event: MouseEvent) {
    if (!isOpen.value) return
    const target = event.target as Node | null
    if (!target) return
    if (!rootRef.value?.contains(target) && !listboxRef.value?.contains(target)) {
      closeDropdown()
    }
  }

  function handleViewportChange() {
    if (isOpen.value && props.teleport) updateFloatingPosition()
  }

  onMounted(() => {
    extractSlotOptions()
    document.addEventListener('pointerdown', handleClickOutside, { passive: true })
    window.addEventListener('scroll', handleViewportChange, true)
    window.addEventListener('resize', handleViewportChange, { passive: true })
  })

  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', handleClickOutside)
    window.removeEventListener('scroll', handleViewportChange, true)
    window.removeEventListener('resize', handleViewportChange)
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
    floatingStyle,
    normalizedOptions,
    selectedOption,
    displayLabel,
    triggerClass,
    toggleDropdown,
    selectOption,
    onTriggerKeydown,
  }
}
