import { describe, expect, it, vi } from 'vitest'
import {
  isAllowedTransition,
  getAvailableTransitions,
  type OrderStatus,
} from '../../shared/constants/order-transitions'

/**
 * Task 04: Order Refund & Payment Gateway Reversal Test Suite
 *
 * Menguji:
 * 1. Refund State Machine Rules & Order Eligibility
 * 2. Endpoint Simulation & HTTP Error Semantics (200, 400, 401, 403, 404, 409, 422, 502)
 * 3. Idempotency Replay & Server-Side Amount Derivation
 * 4. Gateway Failure Handling (Order remains paid, no stock mutation)
 */

describe('Refund State Machine & Order Status Matrix', () => {
  it('allows paid orders to transition to refunded on approved refund', () => {
    expect(isAllowedTransition('paid', 'refunded')).toBe(true)
  })

  it('rejects refund transition from pending, shipped, completed, or cancelled', () => {
    expect(isAllowedTransition('pending', 'refunded')).toBe(false)
    expect(isAllowedTransition('shipped', 'refunded')).toBe(false)
    expect(isAllowedTransition('completed', 'refunded')).toBe(false)
    expect(isAllowedTransition('cancelled', 'refunded')).toBe(false)
  })

  it('treats refunded as terminal state (cannot transition anywhere)', () => {
    const statuses: OrderStatus[] = [
      'pending',
      'paid',
      'shipped',
      'completed',
      'cancelled',
      'refunded',
    ]
    for (const target of statuses) {
      expect(isAllowedTransition('refunded', target)).toBe(false)
    }
  })

  it('includes refunded in available transitions only for paid status', () => {
    expect(getAvailableTransitions('paid')).toContain('refunded')
    expect(getAvailableTransitions('pending')).not.toContain('refunded')
    expect(getAvailableTransitions('shipped')).not.toContain('refunded')
    expect(getAvailableTransitions('completed')).not.toContain('refunded')
    expect(getAvailableTransitions('cancelled')).not.toContain('refunded')
    expect(getAvailableTransitions('refunded')).toEqual([])
  })
})

