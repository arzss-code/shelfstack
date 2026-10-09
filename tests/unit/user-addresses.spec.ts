import { describe, expect, it, beforeEach } from 'vitest'
import {
  createAddressSchema,
  updateAddressSchema,
  type CreateAddressInput,
  type UserAddress,
} from '../../shared/schemas/address'

/**
 * Unit Test Suite: Persisted User Shipping Addresses
 * Memverifikasi:
 * 1. Validasi Zod Schema (Input creation, Indonesian phone & postal format, partial update)
 * 2. User Ownership Guard Logic (Multi-tenant isolation, user A vs user B)
 * 3. Default Address Resolution Logic (First address default, new default override, handover on deletion)
 * 4. Soft Delete Semantics (deleted_at exclusion)
 * 5. Full Simulated API Handlers (GET, POST, PUT, DELETE)
 */

describe('Address Zod Schema Validation', () => {
  const validAddress: CreateAddressInput = {
    name: 'Budi Santoso',
    phone: '081234567890',
    street: 'Jl. Jenderal Sudirman No. 45, RT 02/RW 03',
    city: 'Jakarta Pusat',
    postal: '10220',
    note: 'Titipkan di pos satpam depan.',
    is_default: false,
  }

  it('menerima payload alamat yang lengkap dan valid', () => {
    const result = createAddressSchema.safeParse(validAddress)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Budi Santoso')
      expect(result.data.postal).toBe('10220')
    }
  })

  it('mengizinkan alamat tanpa catatan opsional dan default false', () => {
    const { note: _, is_default: __, ...minimalAddress } = validAddress
    const result = createAddressSchema.safeParse(minimalAddress)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_default).toBe(false)
      expect(result.data.note).toBeUndefined()
    }
  })

  it('menolak nama penerima kurang dari 3 karakter atau lebih dari 100 karakter', () => {
    expect(createAddressSchema.safeParse({ ...validAddress, name: 'Al' }).success).toBe(false)
    expect(createAddressSchema.safeParse({ ...validAddress, name: 'a'.repeat(101) }).success).toBe(
      false,
    )
  })

  it('menerima format nomor telepon Indonesia yang bervariasi', () => {
    const validPhones = ['081234567890', '+6281234567890', '0812-3456-7890', '+628123456789']
    for (const phone of validPhones) {
      const res = createAddressSchema.safeParse({ ...validAddress, phone })
      expect(res.success).toBe(true)
    }
  })

  it('menolak nomor telepon kurang dari 9 digit, lebih dari 15 karakter, atau mengandung huruf', () => {
    expect(createAddressSchema.safeParse({ ...validAddress, phone: '081234' }).success).toBe(false)
    expect(
      createAddressSchema.safeParse({ ...validAddress, phone: '081234567890123456' }).success,
    ).toBe(false)
    expect(createAddressSchema.safeParse({ ...validAddress, phone: '0812abc3456' }).success).toBe(
      false,
    )
  })

  it('menolak alamat jalan kurang dari 10 karakter atau lebih dari 300 karakter', () => {
    expect(createAddressSchema.safeParse({ ...validAddress, street: 'Jl. Baru' }).success).toBe(
      false,
    )
    expect(
      createAddressSchema.safeParse({ ...validAddress, street: 'a'.repeat(301) }).success,
    ).toBe(false)
  })

  it('menolak kota kurang dari 3 karakter atau lebih dari 100 karakter', () => {
    expect(createAddressSchema.safeParse({ ...validAddress, city: 'JK' }).success).toBe(false)
    expect(createAddressSchema.safeParse({ ...validAddress, city: 'a'.repeat(101) }).success).toBe(
      false,
    )
  })

  it('menerima kode pos numerik 5-10 digit dan menolak yang non-numerik', () => {
    expect(createAddressSchema.safeParse({ ...validAddress, postal: '10220' }).success).toBe(true)
    expect(createAddressSchema.safeParse({ ...validAddress, postal: '1234567890' }).success).toBe(
      true,
    )
    expect(createAddressSchema.safeParse({ ...validAddress, postal: '1022' }).success).toBe(false)
    expect(createAddressSchema.safeParse({ ...validAddress, postal: '10220A' }).success).toBe(false)
    expect(createAddressSchema.safeParse({ ...validAddress, postal: '10220-001' }).success).toBe(
      false,
    )
  })

  it('menolak catatan yang melebihi batas 300 karakter', () => {
    expect(createAddressSchema.safeParse({ ...validAddress, note: 'n'.repeat(301) }).success).toBe(
      false,
    )
  })

  it('mendukung validasi pembaruan parsial (updateAddressSchema)', () => {
    const partialValid = updateAddressSchema.safeParse({ is_default: true })
    expect(partialValid.success).toBe(true)

    const partialInvalidPhone = updateAddressSchema.safeParse({ phone: '123' })
    expect(partialInvalidPhone.success).toBe(false)
  })
})

