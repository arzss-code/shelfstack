import { describe, expect, it, vi } from 'vitest'
import {
  isAllowedTransition,
  isAllowedAdminTransition,
  getAvailableTransitions,
  getAvailableAdminTransitions,
  type OrderStatus,
} from '../../shared/constants/order-transitions'

/**
 * Task 03: Order State Machine & Admin Status Transition Hardening Test Suite
 *
 * Menguji:
 * 1. State Machine Transition Matrix (allowed vs forbidden)
 * 2. Admin Endpoint Request Handling & HTTP Semantics (200, 400, 403, 404, 409)
 * 3. Atomic Database RPC Error Mapping & Idempotent No-Op
 */

describe('Order State Machine Matrix (Task 03)', () => {
  it('allows pending -> paid and pending -> cancelled', () => {
    expect(isAllowedTransition('pending', 'paid')).toBe(true)
    expect(isAllowedTransition('pending', 'cancelled')).toBe(true)
  })

  it('allows paid -> shipped', () => {
    expect(isAllowedTransition('paid', 'shipped')).toBe(true)
  })

  it('strictly rejects paid -> cancelled (no refund flow implemented yet)', () => {
    expect(isAllowedTransition('paid', 'cancelled')).toBe(false)
  })

  it('allows shipped -> completed', () => {
    expect(isAllowedTransition('shipped', 'completed')).toBe(true)
  })

  it('strictly rejects illegal forward skips (pending -> shipped, pending -> completed)', () => {
    expect(isAllowedTransition('pending', 'shipped')).toBe(false)
    expect(isAllowedTransition('pending', 'completed')).toBe(false)
  })

  it('strictly rejects reverse rollbacks (paid -> pending, shipped -> paid, shipped -> pending)', () => {
    expect(isAllowedTransition('paid', 'pending')).toBe(false)
    expect(isAllowedTransition('shipped', 'paid')).toBe(false)
    expect(isAllowedTransition('shipped', 'pending')).toBe(false)
  })

  it('strictly rejects mutating terminal states (completed, cancelled, or refunded)', () => {
    const allStatuses: OrderStatus[] = [
      'pending',
      'paid',
      'shipped',
      'completed',
      'cancelled',
      'refunded',
    ]
    for (const target of allStatuses) {
      expect(isAllowedTransition('completed', target)).toBe(false)
      expect(isAllowedTransition('cancelled', target)).toBe(false)
      expect(isAllowedTransition('refunded', target)).toBe(false)
    }
  })

  it('returns exact allowed target transitions per state', () => {
    expect(getAvailableTransitions('pending')).toEqual(['paid', 'cancelled'])
    expect(getAvailableTransitions('paid')).toEqual(['shipped', 'refunded'])
    expect(getAvailableTransitions('shipped')).toEqual(['completed'])
    expect(getAvailableTransitions('completed')).toEqual([])
    expect(getAvailableTransitions('cancelled')).toEqual([])
    expect(getAvailableTransitions('refunded')).toEqual([])
  })

  it('disallows pending -> paid for admin manual transitions (gateway-only payment guard)', () => {
    expect(isAllowedAdminTransition('pending', 'paid')).toBe(false)
    expect(isAllowedAdminTransition('pending', 'cancelled')).toBe(true)
    expect(getAvailableAdminTransitions('pending')).toEqual(['cancelled'])
  })
})

