import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, defineEventHandler, H3Error, type H3Event } from 'h3'
import { calculateShippingFee } from '../../shared/schemas/shipping'
import { resolveClientIpFromHeaders } from '../../server/utils/rate-limit'
import {
  extractStorageBucketPath,
  rehydratePrivateStorageUrl,
} from '../../server/utils/private-storage'
import {
  customerId,
  foreignId,
  orderId,
  otherOrderId,
  ownOrder,
  database,
} from './fixtures/support-order'

const edges = vi.hoisted(() => ({
  auth: vi.fn(),
  adminAuth: vi.fn(),
  serviceRole: vi.fn(),
  readBody: vi.fn(),
  readMultipart: vi.fn(),
  routerParam: vi.fn(),
}))

vi.mock('../../server/utils/auth', () => ({
  requireUser: edges.auth,
  requireAdmin: edges.adminAuth,
}))

let postMsg: typeof import('../../server/api/support/messages.post').default
let getThread: typeof import('../../server/api/support/thread.get').default
let uploadSupport: typeof import('../../server/api/support/upload.post').default
let reviewReturn: typeof import('../../server/api/admin/returns/[id]/review.put').default

const evt = { context: { requestId: 'audit-privacy-tx-test' } } as unknown as H3Event
const publicBucketUrl = 'https://demo.supabase.co/storage/v1/object/public/chat-attachments/'

function attachStorageMock(db: ReturnType<typeof database>, bucket: 'chat-attachments') {
  const storage = {
    from: vi.fn(() => ({
      getPublicUrl: vi.fn((path: string) => ({
        data: { publicUrl: `${publicBucketUrl}${path}` },
      })),
      upload: vi.fn(async () => ({ error: null })),
      createSignedUrl: vi.fn(async (path: string) => ({
        data: {
          signedUrl: `https://demo.supabase.co/storage/v1/object/sign/${bucket}/${path}?token=sig`,
        },
        error: null,
      })),
    })),
  }
  return Object.assign(db, { storage })
}