describe('POST /api/orders/:id/refund Endpoint Simulation & Semantics', () => {
  const orderId = 'a1111111-1111-1111-1111-111111111111'
  const refundId = 'r2222222-2222-2222-2222-222222222222'

  // Simulated handler mirroring server/api/orders/[id]/refund.post.ts
  const simulateRefundEndpoint = async (params: {
    orderId?: string
    userRole: 'admin' | 'customer' | 'unauthenticated'
    headers?: Record<string, string | undefined>
    body?: any
    mockCreateAttempt: (args: any) => Promise<{ data: any; error: any }>
    mockExecuteGateway: (args: any) => Promise<any>
    mockFinalizeRefund: (args: any) => Promise<{ data: any; error: any }>
  }) => {
    // 1. Authorization
    if (params.userRole === 'unauthenticated') {
      return { statusCode: 401, status: 'error', message: 'Sesi login tidak valid' }
    }
    if (params.userRole !== 'admin') {
      return { statusCode: 403, status: 'error', message: 'Akses ditolak. Hanya admin.' }
    }

    // 2. ID validation
    if (!params.orderId) {
      return { statusCode: 400, status: 'error', message: 'ID pesanan tidak valid' }
    }

    const reason = params.body?.reason || 'Permintaan refund oleh Administrator'
    const idempotencyKey =
      params.headers?.['idempotency-key'] || params.body?.idempotency_key || 'mock-idempotency-key'

    // 3. Create refund attempt RPC
    const { data: attempt, error: attemptErr } = await params.mockCreateAttempt({
      p_order_id: params.orderId,
      p_idempotency_key: idempotencyKey,
      p_reason: reason,
    })

    if (attemptErr) {
      const msg = attemptErr.message || 'Error'
      if (msg.includes('ORDER_NOT_FOUND')) {
        return { statusCode: 404, status: 'error', message: 'Pesanan tidak ditemukan' }
      }
      if (msg.includes('INVALID_ORDER_STATE_FOR_REFUND')) {
        return { statusCode: 409, status: 'error', message: msg }
      }
      if (msg.includes('REFUND_ALREADY_IN_PROGRESS')) {
        return { statusCode: 409, status: 'error', message: msg }
      }
      return { statusCode: 500, status: 'error', message: msg }
    }

    // Replay check for already succeeded refunds
    if (attempt.is_replay && attempt.status === 'succeeded') {
      return {
        statusCode: 200,
        status: 'success',
        message: 'Refund sudah berhasil diproses sebelumnya (idempotent)',
        data: { ...attempt, order_status: 'refunded' },
      }
    }

    // 4. Gateway execution
    const gatewayResult = await params.mockExecuteGateway({
      orderIdOrTransactionId: attempt.gateway_transaction_id || params.orderId,
      amount: Math.round(attempt.amount_cents / 100),
      reason,
      refundKey: idempotencyKey,
    })

    if (!gatewayResult.success) {
      await params.mockFinalizeRefund({
        p_refund_id: attempt.refund_id,
        p_success: false,
        p_gateway_refund_id: null,
        p_failure_reason: gatewayResult.error || 'Refund rejected',
      })
      const failureCode = gatewayResult.statusCode === '412' ? 422 : 502
      return {
        statusCode: failureCode,
        status: 'error',
        message: gatewayResult.error || 'Refund ditolak oleh payment gateway',
        data: { refund_id: attempt.refund_id, status: 'failed', order_status: 'paid' },
      }
    }

    // 5. Finalize only if bank confirmation arrived
    if (gatewayResult.bankConfirmedAt) {
      const { data: finalizeData, error: finalizeErr } = await params.mockFinalizeRefund({
        p_refund_id: attempt.refund_id,
        p_success: true,
        p_gateway_refund_id: gatewayResult.gatewayRefundId || null,
        p_failure_reason: null,
      })

      if (finalizeErr) {
        return { statusCode: 500, status: 'error', message: 'Finalize RPC failed' }
      }

      return {
        statusCode: 200,
        status: 'success',
        message: 'Refund berhasil diproses oleh payment gateway dan stok telah dikembalikan',
        data: finalizeData,
      }
    }

    // Awaiting bank confirmation
    return {
      statusCode: 200,
      status: 'success',
      message: 'Permintaan refund diterima oleh payment gateway dan menunggu konfirmasi bank',
      data: {
        refund_id: attempt.refund_id,
        order_id: attempt.order_id,
        amount_cents: attempt.amount_cents,
        status: 'pending',
        order_status: 'paid',
        gateway_refund_id: gatewayResult.gatewayRefundId,
        stage: 'accepted',
      },
    }
  }

  it('rejects unauthorized refund requests with 401 or 403', async () => {
    const resGuest = await simulateRefundEndpoint({
      orderId,
      userRole: 'unauthenticated',
      mockCreateAttempt: vi.fn(),
      mockExecuteGateway: vi.fn(),
      mockFinalizeRefund: vi.fn(),
    })
    expect(resGuest.statusCode).toBe(401)

    const resCustomer = await simulateRefundEndpoint({
      orderId,
      userRole: 'customer',
      mockCreateAttempt: vi.fn(),
      mockExecuteGateway: vi.fn(),
      mockFinalizeRefund: vi.fn(),
    })
    expect(resCustomer.statusCode).toBe(403)
  })

  it('rejects refund if order is not found (404)', async () => {
    const res = await simulateRefundEndpoint({
      orderId: 'b9999999-9999-9999-9999-999999999999',
      userRole: 'admin',
      mockCreateAttempt: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'ORDER_NOT_FOUND: Pesanan tidak ditemukan' },
      }),
      mockExecuteGateway: vi.fn(),
      mockFinalizeRefund: vi.fn(),
    })
    expect(res.statusCode).toBe(404)
    expect(res.message).toBe('Pesanan tidak ditemukan')
  })

  it('rejects refund if order is pending, shipped, or cancelled (409 Conflict)', async () => {
    const resPending = await simulateRefundEndpoint({
      orderId,
      userRole: 'admin',
      mockCreateAttempt: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message:
            'INVALID_ORDER_STATE_FOR_REFUND: Hanya pesanan dengan status "paid" yang dapat direfund (status saat ini: pending)',
        },
      }),
      mockExecuteGateway: vi.fn(),
      mockFinalizeRefund: vi.fn(),
    })
    expect(resPending.statusCode).toBe(409)
    expect(resPending.message).toContain('INVALID_ORDER_STATE_FOR_REFUND')
  })

  it('rejects duplicate concurrent refund if one is already active (409 Conflict)', async () => {
    const res = await simulateRefundEndpoint({
      orderId,
      userRole: 'admin',
      mockCreateAttempt: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message:
            'REFUND_ALREADY_IN_PROGRESS: Pesanan ini sudah memiliki refund aktif atau telah berhasil direfund',
        },
      }),
      mockExecuteGateway: vi.fn(),
      mockFinalizeRefund: vi.fn(),
    })
    expect(res.statusCode).toBe(409)
    expect(res.message).toContain('REFUND_ALREADY_IN_PROGRESS')
  })

  it('handles idempotent replay for already succeeded refund (200 OK without re-charging gateway)', async () => {
    const mockExecuteGateway = vi.fn()
    const res = await simulateRefundEndpoint({
      orderId,
      userRole: 'admin',
      headers: { 'idempotency-key': 'ref-key-123' },
      mockCreateAttempt: vi.fn().mockResolvedValue({
        data: {
          refund_id: refundId,
          order_id: orderId,
          amount_cents: 15000000,
          status: 'succeeded',
          idempotency_key: 'ref-key-123',
          is_replay: true,
        },
        error: null,
      }),
      mockExecuteGateway,
      mockFinalizeRefund: vi.fn(),
    })

    expect(res.statusCode).toBe(200)
    expect(res.message).toContain('idempotent')
    expect(res.data.status).toBe('succeeded')
    expect(mockExecuteGateway).not.toHaveBeenCalled()
  })

  it('processes accepted refund awaiting bank confirmation (200 OK, pending, order paid, no stock mutation)', async () => {
    const mockCreateAttempt = vi.fn().mockResolvedValue({
      data: {
        refund_id: refundId,
        order_id: orderId,
        amount_cents: 20000000,
        status: 'pending',
        idempotency_key: 'ref-key-456',
        gateway_transaction_id: 'mid-txn-999',
        is_replay: false,
      },
      error: null,
    })

    const mockExecuteGateway = vi.fn().mockResolvedValue({
      success: true,
      statusCode: '200',
      statusMessage: 'Success, refund request is approved',
      gatewayRefundId: 'rf-chargeback-1',
      // bankConfirmedAt is absent -> stage: 'accepted'
    })

    const mockFinalizeRefund = vi.fn()

    const res = await simulateRefundEndpoint({
      orderId,
      userRole: 'admin',
      headers: { 'idempotency-key': 'ref-key-456' },
      body: { reason: 'Customer requested refund for defect item' },
      mockCreateAttempt,
      mockExecuteGateway,
      mockFinalizeRefund,
    })

    expect(res.statusCode).toBe(200)
    expect(res.status).toBe('success')
    expect(res.message).toContain('menunggu konfirmasi bank')
    expect(res.data.status).toBe('pending')
    expect(res.data.order_status).toBe('paid')
    expect(res.data.stage).toBe('accepted')
    expect(mockFinalizeRefund).not.toHaveBeenCalled()
  })

  it('processes confirmed refund with bank_confirmed_at (200 OK, gateway approved & confirmed, order refunded)', async () => {
    const mockCreateAttempt = vi.fn().mockResolvedValue({
      data: {
        refund_id: refundId,
        order_id: orderId,
        amount_cents: 20000000,
        status: 'pending',
        idempotency_key: 'ref-key-456',
        gateway_transaction_id: 'mid-txn-999',
        is_replay: false,
      },
      error: null,
    })

    const mockExecuteGateway = vi.fn().mockResolvedValue({
      success: true,
      statusCode: '200',
      statusMessage: 'Success, refund request is approved and bank confirmed',
      gatewayRefundId: 'rf-chargeback-1',
      bankConfirmedAt: '2026-10-08T12:00:00Z',
    })

    const mockFinalizeRefund = vi.fn().mockResolvedValue({
      data: {
        refund_id: refundId,
        order_id: orderId,
        status: 'succeeded',
        order_status: 'refunded',
        already_finalized: false,
      },
      error: null,
    })

    const res = await simulateRefundEndpoint({
      orderId,
      userRole: 'admin',
      headers: { 'idempotency-key': 'ref-key-456' },
      body: { reason: 'Customer requested refund for defect item' },
      mockCreateAttempt,
      mockExecuteGateway,
      mockFinalizeRefund,
    })

    expect(res.statusCode).toBe(200)
    expect(res.status).toBe('success')
    expect(res.data.status).toBe('succeeded')
    expect(res.data.order_status).toBe('refunded')
    expect(mockExecuteGateway).toHaveBeenCalledWith({
      orderIdOrTransactionId: 'mid-txn-999',
      amount: 200000,
      reason: 'Customer requested refund for defect item',
      refundKey: 'ref-key-456',
    })
    expect(mockFinalizeRefund).toHaveBeenCalledWith({
      p_refund_id: refundId,
      p_success: true,
      p_gateway_refund_id: 'rf-chargeback-1',
      p_failure_reason: null,
    })
  })

  it('handles gateway refusal cleanly (422 / 502, order remains paid, stock untouched)', async () => {
    const mockCreateAttempt = vi.fn().mockResolvedValue({
      data: {
        refund_id: refundId,
        order_id: orderId,
        amount_cents: 20000000,
        status: 'pending',
        idempotency_key: 'ref-key-failed',
        gateway_transaction_id: 'mid-txn-999',
        is_replay: false,
      },
      error: null,
    })

    const mockExecuteGateway = vi.fn().mockResolvedValue({
      success: false,
      statusCode: '412',
      error: 'Merchant does not support automatic refund for this payment type',
    })

    const mockFinalizeRefund = vi.fn().mockResolvedValue({
      data: {
        refund_id: refundId,
        order_id: orderId,
        status: 'failed',
        order_status: 'paid',
        failure_reason: 'Merchant does not support automatic refund for this payment type',
        already_finalized: false,
      },
      error: null,
    })

    const res = await simulateRefundEndpoint({
      orderId,
      userRole: 'admin',
      headers: { 'idempotency-key': 'ref-key-failed' },
      mockCreateAttempt,
      mockExecuteGateway,
      mockFinalizeRefund,
    })

    expect(res.statusCode).toBe(422)
    expect(res.status).toBe('error')
    expect(res.message).toContain('Merchant does not support automatic refund')
    expect(res.data.status).toBe('failed')
    expect(res.data.order_status).toBe('paid')
  })
})
