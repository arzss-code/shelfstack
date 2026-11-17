import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import { logger } from './logger'

export type PrivateBucketName = 'chat-attachments' | 'return-proofs'

const SAFE_OWNER_RE = /^[A-Za-z0-9_-]+$/
const SAFE_FILENAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

function hasStorageApi(client: SupabaseClient<Database>): boolean {
  return Boolean(client?.storage && typeof client.storage.from === 'function')
}

function getBucketPrefixes(bucketName: PrivateBucketName, publicBucketUrl: string): string[] {
  const bucket = new URL(publicBucketUrl)
  const basePrefix = bucket.pathname.endsWith('/') ? bucket.pathname : `${bucket.pathname}/`
  return [
    basePrefix,
    `/storage/v1/object/public/${bucketName}/`,
    `/storage/v1/object/sign/${bucketName}/`,
    `/storage/v1/object/authenticated/${bucketName}/`,
  ]
}

export function extractStorageBucketPath(
  rawUrl: string,
  bucketName: PrivateBucketName,
  publicBucketUrl: string,
  requiredOwnerId?: string | null,
): string | null {
  if (!rawUrl || /[\s\\]/.test(rawUrl) || /%2e|%2f|%5c|\.\./i.test(rawUrl)) {
    return null
  }

  try {
    const url = new URL(rawUrl)
    const bucket = new URL(publicBucketUrl)
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.origin !== bucket.origin ||
      url.username ||
      url.password ||
      url.hash ||
      /[%?#]/.test(url.pathname)
    ) {
      return null
    }

    const prefixes = getBucketPrefixes(bucketName, publicBucketUrl)
    const matchedPrefix = prefixes.find((prefix) => url.pathname.startsWith(prefix))
    if (!matchedPrefix) return null

    const relativePath = url.pathname.slice(matchedPrefix.length)
    const segments = relativePath.split('/')
    if (segments.length !== 2) return null

    const [owner, filename] = segments
    if (!owner || !filename || filename.includes('..')) return null
    if (!SAFE_OWNER_RE.test(owner) || !SAFE_FILENAME_RE.test(filename)) return null
    if (requiredOwnerId && owner !== requiredOwnerId) return null

    return `${owner}/${filename}`
  } catch {
    return null
  }
}

export async function createAuthorizedSignedUrl(
  client: SupabaseClient<Database>,
  bucketName: PrivateBucketName,
  filePath: string,
  fallbackUrl: string,
  expiresIn = 3600,
): Promise<string> {
  if (!hasStorageApi(client)) return fallbackUrl

  try {
    const bucket = client.storage.from(bucketName)
    if (typeof bucket.createSignedUrl === 'function') {
      const { data, error } = await bucket.createSignedUrl(filePath, expiresIn)
      if (!error && data?.signedUrl) {
        return data.signedUrl
      }
    }
  } catch (err: unknown) {
    logger.warn('Failed to create signed storage URL', {
      bucket: bucketName,
      error: err instanceof Error ? err.message : 'unknown',
    })
  }

  return fallbackUrl
}

export async function validateOwnedBucketAttachmentUrl(
  client: SupabaseClient<Database>,
  bucketName: PrivateBucketName,
  rawUrl: string,
  requiredOwnerId?: string | null,
): Promise<string | null> {
  if (!hasStorageApi(client)) {
    try {
      const parsed = new URL(rawUrl)
      return ['https:', 'http:'].includes(parsed.protocol) ? rawUrl : null
    } catch {
      return null
    }
  }

  try {
    const { data } = client.storage.from(bucketName).getPublicUrl('')
    return extractStorageBucketPath(rawUrl, bucketName, data.publicUrl, requiredOwnerId)
  } catch {
    return null
  }
}

export async function rehydratePrivateStorageUrl(
  client: SupabaseClient<Database>,
  bucketName: PrivateBucketName,
  storedUrl: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!storedUrl) return null
  if (!hasStorageApi(client)) return storedUrl

  try {
    const { data } = client.storage.from(bucketName).getPublicUrl('')
    const path = extractStorageBucketPath(storedUrl, bucketName, data.publicUrl, null)
    if (!path) return null
    return await createAuthorizedSignedUrl(client, bucketName, path, storedUrl, expiresIn)
  } catch {
    return null
  }
}
