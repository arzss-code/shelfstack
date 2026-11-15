import { z } from 'zod'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

const restockSchema = z.object({
  quantity: z
    .number()
    .int('Jumlah restock harus bilangan bulat')
    .positive('Jumlah restock minimal 1 unit')
    .max(10000, 'Jumlah restock maksimal 10.000 unit per transaksi'),
  notes: z.string().trim().max(255, 'Catatan maksimal 255 karakter').optional(),
})

export default defineEventHandler(async (event) => {
  // 1. Otorisasi khusus Admin
  await requireAdmin(event)

  const idParam = getRouterParam(event, 'id')
  const productId = parseInt(idParam || '', 10)

  if (isNaN(productId) || productId <= 0) {
    return errorResponse(event, 'ID produk tidak valid', null, 400)
  }

  const rawBody = await readBody(event)
  const parseResult = restockSchema.safeParse(rawBody)

  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((i) => i.message).join(', ')
    return errorResponse(event, `Validasi gagal: ${errorMessages}`, parseResult.error.format(), 422)
  }

  const { quantity, notes } = parseResult.data
  const client = await serverSupabaseClient<Database>(event)

  // 2. Ambil data stok produk terkini
  const { data: product, error: productError } = await client
    .from('products')
    .select('id, name, sku, stock')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return errorResponse(event, 'Produk tidak ditemukan di database', null, 404)
  }

  const previousStock = product.stock ?? 0
  const newStock = previousStock + quantity

  // 3. Perbarui stok produk secara atomik
  const { error: updateError } = await client
    .from('products')
    .update({ stock: newStock })
    .eq('id', productId)

  if (updateError) {
    return errorResponse(event, 'Gagal memperbarui stok produk', updateError, 500)
  }

  // 4. Catat riwayat audit ledger ke stock_movements
  const { error: movementError } = await client.from('stock_movements').insert({
    product_id: productId,
    delta: quantity,
    balance_after: newStock,
    notes: notes || null,
    reason: 'manual_adjustment',
  })

  if (movementError) {
    // Log error tanpa menggugurkan respon sukses karena stok sudah terupdate
    console.error('[QuickRestock] Gagal mencatat stock_movement:', movementError)
  }

  // 5. Catat activity log audit back-office
  await client.from('activity_logs').insert({
    action: 'UPDATE',
    entity_type: 'products',
    entity_id: productId,
    description: `Restock cepat produk ${product.name} (+${quantity} unit)`,
    old_data: { stock: previousStock },
    new_data: { stock: newStock, notes: notes || null },
  })

  return successResponse('Stok produk berhasil diperbarui', {
    product_id: productId,
    product_name: product.name,
    previous_stock: previousStock,
    added_quantity: quantity,
    new_stock: newStock,
  })
})
