export interface Product {
  id: number
  name: string
  price: number
  description?: string | null
  link?: string | null
  image_url: string | null
  deleted_at?: string | null
}
