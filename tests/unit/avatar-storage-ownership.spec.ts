import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, defineEventHandler, type H3Event } from 'h3'
import { logger } from '../../server/utils/logger'

const edges = vi.hoisted(() => ({ auth: vi.fn(), serviceRole: vi.fn(), multipart: vi.fn() }))
vi.mock('../../server/utils/auth', () => ({ requireUser: edges.auth }))

const userId = '11111111-1111-4111-8111-111111111111'
const foreignId = '22222222-2222-4222-8222-222222222222'
const bucketUrl = 'https://storage.example.com/storage/v1/object/public/avatars/'
const oldPath = `${userId}/old-avatar.png`
const ownUrl = `${bucketUrl}${oldPath}`
const now = 1800000000000
const uploadPath = `${userId}/${now}.png`
const event = { context: { requestId: 'avatar-ownership-test' } } as unknown as H3Event

type Profile = { user_id: string; avatar_url: string | null }

function storageClient() {
  const profiles: Profile[] = [
    { user_id: userId, avatar_url: ownUrl },
    { user_id: foreignId, avatar_url: `${bucketUrl}${foreignId}/private.png` },
  ]
  const updateFailure = { message: 'private database diagnostic' }
  let failUpdate = false
  const from = vi.fn((table: string) => {
    if (table !== 'profiles') throw new Error(`Unexpected table: ${table}`)
    const filters: Array<[string, unknown]> = []
    let update: Partial<Profile> | undefined
    const execute = async () => {
      const matches = profiles.filter((profile) =>
        filters.every(([key, value]) => profile[key as keyof Profile] === value),
      )
      if (update && failUpdate) return { data: null, error: updateFailure }
      if (update) matches.forEach((profile) => Object.assign(profile, update))
      return { data: matches[0] ?? null, error: null }
    }
    const query = {
      select() {
        return query
      },
      eq(key: string, value: unknown) {
        filters.push([key, value])
        return query
      },
      update(value: Partial<Profile>) {
        update = value
        return query
      },
      maybeSingle: execute,
      then<TResult1 = Awaited<ReturnType<typeof execute>>, TResult2 = never>(
        onfulfilled?:
          ((value: Awaited<ReturnType<typeof execute>>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return execute().then(onfulfilled, onrejected)
      },
    }
    return query
  })
  const bucket = {
    upload: vi.fn().mockResolvedValue({ data: { path: uploadPath }, error: null }),
    getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `${bucketUrl}${path}` } })),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
  }
  const storage = {
    from: vi.fn((name: string) => {
      if (name !== 'avatars') throw new Error(`Unexpected bucket: ${name}`)
      return bucket
    }),
  }
  const updateUserById = vi.fn().mockResolvedValue({ data: {}, error: null })
  return {
    profiles,
    from,
    storage,
    bucket,
    auth: { admin: { updateUserById } },
    failUpdate() {
      failUpdate = true
    },
  }
}

let upload: typeof import('../../server/api/account/avatar.post').default
let remove: typeof import('../../server/api/account/avatar.delete').default
let client: ReturnType<typeof storageClient>

beforeAll(async () => {
  vi.doMock('#supabase/server', () => ({ serverSupabaseServiceRole: edges.serviceRole }))
  vi.stubGlobal('defineEventHandler', defineEventHandler)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('readMultipartFormData', edges.multipart)
  upload = (await import('../../server/api/account/avatar.post')).default
  remove = (await import('../../server/api/account/avatar.delete')).default
})
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(Date, 'now').mockReturnValue(now)
  vi.spyOn(logger, 'warn').mockImplementation(() => {})
  client = storageClient()
  edges.serviceRole.mockReturnValue(client)
  edges.auth.mockResolvedValue({ user: { id: userId }, profile: { user_id: foreignId } })
  edges.multipart.mockResolvedValue([
    { name: 'avatar', filename: 'photo.png', type: 'image/png', data: Buffer.from('image') },
  ])
})
afterEach(() => vi.restoreAllMocks())
afterAll(() => {
  vi.doUnmock('#supabase/server')
  vi.unstubAllGlobals()
})

const unsafeUrls: Array<[string, string | null]> = [
  ['foreign folder', `${bucketUrl}${foreignId}/private.png`],
  ['prefix lookalike folder', `${bucketUrl}${userId}-other/private.png`],
  [
    'external storage origin',
    `https://other.example.com/storage/v1/object/public/avatars/${oldPath}`,
  ],
  ['external URL containing avatars', `https://other.example.com/avatars/${oldPath}`],
  ['OAuth avatar', 'https://lh3.googleusercontent.com/photo.png'],
  ['wrong bucket', `https://storage.example.com/storage/v1/object/public/documents/${oldPath}`],
  ['wrong API path', `https://storage.example.com/avatars/${oldPath}`],
  ['relative URL', `/storage/v1/object/public/avatars/${oldPath}`],
  ['malformed URL', `not a URL/avatars/${oldPath}`],
  [
    'credentials',
    `https://user:pass@storage.example.com/storage/v1/object/public/avatars/${oldPath}`,
  ],
  ['query', `${ownUrl}?download=1`],
  ['fragment', `${ownUrl}#preview`],
  ['parent traversal', `${bucketUrl}${userId}/../${foreignId}/private.png`],
  ['normalized traversal into own folder', `${bucketUrl}${foreignId}/../${oldPath}`],
  ['encoded parent traversal', `${bucketUrl}${userId}/%2e%2e/${foreignId}/private.png`],
  ['encoded forward slash', `${bucketUrl}${userId}%2Fprivate.png`],
  ['encoded backslash', `${bucketUrl}${userId}/..%5C${foreignId}%5Cprivate.png`],
  ['double encoded path', `${bucketUrl}${userId}/%252e%252e%252fprivate.png`],
  ['nested file', `${bucketUrl}${userId}/nested/private.png`],
  ['empty file', `${bucketUrl}${userId}/`],
  ['dot file', `${bucketUrl}${userId}/.hidden`],
  ['no avatar', null],
]

