export type UiConfirmTone = 'primary' | 'danger' | 'success'

export interface UiConfirmOptions {
  message: string
  header: string
  tone?: UiConfirmTone
  acceptLabel?: string
  rejectLabel?: string
  accept?: () => void | Promise<void>
}

export const useUiConfirm = () => {
  const confirmState = useState<UiConfirmOptions | null>('ui-confirm', () => null)
  const confirmBusy = useState<boolean>('ui-confirm-busy', () => false)

  const close = () => {
    confirmState.value = null
    confirmBusy.value = false
  }

  const accept = async () => {
    const current = confirmState.value
    if (!current?.accept) {
      close()
      return
    }
    confirmBusy.value = true
    try {
      await current.accept()
      close()
    } catch {
      confirmBusy.value = false
    }
  }

  const require = (options: UiConfirmOptions) => {
    confirmState.value = options
    confirmBusy.value = false
  }

  return { confirmState, confirmBusy, require, accept, close }
}
