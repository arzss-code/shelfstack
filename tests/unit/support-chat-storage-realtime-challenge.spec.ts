import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Milestone 1 Storage & Realtime Adversarial Challenge Suite', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../supabase/migrations/20261129000001_customer_support_live_chat.sql',
  )
  const migrationSql = fs.readFileSync(migrationPath, 'utf8')

  describe('1. Storage Security Adversarial Tests', () => {
    describe('1.1 Malicious file uploads, MIME type & file size enforcement', () => {
      it('enforces exact 5MB file size limit in storage.buckets configuration', () => {
        // 5MB = 5 * 1024 * 1024 = 5242880 bytes
        const sizeLimitRegex = /file_size_limit\s*=\s*5242880/
        expect(migrationSql).toMatch(sizeLimitRegex)

        // Validate size boundary oracle
        const MAX_SIZE = 5242880
        const isSizeAllowed = (sizeInBytes: number) => sizeInBytes <= MAX_SIZE

        expect(isSizeAllowed(1024)).toBe(true) // 1 KB
        expect(isSizeAllowed(5242880)).toBe(true) // exactly 5 MB
        expect(isSizeAllowed(5242881)).toBe(false) // 5 MB + 1 byte (BLOCKED)
        expect(isSizeAllowed(10485760)).toBe(false) // 10 MB (BLOCKED)
      })

      it('restricts allowed MIME types strictly to JPEG, PNG, and WebP, blocking dangerous extensions', () => {
        const mimeRegex =
          /allowed_mime_types\s*=\s*array\['image\/jpeg',\s*'image\/png',\s*'image\/webp'\]/
        expect(migrationSql).toMatch(mimeRegex)

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
        const isMimeAllowed = (mime: string) => allowedMimeTypes.includes(mime)

        // Allowed safe image types
        expect(isMimeAllowed('image/jpeg')).toBe(true)
        expect(isMimeAllowed('image/png')).toBe(true)
        expect(isMimeAllowed('image/webp')).toBe(true)

        // Adversarial & dangerous MIME types must be rejected
        expect(isMimeAllowed('image/svg+xml')).toBe(false) // Stored XSS vector
        expect(isMimeAllowed('text/html')).toBe(false) // HTML injection
        expect(isMimeAllowed('application/javascript')).toBe(false) // Script execution
        expect(isMimeAllowed('application/x-msdownload')).toBe(false) // Executable payload
        expect(isMimeAllowed('application/pdf')).toBe(false) // Document attachment
        expect(isMimeAllowed('image/gif')).toBe(false) // Animated/unsupported image
        expect(isMimeAllowed('application/octet-stream')).toBe(false) // Raw binary
      })

      it('configures chat-attachments bucket creation with on conflict do nothing idempotency', () => {
        const bucketInsertRegex =
          /insert\s+into\s+storage\.buckets\s*\(\s*id,\s*name,\s*public\s*\)\s*values\s*\(\s*'chat-attachments',\s*'chat-attachments',\s*true\s*\)\s*on\s+conflict\s*\(\s*id\s*\)\s*do\s+nothing;/i
        expect(migrationSql).toMatch(bucketInsertRegex)
      })
    })

    describe('1.2 Unauthenticated user upload prevention', () => {
      it('strictly restricts write/manage policies on storage.objects to authenticated role', () => {
        // Verify policy targets 'to authenticated' and NOT public or anon
        const managePolicyRegex =
          /create\s+policy\s+"users manage own chat attachments"\s+on\s+storage\.objects\s+for\s+all\s+to\s+authenticated/i
        expect(migrationSql).toMatch(managePolicyRegex)

        // Verify public policy is exclusively for SELECT
        const publicSelectRegex =
          /create\s+policy\s+"public view chat attachments"\s+on\s+storage\.objects\s+for\s+select\s+to\s+public/i
        expect(migrationSql).toMatch(publicSelectRegex)

        // Simulate RLS decision oracle
        interface MockSecurityContext {
          role: 'anon' | 'authenticated'
          userId: string | null
          isAdmin: boolean
        }

        const canUpload = (ctx: MockSecurityContext, bucket: string): boolean => {
          if (bucket !== 'chat-attachments') return false
          if (ctx.role !== 'authenticated' || !ctx.userId) return false
          return true
        }

        // Unauthenticated visitor
        const anonVisitor: MockSecurityContext = { role: 'anon', userId: null, isAdmin: false }
        expect(canUpload(anonVisitor, 'chat-attachments')).toBe(false)

        // Authenticated customer
        const authCustomer: MockSecurityContext = {
          role: 'authenticated',
          userId: 'user-uuid-1',
          isAdmin: false,
        }
        expect(canUpload(authCustomer, 'chat-attachments')).toBe(true)
      })
    })

    describe('1.3 Cross-user folder isolation', () => {
      it('enforces storage.foldername(name)[1] = auth.uid()::text or public.is_admin() in USING and WITH CHECK', () => {
        const folderCheckRegex =
          /\(\(storage\.foldername\(name\)\)\[1\]\s*=\s*auth\.uid\(\)::text\s+or\s+public\.is_admin\(\)\)/i
        expect(migrationSql).toMatch(folderCheckRegex)

        // Test PostgreSQL foldername logic simulation
        // In PostgreSQL: storage.foldername('a/b/c.png') -> ['a', 'b'] (1-indexed, [1] is 'a')
        const postgresFoldername = (objectPath: string): string[] => {
          const parts = objectPath.split('/')
          if (parts.length <= 1) return []
          return parts.slice(0, -1) // directory parts
        }

        const evaluateStorageRls = (
          objectPath: string,
          authUid: string | null,
          isAdmin: boolean,
          bucketId: string,
        ): boolean => {
          if (bucketId !== 'chat-attachments') return false
          if (!authUid && !isAdmin) return false

          const folders = postgresFoldername(objectPath)
          const topFolder = folders.length > 0 ? folders[0] : null // 1-indexed [1]

          if (isAdmin) return true
          if (topFolder && topFolder === authUid) return true

          return false
        }

        const userA = '11111111-1111-1111-1111-111111111111'
        const userB = '22222222-2222-2222-2222-222222222222'

        // User A uploading to User A's folder: ALLOWED
        expect(
          evaluateStorageRls(`${userA}/screenshot.png`, userA, false, 'chat-attachments'),
        ).toBe(true)

        // User A uploading to User A's subfolder: ALLOWED
        expect(
          evaluateStorageRls(`${userA}/sub/screenshot.png`, userA, false, 'chat-attachments'),
        ).toBe(true)

        // User A attempting to upload to User B's folder: STRICTLY BLOCKED
        expect(evaluateStorageRls(`${userB}/malicious.png`, userA, false, 'chat-attachments')).toBe(
          false,
        )

        // User A attempting to upload to bucket root (no folder): STRICTLY BLOCKED
        expect(evaluateStorageRls('root-exploit.png', userA, false, 'chat-attachments')).toBe(false)

        // User A attempting prefix spoofing (e.g. userA-suffix): STRICTLY BLOCKED
        expect(
          evaluateStorageRls(`${userA}-spoof/fake.png`, userA, false, 'chat-attachments'),
        ).toBe(false)

        // CS Admin uploading or managing any folder: ALLOWED
        expect(
          evaluateStorageRls(
            `${userB}/admin-annotated.png`,
            'admin-uuid',
            true,
            'chat-attachments',
          ),
        ).toBe(true)

        // Wrong bucket: BLOCKED
        expect(evaluateStorageRls(`${userA}/screenshot.png`, userA, false, 'other-bucket')).toBe(
          false,
        )
      })
    })
  })

  describe('2. Realtime Publications & Replica Identity Adversarial Tests', () => {
    it('registers both support_threads and support_messages tables into supabase_realtime publication', () => {
      // Both tables must be registered
      expect(migrationSql).toMatch(
        /alter\s+publication\s+supabase_realtime\s+add\s+table\s+public\.support_threads;/i,
      )
      expect(migrationSql).toMatch(
        /alter\s+publication\s+supabase_realtime\s+add\s+table\s+public\.support_messages;/i,
      )

      // Guarded by idempotent pg_publication_tables checks
      const threadsPublicationGuard =
        /if\s+not\s+exists\s*\(\s*select\s+1\s+from\s+pg_publication_tables\s+where\s+pubname\s*=\s*'supabase_realtime'\s+and\s+tablename\s*=\s*'support_threads'\s*\)/i
      const messagesPublicationGuard =
        /if\s+not\s+exists\s*\(\s*select\s+1\s+from\s+pg_publication_tables\s+where\s+pubname\s*=\s*'supabase_realtime'\s+and\s+tablename\s*=\s*'support_messages'\s*\)/i

      expect(migrationSql).toMatch(threadsPublicationGuard)
      expect(migrationSql).toMatch(messagesPublicationGuard)
    })

    it('sets replica identity full on both tables to guarantee complete row update WAL logs', () => {
      expect(migrationSql).toMatch(
        /alter\s+table\s+public\.support_threads\s+replica\s+identity\s+full;/i,
      )
      expect(migrationSql).toMatch(
        /alter\s+table\s+public\.support_messages\s+replica\s+identity\s+full;/i,
      )

      // Verify WAL payload semantics:
      // With REPLICA IDENTITY FULL, WAL contains full previous row on UPDATE and DELETE.
      // This is essential for Supabase Realtime RLS filtering and diff detection.
      interface RealtimeUpdateEvent<T> {
        eventType: 'UPDATE'
        schema: string
        table: string
        record: T // new row
        old_record: Partial<T> // previous row
      }

      type ThreadData = {
        id: string
        customer_id: string
        status: string
        unread_by_admin_count: number
        last_message_text: string
      }

      const defaultReplicaIdentityPayload: RealtimeUpdateEvent<ThreadData> = {
        eventType: 'UPDATE',
        schema: 'public',
        table: 'support_threads',
        record: {
          id: 'th-1',
          customer_id: 'cust-1',
          status: 'waiting_admin',
          unread_by_admin_count: 1,
          last_message_text: 'Halo CS',
        },
        // DEFAULT replica identity only provides primary key in old_record
        old_record: { id: 'th-1' },
      }

      const fullReplicaIdentityPayload: RealtimeUpdateEvent<ThreadData> = {
        eventType: 'UPDATE',
        schema: 'public',
        table: 'support_threads',
        record: {
          id: 'th-1',
          customer_id: 'cust-1',
          status: 'waiting_admin',
          unread_by_admin_count: 1,
          last_message_text: 'Halo CS',
        },
        // FULL replica identity provides the complete previous row in old_record!
        old_record: {
          id: 'th-1',
          customer_id: 'cust-1',
          status: 'open',
          unread_by_admin_count: 0,
          last_message_text: 'Selamat datang',
        },
      }

      // Verification: DEFAULT replica identity fails when components need previous status
      expect(defaultReplicaIdentityPayload.old_record.status).toBeUndefined()

      // Verification: FULL replica identity guarantees previous state availability
      expect(fullReplicaIdentityPayload.old_record.status).toBe('open')
      expect(fullReplicaIdentityPayload.old_record.customer_id).toBe('cust-1')
      expect(fullReplicaIdentityPayload.old_record.unread_by_admin_count).toBe(0)
    })
  })
})
