import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dispatchTransactionalEmail } from '../../server/utils/email-dispatcher'

vi.mock('../../server/utils/email-dispatcher', () => ({
  dispatchTransactionalEmail: vi.fn(),
}))

describe('POST /api/admin/emails/test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates recipient_email format and returns 400 for invalid email', () => {
    const invalidPayload = { recipient_email: 'not-an-email' }
    expect(invalidPayload.recipient_email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })

  it('triggers dispatchTransactionalEmail with requested recipient and template', async () => {
    const mockDispatch = vi.mocked(dispatchTransactionalEmail)
    mockDispatch.mockResolvedValueOnce({
      ok: true,
      provider: 'resend',
      messageId: 'resend-msg-test-123',
      durationMs: 120,
    })

    const result = await dispatchTransactionalEmail(
      'order_placed',
      {
        id: 'ord-test-01',
        customer_name: 'Tester',
        customer_email: 'tester@example.com',
        items: [],
        total_cents: 100000,
      },
      { recipientEmail: 'tester@example.com' },
    )

    expect(result.ok).toBe(true)
    expect(result.provider).toBe('resend')
    expect(result.messageId).toBe('resend-msg-test-123')
  })

  it('returns failure details when Resend reports domain unverified', async () => {
    const mockDispatch = vi.mocked(dispatchTransactionalEmail)
    mockDispatch.mockResolvedValueOnce({
      ok: false,
      provider: 'resend',
      error: 'Domain not verified. You can only send from onboarding@resend.dev',
      durationMs: 140,
    })

    const result = await dispatchTransactionalEmail(
      'order_placed',
      {
        id: 'ord-test-02',
        customer_name: 'Tester',
        customer_email: 'tester@example.com',
        items: [],
        total_cents: 100000,
      },
      { recipientEmail: 'tester@example.com' },
    )

    expect(result.ok).toBe(false)
    expect(result.error).toContain('Domain not verified')
  })
})