describe('Audit Remediation: Storage Privacy, Rate-Limit Proxy, & Transactional Parity', () => {
  beforeAll(async () => {
    vi.doMock('#supabase/server', () => ({ serverSupabaseServiceRole: edges.serviceRole }))
    vi.stubGlobal('defineEventHandler', defineEventHandler)
    vi.stubGlobal('createError', createError)
    vi.stubGlobal('readBody', edges.readBody)
    vi.stubGlobal('readMultipartFormData', edges.readMultipart)
    vi.doMock('h3', async () => {
      const actual = await vi.importActual<typeof import('h3')>('h3')
      return { ...actual, getRouterParam: edges.routerParam, readBody: edges.readBody }
    })
    postMsg = (await import('../../server/api/support/messages.post')).default
    getThread = (await import('../../server/api/support/thread.get')).default
    uploadSupport = (await import('../../server/api/support/upload.post')).default
    reviewReturn = (await import('../../server/api/admin/returns/[id]/review.put')).default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    edges.auth.mockResolvedValue({
      user: { id: customerId },
      profile: { user_id: customerId, role: 'customer' },
    })
    edges.adminAuth.mockResolvedValue({
      user: { id: 'admin-1' },
      profile: { user_id: 'admin-1', role: 'admin' },
    })
  })

  afterAll(() => {
    vi.doUnmock('#supabase/server')
    vi.doUnmock('h3')
    vi.unstubAllGlobals()
  })

  describe('1. Private Storage Validation & Support Attachment Flow', () => {
    it('extracts owned bucket path from signed/public URLs and blocks traversal/foreign/external URLs', () => {
      expect(
        extractStorageBucketPath(
          `${publicBucketUrl}${customerId}/proof.png`,
          'chat-attachments',
          publicBucketUrl,
          customerId,
        ),
      ).toBe(`${customerId}/proof.png`)
      expect(
        extractStorageBucketPath(
          `https://demo.supabase.co/storage/v1/object/sign/chat-attachments/${customerId}/proof.png?token=abc`,
          'chat-attachments',
          publicBucketUrl,
          customerId,
        ),
      ).toBe(`${customerId}/proof.png`)
      expect(
        extractStorageBucketPath(
          `${publicBucketUrl}${foreignId}/proof.png`,
          'chat-attachments',
          publicBucketUrl,
          customerId,
        ),
      ).toBeNull()
      expect(
        extractStorageBucketPath(
          'javascript:alert(1)',
          'chat-attachments',
          publicBucketUrl,
          customerId,
        ),
      ).toBeNull()
      expect(
        extractStorageBucketPath(
          `${publicBucketUrl}${customerId}/../${foreignId}/x.png`,
          'chat-attachments',
          publicBucketUrl,
          customerId,
        ),
      ).toBeNull()
    })

    it('issues signed URL on support upload and rehydrates signed URL on thread GET', async () => {
      const db = attachStorageMock(database(), 'chat-attachments')
      edges.serviceRole.mockReturnValue(db)
      edges.readMultipart.mockResolvedValue([
        {
          name: 'file',
          filename: 'bukti.png',
          type: 'image/png',
          data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]),
        },
      ])

      const uploadRes = (await uploadSupport(evt)) as { data: { file_url: string } }
      expect(uploadRes.data.file_url).toContain('/storage/v1/object/sign/chat-attachments/')
      expect(uploadRes.data.file_url).toContain('?token=sig')

      const signed = await rehydratePrivateStorageUrl(
        db as unknown as Parameters<typeof rehydratePrivateStorageUrl>[0],
        'chat-attachments',
        `${publicBucketUrl}${customerId}/old.png`,
      )
      expect(signed).toBe(
        `https://demo.supabase.co/storage/v1/object/sign/chat-attachments/${customerId}/old.png?token=sig`,
      )
    })

    it('rejects foreign chat attachment URL with 400 and updates A-to-B thread order attachment', async () => {
      const db = attachStorageMock(database(), 'chat-attachments')
      db.rows.orders.push({ ...ownOrder, id: otherOrderId, total_cents: 299000 })
      edges.serviceRole.mockReturnValue(db)

      edges.readBody.mockResolvedValueOnce({
        message_text: 'Coba akses file asing',
        attachment_url: `${publicBucketUrl}${foreignId}/secret.png`,
      })
      const rejected = await postMsg(evt).then(
        () => null,
        (err: unknown) => err,
      )
      expect(rejected).toBeInstanceOf(H3Error)
      expect((rejected as H3Error).statusCode).toBe(400)

      edges.readBody.mockResolvedValueOnce({
        message_text: 'Lampiran Order A',
        attached_order_id: orderId,
      })
      await postMsg(evt)
      edges.readBody.mockResolvedValueOnce({
        message_text: 'Lampiran Order B',
        attached_order_id: otherOrderId,
      })
      await postMsg(evt)

      expect(db.rows.support_threads[0]?.attached_order_id).toBe(otherOrderId)
      const threadRes = (await getThread(evt)) as {
        data: { messages: Array<{ attached_order?: { id: string } }> }
      }
      expect(threadRes.data.messages.some((m) => m.attached_order?.id === otherOrderId)).toBe(true)
    })
  })

  describe('2. Trusted Proxy Anti-Spoofing for Rate Limiting', () => {
    it('ignores spoofed X-Forwarded-For from untrusted internet peers and uses rightmost hop behind trusted proxy', () => {
      expect(
        resolveClientIpFromHeaders({
          remoteAddress: '198.51.100.22',
          xForwardedFor: '1.2.3.4, 5.6.7.8',
          xRealIp: '9.9.9.9',
          trustProxyEnv: false,
        }),
      ).toBe('198.51.100.22')

      expect(
        resolveClientIpFromHeaders({
          remoteAddress: '172.18.0.3',
          xForwardedFor: '1.1.1.1, 203.0.113.99',
          trustProxyEnv: false,
        }),
      ).toBe('203.0.113.99')

      expect(
        resolveClientIpFromHeaders({
          remoteAddress: '::ffff:127.0.0.1',
          xRealIp: '203.0.113.45',
          xForwardedFor: '10.0.0.5, 203.0.113.45',
        }),
      ).toBe('203.0.113.45')
    })
  })

  describe('3. Atomic Return Review RPC Handler & Corrective Migration Invariants', () => {
    it('invokes admin_review_return_request RPC and maps RETURN_NOT_FOUND to 404', async () => {
      edges.routerParam.mockReturnValue('ret-uuid-1')
      edges.readBody.mockResolvedValue({ status: 'completed', restock_inventory: true })

      const rpc = vi.fn().mockResolvedValueOnce({
        data: {
          id: 'ret-uuid-1',
          order_id: orderId,
          user_id: customerId,
          status: 'completed',
          proof_image_urls: [],
        },
        error: null,
      })
      const insert = vi.fn(async () => ({ error: null }))
      edges.serviceRole.mockReturnValue({ rpc, from: vi.fn(() => ({ insert })) })

      const res = (await reviewReturn(evt)) as { status: string; data: { status: string } }
      expect(res.status).toBe('success')
      expect(res.data.status).toBe('completed')
      expect(rpc).toHaveBeenCalledWith('admin_review_return_request', {
        p_return_id: 'ret-uuid-1',
        p_status: 'completed',
        p_admin_notes: null,
        p_replacement_courier: null,
        p_replacement_tracking_number: null,
        p_refund_amount_cents: null,
        p_restock_inventory: true,
      })

      const notFoundRpc = vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'RETURN_NOT_FOUND: Tiket retur tidak ditemukan' },
      })
      edges.serviceRole.mockReturnValue({ rpc: notFoundRpc, from: vi.fn(() => ({ insert })) })
      const notFoundErr = await reviewReturn(evt).then(
        () => null,
        (e: unknown) => e,
      )
      expect(notFoundErr).toBeInstanceOf(H3Error)
      expect((notFoundErr as H3Error).statusCode).toBe(404)
    })

    it('verifies corrective SQL migration 20261202000001 aligns coins, shipping, refund guards, and private buckets', () => {
      const sql = readFileSync(
        resolve(
          process.cwd(),
          'supabase/migrations/20261202000001_audit_remediation_transactions_and_privacy.sql',
        ),
        'utf8',
      )
      expect(sql).toContain('set public = false')
      expect(sql).toContain('trg_guard_support_message_update')
      expect(sql).toContain("'spent'")
      expect(sql).toContain('lifetime_spent_coins')
      expect(sql).toContain('REFUND_PENDING_CONFLICT')
      expect(sql).toContain('INVALID_ORDER_STATE_FOR_REFUND')
      expect(sql).toContain('admin_review_return_request')
      expect(sql).toContain(String(calculateShippingFee('express', 0).feeCents))
      expect(sql).toContain(String(calculateShippingFee('instant', 0).feeCents))
      expect(sql).toContain(String(calculateShippingFee('cargo', 0).feeCents))
      expect(sql).toContain(String(calculateShippingFee('reguler', 0).feeCents))
    })
  })
})
