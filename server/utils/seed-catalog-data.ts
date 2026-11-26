import { PRODUCTS_TECH_FURNITURE } from '../data/catalog-seed/products-tech-furniture'
import { PRODUCTS_HOME_LIFESTYLE } from '../data/catalog-seed/products-home-lifestyle'
import { PRODUCTS_STATIONERY } from '../data/catalog-seed/products-stationery'
import { VARIANTS_TECH_FURNITURE } from '../data/catalog-seed/variants-tech-furniture'
import { VARIANTS_HOME_LIFESTYLE } from '../data/catalog-seed/variants-home-lifestyle'
import { VARIANTS_STATIONERY } from '../data/catalog-seed/variants-stationery'
import type { SeedProductItem, SeedVariantItem } from '../data/catalog-seed/types'

export type {
  DemoReviewer,
  SeedProductItem,
  SeedReviewItem,
  SeedVariantItem,
} from '../data/catalog-seed/types'
export { CURATED_REVIEWS, DEMO_REVIEWERS } from '../data/catalog-seed/reviews'

export const CURATED_PRODUCTS: SeedProductItem[] = [
  ...PRODUCTS_TECH_FURNITURE,
  ...PRODUCTS_HOME_LIFESTYLE,
  ...PRODUCTS_STATIONERY,
]

export const CURATED_VARIANTS: SeedVariantItem[] = [
  ...VARIANTS_TECH_FURNITURE,
  ...VARIANTS_HOME_LIFESTYLE,
  ...VARIANTS_STATIONERY,
]
