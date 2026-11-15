import { ref, computed } from 'vue'
import { useCartStore } from '~/features/cart/stores/cart'
import { useUiToast } from '~/composables/useUiToast'
import type { CartReconcileResponse } from '~~/shared/schemas/cart-reconcile'

export function useCartReconciliation() {
  const cartStore = useCartStore()
  let toast: ReturnType<typeof useUiToast> | null = null
  try {
    toast = useUiToast()
  } catch {
    // Graceful fallback outside Nuxt context
  }

  const isReconciling = ref(false)
  const driftWarnings = ref<string[]>([])

  const hasOutOfStockItems = computed(() =>
    cartStore.items.some((item) => item.stock <= 0 || item.quantity === 0),
  )

  const outOfStockItems = computed(() =>
    cartStore.items.filter((item) => item.stock <= 0 || item.quantity === 0),
  )

  const dismissWarning = (index: number) => {
    driftWarnings.value.splice(index, 1)
  }

  const clearWarnings = () => {
    driftWarnings.value = []
  }

  const reconcileCart = async (silent = false): Promise<boolean> => {
    if (cartStore.items.length === 0) {
      driftWarnings.value = []
      return false
    }

    isReconciling.value = true
    try {
      const payload = {
        items: cartStore.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || null,
          quantity: i.quantity,
          priceCents: i.priceCents,
        })),
      }

      const res = await $fetch<{ status: string; data: CartReconcileResponse }>(
        '/api/cart/reconcile',
        {
          method: 'POST',
          body: payload,
        },
      )

      if (res.data) {
        let stateChanged = false

        for (const r of res.data.items) {
          const matched = cartStore.items.find(
            (item) =>
              item.productId === r.productId && (item.variantId || null) === (r.variantId || null),
          )

          if (matched) {
            if (matched.stock !== r.currentStock) {
              matched.stock = r.currentStock
              stateChanged = true
            }

            if (r.adjustedQuantity !== matched.quantity) {
              matched.quantity = r.adjustedQuantity
              stateChanged = true
            }

            if (r.priceChanged) {
              matched.priceCents = r.currentPriceCents
              matched.price = r.currentPriceCents / 100
              stateChanged = true
            }
          }
        }

        if (stateChanged) {
          cartStore.saveCart()
        }

        if (res.data.hasDrift && res.data.warnings.length > 0) {
          driftWarnings.value = res.data.warnings
          if (!silent && toast) {
            toast.show({
              title: 'Pembaruan Keranjang',
              message: 'Terdapat penyesuaian stok atau harga terkini dari gudang resmi.',
              tone: 'warn',
            })
          }
        } else {
          driftWarnings.value = []
        }

        return res.data.hasDrift
      }

      return false
    } catch {
      // Fail-open: jika jaringan bermasalah, pertahankan keranjang lokal tanpa memblokir pembeli
      return false
    } finally {
      isReconciling.value = false
    }
  }

  return {
    isReconciling,
    driftWarnings,
    hasOutOfStockItems,
    outOfStockItems,
    dismissWarning,
    clearWarnings,
    reconcileCart,
  }
}
