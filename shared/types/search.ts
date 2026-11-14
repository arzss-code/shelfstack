export interface InstantSearchProduct {
  id: number | string
  name: string
  slug: string | null
  price: number
  image_url: string | null
  category: string
  stock: number
}

export interface InstantSearchCategory {
  id?: string
  name: string
  slug: string
}

export interface InstantSearchResponse {
  products: InstantSearchProduct[]
  categories: InstantSearchCategory[]
  query: string
}