describe('User Ownership Guard & Multi-Tenant Isolation Logic', () => {
  const userAId = '11111111-1111-4111-a111-111111111111'
  const userBId = '22222222-2222-4222-b222-222222222222'

  let mockDatabase: UserAddress[] = []

  beforeEach(() => {
    mockDatabase = [
      {
        id: 'addr-a1',
        user_id: userAId,
        name: 'User A Rumah',
        phone: '081234567890',
        street: 'Jl. Merdeka No. 1, Gambir',
        city: 'Jakarta Pusat',
        postal: '10110',
        note: null,
        is_default: true,
        created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
        updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
        deleted_at: null,
      },
      {
        id: 'addr-b1',
        user_id: userBId,
        name: 'User B Kantor',
        phone: '081987654321',
        street: 'Jl. Gatot Subroto No. 88, Tebet',
        city: 'Jakarta Selatan',
        postal: '12870',
        note: 'Lantai 5',
        is_default: true,
        created_at: new Date('2026-01-02T00:00:00Z').toISOString(),
        updated_at: new Date('2026-01-02T00:00:00Z').toISOString(),
        deleted_at: null,
      },
    ]
  })

  const simulateAccess = (
    action: 'read' | 'update' | 'delete',
    targetAddressId: string,
    currentUserId: string,
  ) => {
    const record = mockDatabase.find((a) => a.id === targetAddressId && a.deleted_at === null)
    if (!record) {
      return { status: 404, message: 'Alamat tidak ditemukan' }
    }
    // RLS & API Ownership Guard
    if (record.user_id !== currentUserId) {
      return { status: 403, message: 'Akses alamat ditolak' }
    }
    return { status: 200, data: record }
  }

  it('mengizinkan User A membaca alamat miliknya sendiri', () => {
    const res = simulateAccess('read', 'addr-a1', userAId)
    expect(res.status).toBe(200)
    expect(res.data?.id).toBe('addr-a1')
  })

  it('menolak User A yang mencoba membaca alamat milik User B (403 Forbidden)', () => {
    const res = simulateAccess('read', 'addr-b1', userAId)
    expect(res.status).toBe(403)
    expect(res.message).toBe('Akses alamat ditolak')
  })

  it('menolak User B yang mencoba memodifikasi atau menghapus alamat milik User A', () => {
    const resUpdate = simulateAccess('update', 'addr-a1', userBId)
    expect(resUpdate.status).toBe(403)

    const resDelete = simulateAccess('delete', 'addr-a1', userBId)
    expect(resDelete.status).toBe(403)
  })
})

