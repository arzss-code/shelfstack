export interface UiSelectLayoutInput {
  size?: 'xs' | 'sm' | 'md'
  pill?: boolean
  error?: string
  isOpen: boolean
  block?: boolean
  compactTrigger?: boolean
  align?: 'left' | 'right'
}

export function buildUiSelectTriggerClass(opts: UiSelectLayoutInput): string {
  const isPill = opts.pill !== undefined ? opts.pill : opts.size === 'sm'
  const geometry = opts.compactTrigger
    ? 'h-7 rounded-full py-0 px-2.5 text-[11px] font-semibold'
    : opts.size === 'xs'
      ? isPill
        ? 'h-8 rounded-full py-1 px-3 text-xs'
        : 'h-8 rounded-field py-1 px-2.5 text-xs'
      : opts.size === 'sm'
        ? isPill
          ? 'h-9 rounded-full py-1.5 px-3.5 text-xs'
          : 'h-9 rounded-field py-1.5 px-3 text-xs'
        : isPill
          ? 'h-11 rounded-full py-2.5 px-4 text-sm'
          : 'h-11 rounded-field py-2.5 px-3.5 text-sm'

  const border = opts.error
    ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-inset focus:ring-rose-500'
    : opts.isOpen
      ? 'border-brand-ink ring-1 ring-inset ring-brand-ink'
      : 'border-brand-hair hover:border-brand-faint focus:border-brand-ink focus:ring-1 focus:ring-inset focus:ring-brand-ink'

  const widthCls = opts.block
    ? 'w-full'
    : opts.compactTrigger
      ? 'w-auto min-w-[74px]'
      : 'min-w-[120px]'

  return [
    'inline-flex items-center justify-between border bg-brand-canvas text-brand-ink transition-all',
    opts.compactTrigger ? 'gap-1.5 font-semibold' : 'gap-2 font-medium',
    'cursor-pointer select-none text-left outline-none',
    'disabled:cursor-not-allowed disabled:bg-brand-field disabled:text-brand-muted disabled:border-brand-hairsoft',
    widthCls,
    geometry,
    border,
  ].join(' ')
}

export function computeUiSelectFloatingStyle(
  triggerEl: HTMLElement | null,
  align: 'left' | 'right' = 'left',
): Record<string, string> {
  if (!triggerEl || typeof window === 'undefined') return {}
  const rect = triggerEl.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - 8
  const spaceAbove = rect.top - 8
  const openUpward = spaceBelow < 210 && spaceAbove > spaceBelow
  const maxHeight = Math.max(120, Math.min(240, openUpward ? spaceAbove : spaceBelow))
  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: '70',
    minWidth: `${Math.max(rect.width, 96)}px`,
    maxHeight: `${maxHeight}px`,
  }
  if (openUpward) {
    style.bottom = `${window.innerHeight - rect.top + 6}px`
  } else {
    style.top = `${rect.bottom + 6}px`
  }
  if (align === 'right') {
    style.right = `${Math.max(8, window.innerWidth - rect.right)}px`
  } else {
    style.left = `${Math.max(8, Math.min(window.innerWidth - Math.max(rect.width, 110) - 8, rect.left))}px`
  }
  return style
}
