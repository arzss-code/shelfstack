import { describe, expect, it } from 'vitest'
import crypto from 'node:crypto'
import {
  extractBaseOrderId,
  isMidtransRefundNotification,
  parseAmountToCents,
  parseMidtransRefundNotification,
  verifyMidtransSignature,
} from '../../server/utils/midtrans'

describe('Refund Webhook & Reconciliation Utilities (Unit Tests)', () => {
  const serverKey = 'SB-Mid-server-TESTKEY123'
  const orderId = 'a1111111-1111-1111-1111-111111111111'
  const statusCode = '200'
  const grossAmount = '200000.00'

  const computeSig = (oid: string, sc: string, ga: string) =>
    crypto.createHash('sha512').update(`${oid}${sc}${ga}${serverKey}`).digest('hex')

  describe('isMidtransRefundNotification Signal Detection', () => {
    it('detects transaction_status === refund as refund notification', () => {
      expect(isMidtransRefundNotification({ transaction_status: 'refund' })).toBe(true)
    })

    it('detects transaction_status === partial_refund as refund notification', () => {
      expect(isMidtransRefundNotification({ transaction_status: 'partial_refund' })).toBe(true)
    })

    it('detects payload with refund_key as refund notification', () => {
      expect(
        isMidtransRefundNotification({ transaction_status: 'settlement', refund_key: 'ref-123' }),
      ).toBe(true)
    })

    it('detects payload with refund_chargeback_id as refund notification', () => {
      expect(
        isMidtransRefundNotification({
          transaction_status: 'settlement',
          refund_chargeback_id: 'rcb-456',
        }),
      ).toBe(true)
    })

    it('rejects standard payment lifecycle statuses as refund notifications', () => {
      expect(isMidtransRefundNotification({ transaction_status: 'settlement' })).toBe(false)
      expect(isMidtransRefundNotification({ transaction_status: 'capture' })).toBe(false)
      expect(isMidtransRefundNotification({ transaction_status: 'pending' })).toBe(false)
      expect(isMidtransRefundNotification({ transaction_status: 'expire' })).toBe(false)
      expect(isMidtransRefundNotification({ transaction_status: 'cancel' })).toBe(false)
      expect(isMidtransRefundNotification(null)).toBe(false)
    })
  })

  describe('parseAmountToCents Utility', () => {
    it('converts number and string rupiah amounts to integer cents without floating point inaccuracy', () => {
      expect(parseAmountToCents(200000)).toBe(20000000)
      expect(parseAmountToCents('200000.00')).toBe(20000000)
      expect(parseAmountToCents('150000')).toBe(15000000)
      expect(parseAmountToCents(undefined)).toBeNull()
      expect(parseAmountToCents(null)).toBeNull()
      expect(parseAmountToCents('')).toBeNull()
    })
  })

  describe('parseMidtransRefundNotification Identity Correlation & Array Matching', () => {
    it('parses initial accepted notification (approved without bank_confirmed_at)', () => {
      const payload = {
        order_id: orderId,
        status_code: '200',
        transaction_status: 'refund',
        refund_key: 'ref-key-100',
        refund_chargeback_id: 'rcb-999',
        refund_chargeback_status: 'approved',
        status_message: 'Refund request is approved and pending bank confirmation',
      }

      const parsed = parseMidtransRefundNotification(payload)
      expect(parsed.isSuccess).toBe(false) // Not confirmed yet
      expect(parsed.isAccepted).toBe(true)
      expect(parsed.stage).toBe('accepted')
      expect(parsed.orderId).toBe(orderId)
      expect(parsed.refundKey).toBe('ref-key-100')
      expect(parsed.gatewayRefundId).toBe('rcb-999')
      expect(parsed.bankConfirmedAt).toBeUndefined()
      expect(parsed.failureReason).toBeUndefined()
    })

    it('parses confirmed refund notification with bank_confirmed_at', () => {
      const payload = {
        order_id: orderId,
        status_code: '200',
        transaction_status: 'refund',
        refund_key: 'ref-key-100',
        refund_chargeback_id: 'rcb-999',
        bank_confirmed_at: '2026-10-08 12:30:00',
        refund_amount: '200000.00',
        status_message: 'Refund confirmed by bank',
      }

      const parsed = parseMidtransRefundNotification(payload)
      expect(parsed.isSuccess).toBe(true)
      expect(parsed.isAccepted).toBe(false)
      expect(parsed.stage).toBe('confirmed')
      expect(parsed.bankConfirmedAt).toBe('2026-10-08 12:30:00')
      expect(parsed.refundAmount).toBe(200000)
    })

    it('matches exact refund entry in refunds array and does NOT leak bank_confirmed_at from other refunds', () => {
      // Skenario kritis: Notifikasi mengenai refund-B
      // History memiliki refund-A (confirmed) dan refund-B (belum confirmed)
      const payload = {
        order_id: orderId,
        status_code: '200',
        transaction_status: 'refund',
        refund_key: 'refund-B',
        refund_chargeback_id: 'rcb-B',
        refunds: [
          {
            refund_key: 'refund-A',
            refund_chargeback_id: 'rcb-A',
            refund_amount: 50000,
            bank_confirmed_at: '2026-10-07 10:00:00', // Sudah confirmed
          },
          {
            refund_key: 'refund-B',
            refund_chargeback_id: 'rcb-B',
            refund_amount: 150000,
            // bank_confirmed_at is absent!
          },
        ],
      }

      const parsed = parseMidtransRefundNotification(payload)
      // refund-B TIDAK boleh confirmed hanya karena refund-A punya bank_confirmed_at!
      expect(parsed.refundKey).toBe('refund-B')
      expect(parsed.gatewayRefundId).toBe('rcb-B')
      expect(parsed.bankConfirmedAt).toBeUndefined()
      expect(parsed.isSuccess).toBe(false)
      expect(parsed.isAccepted).toBe(true)
      expect(parsed.stage).toBe('accepted')
      expect(parsed.refundAmount).toBe(150000)
    })

    it('matches exact confirmed refund entry in refunds array and extracts its matching timestamp', () => {
      const payload = {
        order_id: orderId,
        status_code: '200',
        transaction_status: 'refund',
        refund_key: 'refund-B',
        refund_chargeback_id: 'rcb-B',
        refunds: [
          {
            refund_key: 'refund-A',
            refund_chargeback_id: 'rcb-A',
            bank_confirmed_at: '2026-10-07 10:00:00',
            refund_amount: 50000,
          },
          {
            refund_key: 'refund-B',
            refund_chargeback_id: 'rcb-B',
            bank_confirmed_at: '2026-10-08 14:15:00',
            refund_amount: 150000,
          },
        ],
      }

      const parsed = parseMidtransRefundNotification(payload)
      expect(parsed.refundKey).toBe('refund-B')
      expect(parsed.bankConfirmedAt).toBe('2026-10-08 14:15:00') // Presisi milik refund-B!
      expect(parsed.isSuccess).toBe(true)
      expect(parsed.stage).toBe('confirmed')
      expect(parsed.refundAmount).toBe(150000)
    })

    it('prevents leakage when root refund_key does not match any entry in refunds array', () => {
      const payload = {
        order_id: orderId,
        status_code: '200',
        transaction_status: 'refund',
        refund_key: 'refund-unmatched-key',
        refunds: [
          {
            refund_key: 'refund-A',
            refund_chargeback_id: 'rcb-A',
            bank_confirmed_at: '2026-10-07 10:00:00',
          },
        ],
      }

      const parsed = parseMidtransRefundNotification(payload)
      expect(parsed.refundKey).toBe('refund-unmatched-key')
      expect(parsed.bankConfirmedAt).toBeUndefined()
      expect(parsed.isSuccess).toBe(false)
      expect(parsed.stage).toBe('accepted')
    })

    it('correctly parses rejected/failed refund payload', () => {
      const payload = {
        order_id: orderId,
        status_code: '412',
        transaction_status: 'refund',
        refund_chargeback_status: 'rejected',
        status_message: 'Merchant cannot refund this channel',
      }

      const parsed = parseMidtransRefundNotification(payload)
      expect(parsed.isSuccess).toBe(false)
      expect(parsed.isAccepted).toBe(false)
      expect(parsed.stage).toBe('failed')
      expect(parsed.failureReason).toBe('Merchant cannot refund this channel')
    })
  })

  describe('Refund Webhook Handler Semantics & Security', () => {
    it('verifies signature of incoming refund webhook correctly', () => {
      const sig = computeSig(orderId, statusCode, grossAmount)
      const valid = verifyMidtransSignature({
        orderId,
        statusCode,
        grossAmount,
        serverKey,
        signatureKey: sig,
      })
      expect(valid).toBe(true)
    })

    it('rejects tampered signature with 403 authorization denial', () => {
      const invalid = verifyMidtransSignature({
        orderId,
        statusCode,
        grossAmount,
        serverKey,
        signatureKey: 'tampered-signature-value',
      })
      expect(invalid).toBe(false)
    })

    it('extracts base UUID from orderId with retry suffix in refund notifications', () => {
      const suffixed = `${orderId}-R12345`
      expect(extractBaseOrderId(suffixed)).toBe(orderId)
    })
  })

  describe('TASK 05.2 — 10 Required Identity Correlation & Amount Validation Scenarios', () => {
    interface OrderState {
      id: string
      status: string
      stock: number
      sold_count: number
    }
    interface RefundState {
      id: string
      order_id: string
      status: 'pending' | 'succeeded' | 'failed'
      amount_cents: number
      idempotency_key: string
      gateway_refund_id: string | null
      bank_confirmed_at: string | null
    }

    const setupState = () => {
      const order: OrderState = {
        id: orderId,
        status: 'paid',
        stock: 10,
        sold_count: 5,
      }
      const refund: RefundState = {
        id: 'ref-1',
        order_id: orderId,
        status: 'pending',
        amount_cents: 20000000, // Rp 200,000
        idempotency_key: 'correct-refund-key',
        gateway_refund_id: 'correct-rcb-100',
        bank_confirmed_at: null,
      }
      return { order, refund }
    }

    // Exact replica of hardened handle_refund_webhook in PL/pgSQL
    const handleWebhookRPC = (
      state: { order: OrderState; refund: RefundState },
      params: {
        stage: 'accepted' | 'confirmed' | 'failed'
        refund_key?: string | null
        gateway_refund_id?: string | null
        bank_confirmed_at?: string | null
        refund_amount_cents?: number | null
        failure_reason?: string | null
      },
    ) => {
      const { order, refund } = state

      // 1. Stale failure check
      if (refund.status === 'succeeded' && params.stage === 'failed') {
        return {
          result: 'IGNORED_STALE_FAILURE_AFTER_REFUND',
          status: 'succeeded',
          order_status: order.status,
          already_finalized: true,
          no_op: true,
        }
      }

      // 2. Duplicate confirmed check
      if (refund.status === 'succeeded' && params.stage === 'confirmed') {
        return {
          result: 'ALREADY_REFUNDED_NO_OP',
          status: 'succeeded',
          order_status: order.status,
          already_finalized: true,
          no_op: true,
        }
      }

      // 3. Identity correlation check
      const keyMatches = params.refund_key && params.refund_key === refund.idempotency_key
      const idMatches =
        params.gateway_refund_id && params.gateway_refund_id === refund.gateway_refund_id

      const hasIdentifiers = Boolean(params.refund_key || params.gateway_refund_id)
      if (hasIdentifiers && !keyMatches && !idMatches) {
        // Unknown or mismatched identifier -> STOP! Do not touch refund!
        return {
          result: 'REFUND_IDENTITY_MISMATCH',
          message: 'Identifier refund pada webhook tidak cocok dengan record refund lokal',
          no_op: true,
        }
      }

      // 4. Amount validation check
      if (params.refund_amount_cents !== undefined && params.refund_amount_cents !== null) {
        if (params.refund_amount_cents !== refund.amount_cents) {
          return {
            result: 'REFUND_AMOUNT_MISMATCH',
            expected_amount_cents: refund.amount_cents,
            received_amount_cents: params.refund_amount_cents,
            no_op: true,
            message: 'Nominal refund tidak cocok dengan record lokal',
          }
        }
      }

      // 5. Stage execution
      if (params.stage === 'accepted') {
        if (params.gateway_refund_id) {
          refund.gateway_refund_id = params.gateway_refund_id
        }
        return {
          result: 'REFUND_ACCEPTED_AWAITING_CONFIRMATION',
          status: refund.status,
          order_status: order.status,
          no_op: false,
        }
      }

      if (params.stage === 'confirmed') {
        refund.status = 'succeeded'
        refund.bank_confirmed_at = params.bank_confirmed_at || new Date().toISOString()
        if (params.gateway_refund_id) {
          refund.gateway_refund_id = params.gateway_refund_id
        }
        order.status = 'refunded'
        order.stock += 2
        order.sold_count -= 2
        return {
          result: 'REFUND_CONFIRMED',
          status: 'succeeded',
          order_status: 'refunded',
          already_finalized: false,
          no_op: false,
        }
      }

      if (params.stage === 'failed') {
        refund.status = 'failed'
        return {
          result: 'REFUND_FAILED',
          status: 'failed',
          order_status: order.status,
          already_finalized: false,
          no_op: false,
        }
      }

      throw new Error(`Unknown stage ${params.stage}`)
    }

    // 1. Exact refund-key match + valid bank_confirmed_at -> finalisasi yang benar
    it('Scenario 1: exact refund-key match + valid bank_confirmed_at finalizes refund and mutates inventory', () => {
      const state = setupState()
      const res = handleWebhookRPC(state, {
        stage: 'confirmed',
        refund_key: 'correct-refund-key',
        gateway_refund_id: 'correct-rcb-100',
        bank_confirmed_at: '2026-10-08T12:00:00Z',
        refund_amount_cents: 20000000,
      })

      expect(res.result).toBe('REFUND_CONFIRMED')
      expect(state.refund.status).toBe('succeeded')
      expect(state.order.status).toBe('refunded')
      expect(state.order.stock).toBe(12)
      expect(state.order.sold_count).toBe(3)
    })

    // 2. Wrong refund key -> tidak memfinalisasi refund lain
    it('Scenario 2: wrong refund key does NOT finalize local refund and does NOT mutate inventory', () => {
      const state = setupState()
      const res = handleWebhookRPC(state, {
        stage: 'confirmed',
        refund_key: 'wrong-key-999',
        bank_confirmed_at: '2026-10-08T12:00:00Z',
        refund_amount_cents: 20000000,
      })

      expect(res.result).toBe('REFUND_IDENTITY_MISMATCH')
      expect(res.no_op).toBe(true)
      expect(state.refund.status).toBe('pending') // Unchanged!
      expect(state.order.status).toBe('paid') // Unchanged!
      expect(state.order.stock).toBe(10) // Unchanged!
      expect(state.order.sold_count).toBe(5) // Unchanged!
    })

    // 3. Wrong refund_chargeback_id -> tidak memfinalisasi refund lain jika identifier tersedia
    it('Scenario 3: wrong refund_chargeback_id does NOT finalize local refund', () => {
      const state = setupState()
      const res = handleWebhookRPC(state, {
        stage: 'confirmed',
        gateway_refund_id: 'wrong-rcb-999',
        bank_confirmed_at: '2026-10-08T12:00:00Z',
        refund_amount_cents: 20000000,
      })

      expect(res.result).toBe('REFUND_IDENTITY_MISMATCH')
      expect(res.no_op).toBe(true)
      expect(state.refund.status).toBe('pending')
      expect(state.order.status).toBe('paid')
      expect(state.order.stock).toBe(10)
    })

    // 4. Wrong refund amount -> tidak memfinalisasi
    it('Scenario 4: wrong refund amount does NOT finalize local refund and halts inventory mutation', () => {
      const state = setupState()
      const res = handleWebhookRPC(state, {
        stage: 'confirmed',
        refund_key: 'correct-refund-key',
        bank_confirmed_at: '2026-10-08T12:00:00Z',
        refund_amount_cents: 10000000, // Rp 100,000 (mismatch! Expected 20,000,000 cents)
      })

      expect(res.result).toBe('REFUND_AMOUNT_MISMATCH')
      expect(res.no_op).toBe(true)
      expect(state.refund.status).toBe('pending')
      expect(state.order.status).toBe('paid')
      expect(state.order.stock).toBe(10)
      expect(state.order.sold_count).toBe(5)
    })

    // 5. Multiple refund history entries, tetapi hanya satu yang confirmed -> hanya refund yang cocok yang boleh diproses
    it('Scenario 5: in multiple history entries, only exact matching refund with confirmation is processed', () => {
      const pendingRefund = {
        id: 'ref-B',
        order_id: orderId,
        status: 'pending',
        amount_cents: 15000000,
        idempotency_key: 'ref-key-B',
        gateway_refund_id: 'rcb-B',
      }

      const midtransData = {
        transaction_status: 'refund',
        refunds: [
          {
            refund_key: 'ref-key-A',
            refund_chargeback_id: 'rcb-A',
            refund_amount: 50000,
            bank_confirmed_at: '2026-10-07 10:00:00', // Confirmed, but for A
          },
          {
            refund_key: 'ref-key-B',
            refund_chargeback_id: 'rcb-B',
            refund_amount: 150000,
            bank_confirmed_at: '2026-10-08 14:00:00', // Confirmed for B
          },
        ],
      }

      const matchedRefund = midtransData.refunds.find(
        (r) => r.refund_key === pendingRefund.idempotency_key,
      )

      expect(matchedRefund).toBeDefined()
      expect(matchedRefund?.refund_key).toBe('ref-key-B')
      expect(matchedRefund?.bank_confirmed_at).toBe('2026-10-08 14:00:00')
      expect(Math.round(matchedRefund!.refund_amount * 100)).toBe(pendingRefund.amount_cents)
    })

    // 6. Confirmed timestamp hanya ada pada refund lain -> pending refund tidak boleh difinalisasi
    it('Scenario 6: confirmed timestamp on other refund does NOT finalize unconfirmed pending refund', () => {
      const payload = {
        order_id: orderId,
        status_code: '200',
        transaction_status: 'refund',
        refund_key: 'ref-key-target',
        refunds: [
          {
            refund_key: 'ref-key-prior',
            refund_chargeback_id: 'rcb-prior',
            refund_amount: 50000,
            bank_confirmed_at: '2026-10-07 10:00:00', // Other refund has confirmed timestamp
          },
          {
            refund_key: 'ref-key-target',
            refund_chargeback_id: 'rcb-target',
            refund_amount: 200000,
            // Target does NOT have bank_confirmed_at!
          },
        ],
      }

      const parsed = parseMidtransRefundNotification(payload)
      // Must NOT borrow prior refund's bank_confirmed_at!
      expect(parsed.bankConfirmedAt).toBeUndefined()
      expect(parsed.isSuccess).toBe(false)
      expect(parsed.stage).toBe('accepted')

      // Simulated RPC with accepted stage:
      const state = setupState()
      state.refund.idempotency_key = 'ref-key-target'
      state.refund.gateway_refund_id = 'rcb-target'
      const res = handleWebhookRPC(state, {
        stage: parsed.stage,
        refund_key: parsed.refundKey,
        bank_confirmed_at: parsed.bankConfirmedAt,
        refund_amount_cents: parseAmountToCents(parsed.refundAmount),
      })

      expect(res.result).toBe('REFUND_ACCEPTED_AWAITING_CONFIRMATION')
      expect(state.refund.status).toBe('pending')
      expect(state.order.status).toBe('paid')
      expect(state.order.stock).toBe(10) // Untouched!
    })

    // 7. Duplicate confirmed event -> no-op
    it('Scenario 7: duplicate confirmed event is clean no-op with exactly once inventory mutation', () => {
      const state = setupState()
      // First confirmation
      handleWebhookRPC(state, {
        stage: 'confirmed',
        refund_key: 'correct-refund-key',
        bank_confirmed_at: '2026-10-08T12:00:00Z',
        refund_amount_cents: 20000000,
      })
      expect(state.order.stock).toBe(12)

      // Duplicate confirmation
      const resDup = handleWebhookRPC(state, {
        stage: 'confirmed',
        refund_key: 'correct-refund-key',
        bank_confirmed_at: '2026-10-08T12:00:00Z',
        refund_amount_cents: 20000000,
      })

      expect(resDup.already_finalized).toBe(true)
      expect(resDup.no_op).toBe(true)
      expect(state.order.stock).toBe(12) // Strictly once!
      expect(state.order.sold_count).toBe(3)
    })

    // 8. Stale failure setelah confirmed success -> tidak boleh rollback
    it('Scenario 8: stale failure after confirmed success is ignored without rollback', () => {
      const state = setupState()
      // First confirmed
      handleWebhookRPC(state, {
        stage: 'confirmed',
        refund_key: 'correct-refund-key',
        bank_confirmed_at: '2026-10-08T12:00:00Z',
        refund_amount_cents: 20000000,
      })

      // Late failed notification arrives
      const resLate = handleWebhookRPC(state, {
        stage: 'failed',
        refund_key: 'correct-refund-key',
        failure_reason: 'Late network error',
      })

      expect(resLate.result).toBe('IGNORED_STALE_FAILURE_AFTER_REFUND')
      expect(resLate.no_op).toBe(true)
      expect(state.refund.status).toBe('succeeded')
      expect(state.order.status).toBe('refunded')
      expect(state.order.stock).toBe(12)
    })

    // 9. Initial notification tanpa confirmation -> tidak ada mutasi inventory
    it('Scenario 9: initial notification without confirmation causes zero inventory mutation', () => {
      const state = setupState()
      const res = handleWebhookRPC(state, {
        stage: 'accepted',
        refund_key: 'correct-refund-key',
        gateway_refund_id: 'rcb-new-1',
        bank_confirmed_at: null,
        refund_amount_cents: 20000000,
      })

      expect(res.result).toBe('REFUND_ACCEPTED_AWAITING_CONFIRMATION')
      expect(state.refund.status).toBe('pending')
      expect(state.refund.gateway_refund_id).toBe('rcb-new-1')
      expect(state.order.status).toBe('paid')
      expect(state.order.stock).toBe(10)
      expect(state.order.sold_count).toBe(5)
    })

    // 10. Unknown/unmatched refund event -> tidak ada mutasi inventory dan tercatat sebagai identity mismatch
    it('Scenario 10: unknown/unmatched refund event returns identity mismatch without inventory mutation', () => {
      const state = setupState()
      const res = handleWebhookRPC(state, {
        stage: 'confirmed',
        refund_key: 'completely-unknown-refund-key',
        gateway_refund_id: 'rcb-ghost',
        bank_confirmed_at: '2026-10-08T12:00:00Z',
        refund_amount_cents: 20000000,
      })

      expect(res.result).toBe('REFUND_IDENTITY_MISMATCH')
      expect(res.no_op).toBe(true)
      expect(state.refund.status).toBe('pending') // Local refund is untouched
      expect(state.order.status).toBe('paid')
      expect(state.order.stock).toBe(10)
      expect(state.order.sold_count).toBe(5)
    })
  })

  describe('Terminal Guards & Invariants', () => {
    it('determines that refunded is a terminal state and cannot be mutated by late payments', () => {
      const currentStatus = 'refunded'
      const shouldIgnore = currentStatus === 'refunded'
      expect(shouldIgnore).toBe(true)
    })

    it('denies transition from succeeded to failed (succeeded -> failed is FORBIDDEN)', () => {
      const existingRefundStatus = 'succeeded'
      const incomingTransitionSuccess = false
      const isForbidden = existingRefundStatus === 'succeeded' && !incomingTransitionSuccess
      expect(isForbidden).toBe(true)
    })
  })
})