describe.each(['POST', 'DELETE'] as const)(
  'avatar storage ownership, actual %s handler',
  (method) => {
    const invoke = () => (method === 'POST' ? upload(event) : remove(event))
    const expectedUrl = () => (method === 'POST' ? `${bucketUrl}${uploadPath}` : null)

    it('cleans up an own canonical avatar and preserves the profile, metadata, and success contract', async () => {
      const foreignBefore = { ...client.profiles[1] }
      const result = await invoke()
      expect(result).toEqual({
        status: 'success',
        message:
          method === 'POST' ? 'Foto profil berhasil diunggah' : 'Foto profil berhasil dihapus',
        data: method === 'POST' ? { avatar_url: expectedUrl() } : null,
        errors: null,
      })
      expect(client.bucket.remove).toHaveBeenCalledExactlyOnceWith([oldPath])
      expect(client.profiles[0]?.avatar_url).toBe(expectedUrl())
      expect(client.profiles[1]).toEqual(foreignBefore)
      expect(client.auth.admin.updateUserById).toHaveBeenCalledExactlyOnceWith(userId, {
        user_metadata: { avatar_url: expectedUrl() },
      })
      if (method === 'POST') {
        expect(client.bucket.upload).toHaveBeenCalledWith(
          uploadPath,
          Buffer.from('image'),
          expect.objectContaining({ contentType: 'image/png' }),
        )
      }
    })

    it.each(unsafeUrls)(
      'does not remove %s but still completes the profile operation',
      async (_name, url) => {
        client.profiles[0]!.avatar_url = url
        const result = await invoke()
        expect(result.status).toBe('success')
        expect(client.bucket.remove).not.toHaveBeenCalled()
        expect(client.profiles[0]?.avatar_url).toBe(expectedUrl())
        expect(client.auth.admin.updateUserById).toHaveBeenCalledOnce()
      },
    )

    it('does not clean up the old avatar when the profile update fails', async () => {
      client.failUpdate()
      await expect(invoke()).rejects.toMatchObject({ statusCode: 500 })
      expect(client.bucket.remove).not.toHaveBeenCalled()
      expect(client.profiles[0]?.avatar_url).toBe(ownUrl)
      expect(client.auth.admin.updateUserById).not.toHaveBeenCalled()
    })

    it('rejects unauthenticated requests before database, storage, or body access', async () => {
      edges.auth.mockRejectedValueOnce(createError({ statusCode: 401, message: 'Silakan login.' }))
      await expect(invoke()).rejects.toMatchObject({ statusCode: 401 })
      expect(edges.serviceRole).not.toHaveBeenCalled()
      expect(edges.multipart).not.toHaveBeenCalled()
      expect(client.from).not.toHaveBeenCalled()
      expect(client.storage.from).not.toHaveBeenCalled()
    })

    it.each(['returned', 'thrown'] as const)(
      'keeps a completed profile operation successful on a %s cleanup failure',
      async (mode) => {
        const diagnostic = { message: `private storage diagnostic ${ownUrl}` }
        if (mode === 'returned')
          client.bucket.remove.mockResolvedValueOnce({ data: null, error: diagnostic })
        else client.bucket.remove.mockRejectedValueOnce(new Error(diagnostic.message))
        const result = await invoke()
        expect(result.status).toBe('success')
        expect(client.profiles[0]?.avatar_url).toBe(expectedUrl())
        expect(client.auth.admin.updateUserById).toHaveBeenCalledOnce()
        expect(logger.warn).toHaveBeenCalledWith('Avatar cleanup failed', {
          bucket: 'avatars',
          operation: 'remove',
        })
        expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain('private')
        expect(JSON.stringify(vi.mocked(logger.warn).mock.calls)).not.toContain(userId)
        expect(JSON.stringify(result)).not.toContain('diagnostic')
      },
    )
  },
)

it('POST does not remove the path it has just uploaded', async () => {
  client.profiles[0]!.avatar_url = `${bucketUrl}${uploadPath}`
  const result = await upload(event)
  expect(result.status).toBe('success')
  expect(client.bucket.remove).not.toHaveBeenCalled()
  expect(client.profiles[0]?.avatar_url).toBe(`${bucketUrl}${uploadPath}`)
})
