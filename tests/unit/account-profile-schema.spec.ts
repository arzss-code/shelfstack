import { describe, it, expect } from 'vitest'
import {
  updateProfileSchema,
  updateEmailSchema,
  updatePasswordSchema,
} from '../../shared/schemas/profile'

describe('Account Profile Schemas [SHF-ACC-01]', () => {
  describe('updateProfileSchema', () => {
    it('menerima nama lengkap yang valid', () => {
      const result = updateProfileSchema.safeParse({ full_name: 'Budi Santoso' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.full_name).toBe('Budi Santoso')
      }
    })

    it('menolak nama kurang dari 3 karakter', () => {
      const result = updateProfileSchema.safeParse({ full_name: 'Al' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.full_name).toContain(
          'Nama lengkap minimal 3 karakter.',
        )
      }
    })

    it('melakukan trim pada spasi nama', () => {
      const result = updateProfileSchema.safeParse({ full_name: '  Aria Pratama  ' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.full_name).toBe('Aria Pratama')
      }
    })

    it('menerima avatar_url yang valid', () => {
      const result = updateProfileSchema.safeParse({
        avatar_url: 'https://example.com/storage/avatars/user123.jpg',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.avatar_url).toBe('https://example.com/storage/avatars/user123.jpg')
      }
    })

    it('menerima avatar_url bernilai null untuk menghapus foto', () => {
      const result = updateProfileSchema.safeParse({
        avatar_url: null,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.avatar_url).toBeNull()
      }
    })

    it('menolak avatar_url yang tidak valid format URL-nya', () => {
      const result = updateProfileSchema.safeParse({
        avatar_url: 'bukan-url-gambar',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.avatar_url).toContain(
          'Format URL foto profil tidak valid.',
        )
      }
    })

    it('menolak objek kosong tanpa nama maupun foto profil', () => {
      const result = updateProfileSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('updateEmailSchema', () => {
    it('menerima email yang valid', () => {
      const result = updateEmailSchema.safeParse({ email: 'user@example.com' })
      expect(result.success).toBe(true)
    })

    it('menolak format email yang tidak valid', () => {
      const result = updateEmailSchema.safeParse({ email: 'bukan-email' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toContain(
          'Format alamat email tidak valid.',
        )
      }
    })
  })

  describe('updatePasswordSchema', () => {
    it('menerima password baru dan konfirmasi yang cocok', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'PasswordBaru123',
        confirm_password: 'PasswordBaru123',
      })
      expect(result.success).toBe(true)
    })

    it('menolak password baru kurang dari 8 karakter', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'pass1',
        confirm_password: 'pass1',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toContain(
          'Password baru minimal 8 karakter.',
        )
      }
    })

    it('menolak jika konfirmasi password berbeda', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'PasswordBaru123',
        confirm_password: 'PasswordBeda456',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.confirm_password).toContain(
          'Konfirmasi password tidak cocok.',
        )
      }
    })
  })
})
