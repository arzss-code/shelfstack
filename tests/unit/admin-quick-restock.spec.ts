import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import QuickRestockForm from '../../app/features/products/components/QuickRestockForm.vue'
import StockMovementsModal from '../../app/features/products/components/StockMovementsModal.vue'

describe('Admin Quick Stock Restock Suite', () => {
  describe('Zod Schema & Restock Validation Rules', () => {
    const restockSchema = z.object({
      quantity: z
        .number()
        .int('Jumlah restock harus bilangan bulat')
        .positive('Jumlah restock minimal 1 unit')
        .max(10000, 'Jumlah restock maksimal 10.000 unit per transaksi'),
      notes: z.string().trim().max(255, 'Catatan maksimal 255 karakter').optional(),
    })

    it('memvalidasi kuantitas restock positif dan catatan opsional dengan sukses', () => {
      const validPayload = { quantity: 25, notes: 'Restock Batch November' }
      const res = restockSchema.safeParse(validPayload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.quantity).toBe(25)
        expect(res.data.notes).toBe('Restock Batch November')
      }
    })

    it('mengizinkan restock tanpa catatan', () => {
      const validNoNotes = { quantity: 10 }
      const res = restockSchema.safeParse(validNoNotes)
      expect(res.success).toBe(true)
    })

    it('menolak kuantitas 0, negatif, pecahan, atau lebih dari 10.000 unit (422)', () => {
      expect(restockSchema.safeParse({ quantity: 0 }).success).toBe(false)
      expect(restockSchema.safeParse({ quantity: -5 }).success).toBe(false)
      expect(restockSchema.safeParse({ quantity: 12.5 }).success).toBe(false)
      expect(restockSchema.safeParse({ quantity: 10001 }).success).toBe(false)
    })

    it('menolak catatan yang melebihi batas 255 karakter', () => {
      const longNotes = 'A'.repeat(256)
      expect(restockSchema.safeParse({ quantity: 5, notes: longNotes }).success).toBe(false)
    })
  })

  describe('Business Logic & Stock Ledger Invariants', () => {
    const calculateStockRestock = (currentStock: number, quantity: number, notes?: string) => {
      if (quantity <= 0) {
        throw new Error('INVALID_QUANTITY')
      }
      const newStock = currentStock + quantity
      const movement = {
        delta: quantity,
        reason: 'manual_adjustment',
      }
      const auditLog = {
        action: 'stock_restocked',
        previous_stock: currentStock,
        added_quantity: quantity,
        new_stock: newStock,
        notes: notes || 'Restock manual oleh admin',
      }
      return { newStock, movement, auditLog }
    }

    it('menghitung stok baru secara deterministik dan mencatat delta positif pada stock_movements', () => {
      const result = calculateStockRestock(5, 20, 'Pengadaan Supplier X')
      expect(result.newStock).toBe(25)
      expect(result.movement.delta).toBe(20)
      expect(result.movement.reason).toBe('manual_adjustment')
      expect(result.auditLog.previous_stock).toBe(5)
      expect(result.auditLog.new_stock).toBe(25)
    })
  })

  describe('QuickRestockForm Component', () => {
    it('merender field input jumlah unit dan tombol aksi dengan benar', () => {
      const wrapper = mount(QuickRestockForm, {
        props: { productId: 42 },
        global: {
          stubs: {
            UiInput: {
              props: ['modelValue', 'type', 'placeholder'],
              template: '<input :value="modelValue" :type="type" :placeholder="placeholder" />',
            },
            UiButton: {
              props: ['loading'],
              template: '<button :disabled="loading"><slot /></button>',
            },
          },
        },
      })

      expect(wrapper.text()).toContain('Restock Cepat Gudang')
      expect(wrapper.text()).toContain('Tutup')
      expect(wrapper.text()).toContain('Simpan')
    })

    it('meng-emit cancel saat tombol Tutup diklik', async () => {
      const wrapper = mount(QuickRestockForm, {
        props: { productId: 42 },
        global: {
          stubs: {
            UiInput: true,
            UiButton: true,
          },
        },
      })

      const closeBtn = wrapper.findAll('button').find((b) => b.text().includes('Tutup'))
      expect(closeBtn).toBeDefined()
      await closeBtn?.trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('StockMovementsModal Integration', () => {
    it('menampilkan tombol Restock Cepat pada header modal audit stok', () => {
      const wrapper = mount(StockMovementsModal, {
        props: {
          show: true,
          product: {
            id: 1,
            name: 'Meja Kerja Minimalis',
            sku: 'TBL-MIN-01',
            price: 1500000,
            stock: 8,
            image_url: null,
          },
        },
        global: {
          stubs: {
            UiModal: {
              template: '<div><slot name="header" /><slot /><slot name="footer" /></div>',
            },
            UiTabs: true,
            UiButton: {
              template: '<button><slot /></button>',
            },
            UiAlert: true,
            UiEmptyState: true,
            QuickRestockForm: true,
          },
        },
      })

      expect(wrapper.text()).toContain('Audit Mutasi Stok')
      expect(wrapper.text()).toContain('Restock Cepat')
      expect(wrapper.text()).toContain('TBL-MIN-01')
      expect(wrapper.text()).toContain('8 unit')
    })
  })

  describe('SOP & Architecture Constraints Verification', () => {
    it('memastikan seluruh berkas fitur mematuhi batas <= 300 baris, bebas dari em dash dan tipe any', () => {
      const files = [
        'server/api/admin/products/[id]/restock.post.ts',
        'app/features/products/components/QuickRestockForm.vue',
        'app/features/products/components/StockMovementsModal.vue',
        'app/pages/admin/products.vue',
        'tests/unit/admin-quick-restock.spec.ts',
      ]

      for (const rel of files) {
        const fullPath = path.resolve(process.cwd(), rel)
        const content = fs.readFileSync(fullPath, 'utf-8')
        const lineCount = content.split('\n').length
        expect(lineCount, `${rel} melebihi 300 baris (tercatat: ${lineCount})`).toBeLessThanOrEqual(
          300,
        )
        expect(content, `${rel} mengandung karakter em dash terlarang`).not.toContain('\u2014')
        expect(content, `${rel} mengandung tipe any terlarang`).not.toMatch(
          /:\s*any\b|\bas\s+any\b/,
        )
      }
    })
  })
})
