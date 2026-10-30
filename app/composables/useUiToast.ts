export type UiToastSeverity = 'success' | 'error' | 'info' | 'warn' | 'secondary'

export interface UiToastInput {
  /** `warn` untuk perhatian, `secondary` untuk informasi biasa. */
  severity?: UiToastSeverity
  summary: string
  detail?: string
  /** Milidetik sebelum menutup, 0 berarti tidak menutup sendiri. */
  life?: number
}

export interface UiToastShowOptions {
  title?: string
  summary?: string
  message?: string
  detail?: string
  tone?: 'success' | 'error' | 'info' | 'warn' | 'secondary'
  severity?: UiToastSeverity
  life?: number
}

export interface UiToastEntry {
  id: number
  severity: UiToastSeverity
  summary: string
  detail: string
  life: number
}

const DEFAULT_LIFE = 4000

export const useUiToast = () => {
  const toasts = useState<UiToastEntry[]>('ui-toasts', () => [])

  const remove = (id: number) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  const add = (input: UiToastInput) => {
    const id = toasts.value.reduce((max, toast) => Math.max(max, toast.id), 0) + 1
    const life = input.life ?? DEFAULT_LIFE
    toasts.value = [
      ...toasts.value,
      {
        id,
        severity: input.severity ?? 'secondary',
        summary: input.summary,
        detail: input.detail ?? '',
        life,
      },
    ]
    if (import.meta.client && life > 0) {
      window.setTimeout(() => remove(id), life)
    }
    return id
  }

  const show = (options: UiToastShowOptions) => {
    return add({
      summary: options.title ?? options.summary ?? '',
      detail: options.message ?? options.detail ?? '',
      severity: (options.tone ?? options.severity ?? 'secondary') as UiToastSeverity,
      life: options.life,
    })
  }

  const clear = () => {
    toasts.value = []
  }

  return { toasts, add, show, remove, clear }
}