describe('Default Address Resolution & Handover Logic', () => {
  const userId = '11111111-1111-4111-a111-111111111111'
  let mockDatabase: UserAddress[] = []

  beforeEach(() => {
    mockDatabase = []
  })

  const addAddress = (input: CreateAddressInput) => {
    const activeAddresses = mockDatabase.filter(
      (a) => a.user_id === userId && a.deleted_at === null,
    )
    const isFirst = activeAddresses.length === 0
    const shouldBeDefault = Boolean(input.is_default) || isFirst

    if (shouldBeDefault) {
      // Unset previous defaults
      for (const a of mockDatabase) {
        if (a.user_id === userId && a.deleted_at === null && a.is_default) {
          a.is_default = false
        }
      }
    }

    const created: UserAddress = {
      id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      name: input.name,
      phone: input.phone,
      street: input.street,
      city: input.city,
      postal: input.postal,
      note: input.note || null,
      is_default: shouldBeDefault,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }

    mockDatabase.push(created)
    return created
  }

  const deleteAddress = (addressId: string) => {
    const record = mockDatabase.find(
      (a) => a.id === addressId && a.user_id === userId && a.deleted_at === null,
    )
    if (!record) return null

    record.deleted_at = new Date().toISOString()

    // Handover default jika yang dihapus adalah alamat default
    if (record.is_default) {
      const remaining = mockDatabase
        .filter((a) => a.user_id === userId && a.deleted_at === null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      if (remaining.length > 0 && remaining[0]) {
        remaining[0].is_default = true
      }
    }

    return record
  }

  it('otomatis menjadikan alamat pertama sebagai alamat utama (default)', () => {
    const first = addAddress({
      name: 'Alamat Pertama',
      phone: '081234567890',
      street: 'Jl. Anggrek No. 10',
      city: 'Bandung',
      postal: '40111',
      is_default: false,
    })

    expect(first.is_default).toBe(true)
  })

  it('memastikan hanya 1 alamat yang berstatus is_default: true saat alamat baru ditandai utama', () => {
    const first = addAddress({
      name: 'Alamat Pertama',
      phone: '081234567890',
      street: 'Jl. Anggrek No. 10',
      city: 'Bandung',
      postal: '40111',
    })
    expect(first.is_default).toBe(true)

    const second = addAddress({
      name: 'Alamat Kedua',
      phone: '081234567891',
      street: 'Jl. Melati No. 20',
      city: 'Bandung',
      postal: '40112',
      is_default: true,
    })
    expect(second.is_default).toBe(true)

    const activeList = mockDatabase.filter((a) => a.deleted_at === null)
    const defaultAddresses = activeList.filter((a) => a.is_default)

    expect(defaultAddresses).toHaveLength(1)
    expect(defaultAddresses[0]?.id).toBe(second.id)
  })

  it('melakukan handover status is_default ke alamat tersisa saat alamat default dihapus', () => {
    const first = addAddress({
      name: 'Alamat Pertama',
      phone: '081234567890',
      street: 'Jl. Anggrek No. 10',
      city: 'Bandung',
      postal: '40111',
    })

    const second = addAddress({
      name: 'Alamat Kedua',
      phone: '081234567891',
      street: 'Jl. Melati No. 20',
      city: 'Bandung',
      postal: '40112',
      is_default: true,
    })

    expect(second.is_default).toBe(true)

    // Hapus alamat kedua (yang sedang menjadi default)
    deleteAddress(second.id)

    expect(second.deleted_at).not.toBeNull()

    // Alamat pertama harus dipromosikan kembali menjadi default
    const updatedFirst = mockDatabase.find((a) => a.id === first.id)
    expect(updatedFirst?.is_default).toBe(true)
  })
})

describe('Simulated API Endpoint Handlers (GET, POST, PUT, DELETE)', () => {
  const userId = 'user-test-uuid-123'
  let db: UserAddress[] = []

  beforeEach(() => {
    db = [
      {
        id: 'addr-1',
        user_id: userId,
        name: 'Arya Santoso',
        phone: '081234567890',
        street: 'Jl. Sudirman No. 42, Menteng',
        city: 'Jakarta Pusat',
        postal: '10220',
        note: 'Pintu pagar hitam',
        is_default: true,
        created_at: new Date('2026-03-01T10:00:00Z').toISOString(),
        updated_at: new Date('2026-03-01T10:00:00Z').toISOString(),
        deleted_at: null,
      },
    ]
  })

  // Simulated GET /api/addresses
  const handleGet = (currentUserId: string) => {
    const list = db
      .filter((a) => a.user_id === currentUserId && a.deleted_at === null)
      .sort((a, b) => {
        if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    return { status: 200, data: list }
  }

  // Simulated POST /api/addresses
  const handlePost = (currentUserId: string, body: any) => {
    const parsed = createAddressSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, errors: parsed.error.flatten().fieldErrors }
    }

    const activeList = db.filter((a) => a.user_id === currentUserId && a.deleted_at === null)
    const isFirst = activeList.length === 0
    const shouldBeDefault = Boolean(parsed.data.is_default) || isFirst

    if (shouldBeDefault) {
      for (const a of db) {
        if (a.user_id === currentUserId && a.deleted_at === null) {
          a.is_default = false
        }
      }
    }

    const created: UserAddress = {
      id: `addr-${db.length + 1}`,
      user_id: currentUserId,
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim(),
      street: parsed.data.street.trim(),
      city: parsed.data.city.trim(),
      postal: parsed.data.postal.trim(),
      note: parsed.data.note ? parsed.data.note.trim() : null,
      is_default: shouldBeDefault,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }

    db.push(created)
    return { status: 201, data: created }
  }

  // Simulated PUT /api/addresses/:id
  const handlePut = (currentUserId: string, addressId: string, body: any) => {
    const existing = db.find((a) => a.id === addressId && a.deleted_at === null)
    if (!existing) return { status: 404, message: 'Alamat tidak ditemukan' }
    if (existing.user_id !== currentUserId) return { status: 403, message: 'Akses alamat ditolak' }

    const parsed = updateAddressSchema.safeParse(body)
    if (!parsed.success) {
      return { status: 400, errors: parsed.error.flatten().fieldErrors }
    }

    if (parsed.data.is_default === true) {
      for (const a of db) {
        if (a.user_id === currentUserId && a.deleted_at === null) {
          a.is_default = false
        }
      }
      existing.is_default = true
    }

    if (parsed.data.name) existing.name = parsed.data.name.trim()
    if (parsed.data.city) existing.city = parsed.data.city.trim()
    existing.updated_at = new Date().toISOString()

    return { status: 200, data: existing }
  }

  // Simulated DELETE /api/addresses/:id
  const handleDelete = (currentUserId: string, addressId: string) => {
    const existing = db.find((a) => a.id === addressId && a.deleted_at === null)
    if (!existing) return { status: 404, message: 'Alamat tidak ditemukan' }
    if (existing.user_id !== currentUserId) return { status: 403, message: 'Akses alamat ditolak' }

    existing.deleted_at = new Date().toISOString()
    return { status: 200, message: 'Alamat berhasil dihapus' }
  }

  it('GET mengembalikan daftar alamat aktif pengguna terurut dengan default di atas', () => {
    const res = handleGet(userId)
    expect(res.status).toBe(200)
    expect(res.data).toHaveLength(1)
    expect(res.data[0]?.name).toBe('Arya Santoso')
  })

  it('POST memvalidasi input dan menyimpan alamat baru', () => {
    const res = handlePost(userId, {
      name: 'Kantor Arya',
      phone: '081298765432',
      street: 'Jl. Rasuna Said Kav. B4, Kuningan',
      city: 'Jakarta Selatan',
      postal: '12920',
      note: 'Gedung Menara Lt. 12',
      is_default: false,
    })

    expect(res.status).toBe(201)
    expect(res.data?.name).toBe('Kantor Arya')
    expect(db).toHaveLength(2)
  })

  it('POST menolak data yang tidak memenuhi kriteria validasi Zod', () => {
    const res = handlePost(userId, {
      name: 'No',
      phone: '123',
      street: 'Pendek',
      city: 'JK',
      postal: '123',
    })

    expect(res.status).toBe(400)
    expect(res.errors).toHaveProperty('name')
    expect(res.errors).toHaveProperty('phone')
    expect(res.errors).toHaveProperty('street')
    expect(res.errors).toHaveProperty('city')
    expect(res.errors).toHaveProperty('postal')
  })

  it('PUT memperbarui alamat milik pengguna', () => {
    const res = handlePut(userId, 'addr-1', {
      name: 'Arya Santoso Updated',
      city: 'Jakarta Barat',
    })

    expect(res.status).toBe(200)
    expect(res.data?.name).toBe('Arya Santoso Updated')
    expect(res.data?.city).toBe('Jakarta Barat')
  })

  it('DELETE melakukan soft-delete dan menyembunyikan alamat dari query GET', () => {
    const resDelete = handleDelete(userId, 'addr-1')
    expect(resDelete.status).toBe(200)

    const resGet = handleGet(userId)
    expect(resGet.data).toHaveLength(0)
  })
})
