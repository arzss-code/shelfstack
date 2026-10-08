import { describe, it, expect } from 'vitest'
import { extractAuthUserId } from '../../shared/utils/auth'

describe('Auth Utilities - extractAuthUserId & Claims Normalization', () => {
  it('extracts id when present on standard User object', () => {
    const user = { id: 'd3b07384-d113-460b-8328-9366e6c46698', email: 'test@example.com' }
    expect(extractAuthUserId(user)).toBe('d3b07384-d113-460b-8328-9366e6c46698')
  })

  it('extracts sub when id is undefined (Nuxt Supabase server JWT claims format)', () => {
    const claims = {
      sub: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      email: 'customer@example.com',
      role: 'authenticated',
    }
    expect(extractAuthUserId(claims)).toBe('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')
  })

  it('handles user object with string "undefined" as id by falling back to sub', () => {
    const malformed = {
      id: 'undefined',
      sub: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
    }
    expect(extractAuthUserId(malformed)).toBe('c56a4180-65aa-42ec-a945-5fd21dec0538')
  })

  it('returns null when both id and sub are missing or empty', () => {
    expect(extractAuthUserId({})).toBeNull()
    expect(extractAuthUserId({ id: '', sub: '' })).toBeNull()
    expect(extractAuthUserId({ id: '   ', sub: '   ' })).toBeNull()
    expect(extractAuthUserId({ id: 'undefined', sub: 'undefined' })).toBeNull()
  })

  it('returns null for null, undefined, or non-object inputs', () => {
    expect(extractAuthUserId(null)).toBeNull()
    expect(extractAuthUserId(undefined)).toBeNull()
    expect(extractAuthUserId('string-user')).toBeNull()
    expect(extractAuthUserId(12345)).toBeNull()
  })

  it('trims outer whitespace from id or sub', () => {
    const spaced = { sub: '  a1b2c3d4-e5f6-7890-abcd-ef1234567890  ' }
    expect(extractAuthUserId(spaced)).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
  })
})