describe('Admin Status PUT Endpoint Simulation & Error Semantics', () => {
  const validOrderId = 'a0000000-0000-0000-0000-000000000001'

  // Simulated handler mirroring server/api/orders/[id]/status.put.ts
  const simulateStatusEndpoint = async (params: {
    orderId?: string
    body: any
    userRole: 'admin' | 'customer' | 'unauthenticated'
    mockRpc: (name: string, args: any) => Promise<{ data: any; error: any }>
  }) => {
    // 1. Authorization
    if (params.userRole === 'unauthenticated') {
      return { statusCode: 401, status: 'error', message: 'Sesi login tidak valid' }
    }
    if (params.userRole !== 'admin') {
      return { statusCode: 403, status: 'error', message: 'Akses ditolak. Hanya admin.' }
    }

    // 2. Param validation
    if (!params.orderId) {
      return { statusCode: 400, status: 'error', message: 'ID pesanan tidak valid' }
    }

    // 3. Body validation
    const targetStatus = params.body?.status as OrderStatus
    const reason = params.body?.reason || ''

    if (!targetStatus) {
      return { statusCode: 400, status: 'error', message: 'Status target wajib disertakan' }
    }

    const validStatuses: OrderStatus[] = [
      'pending',
      'paid',
      'shipped',
      'completed',
      'cancelled',
      'refunded',
    ]
    if (!validStatuses.includes(targetStatus)) {
      return {
        statusCode: 400,
        status: 'error',
        message: `Status target tidak valid: ${targetStatus}`,
      }
    }

    // 4. Call RPC
    const { data, error } = await params.mockRpc('transition_order_status', {
      p_order_id: params.orderId,
      p_target_status: targetStatus,
      p_reason: reason || undefined,
    })

    if (error) {
      const errorMsg = error.message || 'Gagal memperbarui status pesanan'
      if (errorMsg.includes('ORDER_NOT_FOUND')) {
        return { statusCode: 404, status: 'error', message: 'Pesanan tidak ditemukan' }
      }
      if (errorMsg.includes('FORBIDDEN_NOT_ADMIN')) {
        return { statusCode: 403, status: 'error', message: 'Akses ditolak. Hanya admin.' }
      }
      if (
        errorMsg.includes('INVALID_ORDER_TRANSITION') ||
        errorMsg.includes('ADMIN_PAYMENT_OVERRIDE_DISABLED') ||
        errorMsg.includes('DIRECT_STATUS_MUTATION_FORBIDDEN') ||
        errorMsg.includes('TERMINAL_ORDER_STATE')
      ) {
        return { statusCode: 409, status: 'error', message: errorMsg }
      }
      return { statusCode: 500, status: 'error', message: errorMsg }
    }

    return {
      statusCode: 200,
      status: 'success',
      message: data.message || `Status pesanan berhasil diperbarui menjadi ${targetStatus}`,
      data,
    }
  }

  it('rejects unauthorized requests from customer or guest', async () => {
    const mockRpc = vi.fn()

    const guestRes = await simulateStatusEndpoint({
      orderId: validOrderId,
      body: { status: 'shipped' },
      userRole: 'unauthenticated',
      mockRpc,
    })
    expect(guestRes.statusCode).toBe(401)
    expect(mockRpc).not.toHaveBeenCalled()

    const customerRes = await simulateStatusEndpoint({
      orderId: validOrderId,
      body: { status: 'shipped' },
      userRole: 'customer',
      mockRpc,
    })
    expect(customerRes.statusCode).toBe(403)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('validates required orderId and targetStatus', async () => {
    const mockRpc = vi.fn()

    const noIdRes = await simulateStatusEndpoint({
      body: { status: 'paid' },
      userRole: 'admin',
      mockRpc,
    })
    expect(noIdRes.statusCode).toBe(400)

    const noStatusRes = await simulateStatusEndpoint({
      orderId: validOrderId,
      body: {},
      userRole: 'admin',
      mockRpc,
    })
    expect(noStatusRes.statusCode).toBe(400)

    const invalidStatusRes = await simulateStatusEndpoint({
      orderId: validOrderId,
      body: { status: 'flying' },
      userRole: 'admin',
      mockRpc,
    })
    expect(invalidStatusRes.statusCode).toBe(400)
    expect(invalidStatusRes.message).toContain('Status target tidak valid: flying')
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('executes valid admin transition (paid -> shipped) returning HTTP 200', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: {
        order_id: validOrderId,
        current_status: 'shipped',
        previous_status: 'paid',
        no_op: false,
        message: 'Status pesanan berhasil diubah menjadi shipped',
      },
      error: null,
    })

    const res = await simulateStatusEndpoint({
      orderId: validOrderId,
      body: { status: 'shipped', reason: 'Resi kurir JNE-123' },
      userRole: 'admin',
      mockRpc,
    })

    expect(res.statusCode).toBe(200)
    expect(res.status).toBe('success')
    expect(res.data.current_status).toBe('shipped')
    expect(mockRpc).toHaveBeenCalledWith('transition_order_status', {
      p_order_id: validOrderId,
      p_target_status: 'shipped',
      p_reason: 'Resi kurir JNE-123',
    })
  })

  it('handles idempotent duplicate transition (same status) returning HTTP 200 with no_op flag', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: {
        order_id: validOrderId,
        current_status: 'shipped',
        previous_status: 'shipped',
        no_op: true,
        message: 'Status pesanan sudah dalam status target (shipped)',
      },
      error: null,
    })

    const res = await simulateStatusEndpoint({
      orderId: validOrderId,
      body: { status: 'shipped' },
      userRole: 'admin',
      mockRpc,
    })

    expect(res.statusCode).toBe(200)
    expect(res.data.no_op).toBe(true)
  })

  it('maps ORDER_NOT_FOUND error to HTTP 404', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'ORDER_NOT_FOUND: Pesanan tidak ditemukan' },
    })

    const res = await simulateStatusEndpoint({
      orderId: 'b0000000-0000-0000-0000-000000000999',
      body: { status: 'shipped' },
      userRole: 'admin',
      mockRpc,
    })

    expect(res.statusCode).toBe(404)
    expect(res.message).toBe('Pesanan tidak ditemukan')
  })

  it('maps INVALID_ORDER_TRANSITION error to HTTP 409 Conflict', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message:
          'INVALID_ORDER_TRANSITION: Pesanan berstatus paid tidak dapat dibatalkan tanpa proses refund resmi (fitur refund belum tersedia)',
      },
    })

    const res = await simulateStatusEndpoint({
      orderId: validOrderId,
      body: { status: 'cancelled' },
      userRole: 'admin',
      mockRpc,
    })

    expect(res.statusCode).toBe(409)
    expect(res.message).toContain('INVALID_ORDER_TRANSITION')
  })

  it('maps ADMIN_PAYMENT_OVERRIDE_DISABLED error to HTTP 409 Conflict', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message:
          'ADMIN_PAYMENT_OVERRIDE_DISABLED: Perubahan status dari "pending" ke "paid" oleh admin dinonaktifkan. Status paid hanya dapat ditetapkan melalui konfirmasi resmi payment gateway (Midtrans).',
      },
    })

    const res = await simulateStatusEndpoint({
      orderId: validOrderId,
      body: { status: 'paid' },
      userRole: 'admin',
      mockRpc,
    })

    expect(res.statusCode).toBe(409)
    expect(res.message).toContain('ADMIN_PAYMENT_OVERRIDE_DISABLED')
  })

  it('maps DIRECT_STATUS_MUTATION_FORBIDDEN error to HTTP 409 Conflict', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message:
          'DIRECT_STATUS_MUTATION_FORBIDDEN: Perubahan status pesanan dari "pending" ke "paid" ditolak. Direct SQL UPDATE dilarang; seluruh perubahan status wajib melalui canonical RPC resmi.',
      },
    })

    const res = await simulateStatusEndpoint({
      orderId: validOrderId,
      body: { status: 'paid' },
      userRole: 'admin',
      mockRpc,
    })

    expect(res.statusCode).toBe(409)
    expect(res.message).toContain('DIRECT_STATUS_MUTATION_FORBIDDEN')
  })
})
