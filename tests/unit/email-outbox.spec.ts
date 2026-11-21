import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../app/types/database.types'
import {
  enqueueEmailOutbox,
  markEmailOutboxSent,
  markEmailOutboxFailed,
  retryEmailOutboxItem,
} from '../../server/utils/email-outbox'

describe('Email Outbox Queue Suite (Keandalan Notifikasi Email)', () => {
  it('enqueueEmailOutbox returns fallback id gracefully when client is null', async () => {
    const res = await enqueueEmailOutbox(null, {
      recipient: 'user@example.com',
      subject: 'Pesanan Dikonfirmasi',
      template: 'order_created',
      payload: { orderId: 'ord-123' },
    })

    expect(res.ok).toBe(true)
    expect(res.fallback).toBe(true)
    expect(res.id).toBeTruthy()
  })

  it('enqueueEmailOutbox handles unmigrated table 42P01 error without throwing', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '42P01', message: 'relation email_outbox does not exist' },
            }),
          }),
        }),
      }),
    }

    const res = await enqueueEmailOutbox(mockClient as unknown as SupabaseClient<Database>, {
      recipient: 'user@example.com',
      subject: 'Pesanan Dikonfirmasi',
      template: 'order_created',
    })

    expect(res.ok).toBe(true)
    expect(res.fallback).toBe(true)
  })

  it('markEmailOutboxSent and markEmailOutboxFailed update status and timestamp', async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    const mockClient = {
      from: vi.fn().mockReturnValue({
        update: updateSpy,
      }),
    }

    await markEmailOutboxSent(mockClient as unknown as SupabaseClient<Database>, 'outbox-id-1')
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
      }),
    )

    await markEmailOutboxFailed(
      mockClient as unknown as SupabaseClient<Database>,
      'outbox-id-2',
      'Connection timeout',
    )
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        last_error: 'Connection timeout',
      }),
    )
  })

  it('retryEmailOutboxItem handles not found or already sent items cleanly', async () => {
    const mockClientNotFound = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    }

    const resNotFound = await retryEmailOutboxItem(
      mockClientNotFound as unknown as SupabaseClient<Database>,
      'missing-id',
    )
    expect(resNotFound.ok).toBe(false)
    expect(resNotFound.message).toContain('tidak ditemukan')

    const mockClientSent = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'sent-id', status: 'sent' },
              error: null,
            }),
          }),
        }),
      }),
    }

    const resSent = await retryEmailOutboxItem(
      mockClientSent as unknown as SupabaseClient<Database>,
      'sent-id',
    )
    expect(resSent.ok).toBe(true)
    expect(resSent.message).toContain('sudah terkirim sebelumnya')
  })

  it('retryEmailOutboxItem retries failed item and marks it sent with mock provider', async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'failed-id',
                status: 'failed',
                recipient: 'test@example.com',
                subject: 'Pembayaran Dikonfirmasi',
                attempts: 1,
              },
              error: null,
            }),
          }),
        }),
        update: updateSpy,
      }),
    }

    const res = await retryEmailOutboxItem(
      mockClient as unknown as SupabaseClient<Database>,
      'failed-id',
    )
    expect(res.ok).toBe(true)
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
        attempts: 2,
      }),
    )
  })
})
