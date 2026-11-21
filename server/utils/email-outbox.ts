import crypto from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '~/types/database.types'
import { logger } from './logger'
import { resolveEmailConfig, sendViaResend } from './email-dispatcher'

export interface EnqueueEmailOutboxOptions {
  recipient: string
  subject: string
  template: string
  payload?: Record<string, unknown>
}

export interface EmailOutboxResult {
  id: string
  ok: boolean
  fallback?: boolean
}

export async function enqueueEmailOutbox(
  client: SupabaseClient<Database> | null | undefined,
  options: EnqueueEmailOutboxOptions,
): Promise<EmailOutboxResult> {
  const fallbackId = crypto.randomUUID()
  if (!client) {
    return { id: fallbackId, ok: true, fallback: true }
  }

  try {
    const payloadJson = (options.payload || {}) as unknown as Json
    const { data, error } = await client
      .from('email_outbox')
      .insert({
        id: fallbackId,
        recipient: options.recipient,
        subject: options.subject,
        template: options.template,
        payload: payloadJson,
        status: 'pending',
        attempts: 0,
      })
      .select('id')
      .maybeSingle()

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        logger.info('Tabel email_outbox belum dimigrasikan, melewati enqueue DB')
        return { id: fallbackId, ok: true, fallback: true }
      }
      logger.warn('Gagal enqueue email_outbox ke PostgreSQL', { error: error.message })
      return { id: fallbackId, ok: false, fallback: true }
    }

    return { id: data?.id || fallbackId, ok: true }
  } catch (err: unknown) {
    logger.warn('Exception saat enqueue email_outbox', { err: String(err) })
    return { id: fallbackId, ok: false, fallback: true }
  }
}

export async function markEmailOutboxSent(
  client: SupabaseClient<Database> | null | undefined,
  id: string,
): Promise<void> {
  if (!client) return

  try {
    const nowIso = new Date().toISOString()
    await client
      .from('email_outbox')
      .update({
        status: 'sent',
        sent_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', id)
  } catch (err: unknown) {
    logger.warn('Gagal memperbarui status sent pada email_outbox', { err: String(err), id })
  }
}

export async function markEmailOutboxFailed(
  client: SupabaseClient<Database> | null | undefined,
  id: string,
  errorMessage: string,
): Promise<void> {
  if (!client) return

  try {
    const nowIso = new Date().toISOString()
    await client
      .from('email_outbox')
      .update({
        status: 'failed',
        last_error: errorMessage,
        updated_at: nowIso,
      })
      .eq('id', id)
  } catch (err: unknown) {
    logger.warn('Gagal memperbarui status failed pada email_outbox', { err: String(err), id })
  }
}

export async function retryEmailOutboxItem(
  client: SupabaseClient<Database>,
  id: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; message: string }> {
  const { data: item, error } = await client
    .from('email_outbox')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !item) {
    return { ok: false, message: 'Item email outbox tidak ditemukan' }
  }

  if (item.status === 'sent') {
    return { ok: true, message: 'Email sudah terkirim sebelumnya' }
  }

  const { provider, apiKey, fromEmail } = resolveEmailConfig()
  const currentAttempts = (item.attempts || 0) + 1
  const nowIso = new Date().toISOString()

  let sendOk: boolean
  let errorMsg: string | null = null

  if (provider === 'resend' && apiKey) {
    const html = `<p>${item.subject}</p>`
    const res = await sendViaResend(
      item.recipient,
      fromEmail,
      item.subject,
      html,
      apiKey,
      fetchImpl,
    )
    sendOk = res.ok
    errorMsg = res.error || null
  } else {
    // Mock / console delivery in development/test
    sendOk = true
  }

  await client
    .from('email_outbox')
    .update({
      status: sendOk ? 'sent' : 'failed',
      attempts: currentAttempts,
      last_error: errorMsg,
      sent_at: sendOk ? nowIso : null,
      updated_at: nowIso,
    })
    .eq('id', id)

  return {
    ok: sendOk,
    message: sendOk ? 'Email berhasil dikirim ulang' : errorMsg || 'Gagal mengirim ulang email',
  }
}
