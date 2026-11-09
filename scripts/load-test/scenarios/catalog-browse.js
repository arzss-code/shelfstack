import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { getBaseUrl, createHeaders, COMMON_THRESHOLDS } from '../common.js'

export const catalogErrorRate = new Rate('catalog_error_rate')
export const catalogDurationTrend = new Trend('catalog_duration_ms')

export const options = {
  stages: [
    { duration: '5s', target: 5 }, // Ramp up 5 VUs
    { duration: '15s', target: 10 }, // Beban stabil 10 VUs
    { duration: '5s', target: 0 }, // Ramp down ke 0
  ],
  thresholds: {
    ...COMMON_THRESHOLDS.catalog,
    catalog_error_rate: ['rate<0.01'],
  },
}

export default function () {
  const baseUrl = getBaseUrl()
  const headers = createHeaders()

  group('Katalog ShelfStack: Kategori dan Listing', function () {
    // 1. Ambil daftar kategori resmi
    const catRes = http.get(`${baseUrl}/api/categories`, { headers })
    catalogDurationTrend.add(catRes.timings.duration)
    const catOk = check(catRes, {
      'categories status 200': (r) => r.status === 200,
      'categories data array': (r) => {
        try {
          const body = JSON.parse(r.body)
          return Array.isArray(body.data) || Array.isArray(body)
        } catch {
          return false
        }
      },
    })
    catalogErrorRate.add(!catOk)

    sleep(0.5)

    // 2. Listing produk dengan pagination awal
    const listRes = http.get(`${baseUrl}/api/products?page=1&limit=12`, { headers })
    catalogDurationTrend.add(listRes.timings.duration)
    const listOk = check(listRes, {
      'products list status 200': (r) => r.status === 200,
      'products data exists': (r) => {
        try {
          const body = JSON.parse(r.body)
          return (
            (body.status === 'success' || body.success === true) &&
            Array.isArray(body.data?.products || body.data)
          )
        } catch {
          return false
        }
      },
    })
    catalogErrorRate.add(!listOk)

    sleep(0.5)
  })

  group('Katalog ShelfStack: Filter, Pencarian, dan Sortir', function () {
    // 3. Filter berdasarkan kategori tech
    const filterRes = http.get(`${baseUrl}/api/products?category=tech`, { headers })
    catalogDurationTrend.add(filterRes.timings.duration)
    const filterOk = check(filterRes, {
      'category filter status 200': (r) => r.status === 200,
    })
    catalogErrorRate.add(!filterOk)

    sleep(0.5)

    // 4. Pencarian teks bebas
    const searchRes = http.get(`${baseUrl}/api/products?q=desk`, { headers })
    catalogDurationTrend.add(searchRes.timings.duration)
    const searchOk = check(searchRes, {
      'search status 200': (r) => r.status === 200,
    })
    catalogErrorRate.add(!searchOk)

    sleep(0.5)

    // 5. Urutkan berdasarkan harga terendah (price-low sesuai schema Zod)
    const sortRes = http.get(`${baseUrl}/api/products?sort=price-low`, { headers })
    catalogDurationTrend.add(sortRes.timings.duration)
    const sortOk = check(sortRes, {
      'sort status 200': (r) => r.status === 200,
    })
    catalogErrorRate.add(!sortOk)

    sleep(0.5)
  })
}
