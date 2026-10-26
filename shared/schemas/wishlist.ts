import { z } from 'zod'

export const wishlistMutationSchema = z.object({
  productId: z.number().int().positive({ message: 'ID produk tidak valid' }),
})

export const wishlistSyncSchema = z.object({
  productIds: z.array(z.number().int().positive({ message: 'ID produk tidak valid' })),
})

export type WishlistMutationInput = z.infer<typeof wishlistMutationSchema>
export type WishlistSyncInput = z.infer<typeof wishlistSyncSchema>
