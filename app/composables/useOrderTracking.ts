import { ref, computed, type Ref } from 'vue'
import type { Order } from '~/types/order'
import type { ShippingCheckpoint } from '~~/shared/schemas/shipping'
import { resolveLatestCheckpointLocation } from '~/utils/order-presentation'

/**
 * Composable untuk pelacakan status pengiriman dan riwayat checkpoint pesanan.
 */
export function useOrderTracking(orderId: string, order: Ref<Order | null>) {
  const customerCheckpoints = ref<ShippingCheckpoint[]>([])
  const copiedHeaderResi = ref(false)

  const copyHeaderResi = async (resi?: string | null) => {
    if (!resi || !import.meta.client) return
    try {
      await navigator.clipboard.writeText(resi)
      copiedHeaderResi.value = true
      setTimeout(() => {
        copiedHeaderResi.value = false
      }, 2000)
    } catch {
      // Clipboard fallback
    }
  }

  const fetchCustomerTracking = async () => {
    if (!order.value?.tracking_number) {
      customerCheckpoints.value = []
      return
    }
    try {
      const res = await $fetch<{ success: boolean; data: { checkpoints: ShippingCheckpoint[] } }>(
        `/api/orders/${orderId}/tracking`,
      )
      if (res?.data?.checkpoints) {
        customerCheckpoints.value = res.data.checkpoints
      }
    } catch {
      customerCheckpoints.value = []
    }
  }

  const activeCheckpoints = computed(() => {
    if (customerCheckpoints.value.length > 0) return customerCheckpoints.value
    return order.value?.checkpoints || []
  })

  const activeLatestCheckpoint = computed(() => {
    if (activeCheckpoints.value.length === 0) return null
    return [...activeCheckpoints.value].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]
  })

  const activeLatestCheckpointLocation = computed(() =>
    resolveLatestCheckpointLocation(
      activeCheckpoints.value,
      order.value?.status,
      order.value?.address?.city,
    ),
  )

  const activeLatestCheckpointTitle = computed(() => activeLatestCheckpoint.value?.title || '')

  return {
    customerCheckpoints,
    copiedHeaderResi,
    copyHeaderResi,
    fetchCustomerTracking,
    activeCheckpoints,
    activeLatestCheckpoint,
    activeLatestCheckpointLocation,
    activeLatestCheckpointTitle,
  }
}
