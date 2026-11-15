import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rawBaseUrl =
    (config.public?.siteUrl as string) ||
    (config.appUrl as string) ||
    process.env.APP_URL ||
    'https://shelfstack.atsiilaarya.me'
  const baseUrl = rawBaseUrl.replace(/\/+$/, '')
  const currentDate = new Date().toISOString().split('T')[0]

  // 1. Rute statis kurasi etalase publik
  const urls: SitemapUrl[] = [
    { loc: `${baseUrl}/`, lastmod: currentDate, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/katalog`, lastmod: currentDate, changefreq: 'daily', priority: 0.9 },
    { loc: `${baseUrl}/promos`, lastmod: currentDate, changefreq: 'daily', priority: 0.8 },
    { loc: `${baseUrl}/c/tech`, lastmod: currentDate, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/c/home`, lastmod: currentDate, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/c/furniture`, lastmod: currentDate, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/c/lifestyle`, lastmod: currentDate, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/c/stationery`, lastmod: currentDate, changefreq: 'weekly', priority: 0.8 },
    { loc: `${baseUrl}/about`, lastmod: currentDate, changefreq: 'monthly', priority: 0.6 },
    { loc: `${baseUrl}/contact`, lastmod: currentDate, changefreq: 'monthly', priority: 0.6 },
    { loc: `${baseUrl}/help`, lastmod: currentDate, changefreq: 'monthly', priority: 0.6 },
    { loc: `${baseUrl}/tracking`, lastmod: currentDate, changefreq: 'monthly', priority: 0.6 },
  ]

  // 2. Ambil produk aktif dari Supabase database
  try {
    const client = await serverSupabaseClient<Database>(event)
    const { data: products } = await client
      .from('products')
      .select('id, slug, created_at')
      .is('deleted_at', null)
      .order('id', { ascending: true })

    if (products && products.length > 0) {
      for (const product of products) {
        const identifier = product.slug || String(product.id)
        const rawDate = product.created_at || currentDate
        const dateOnly = rawDate ? rawDate.split('T')[0] : currentDate

        urls.push({
          loc: `${baseUrl}/product/${identifier}`,
          lastmod: dateOnly,
          changefreq: 'weekly',
          priority: 0.7,
        })
      }
    }
  } catch {
    // Graceful fallback jika koneksi database offline atau lingkungan test
  }

  // 3. Bangun string XML sitemap berstandar sitemaps.org
  const xmlEntries = urls
    .map((item) => {
      const parts = [`<loc>${escapeXml(item.loc)}</loc>`]
      if (item.lastmod) parts.push(`<lastmod>${item.lastmod}</lastmod>`)
      parts.push(`<changefreq>${item.changefreq}</changefreq>`)
      parts.push(`<priority>${item.priority.toFixed(1)}</priority>`)
      return `  <url>\n    ${parts.join('\n    ')}\n  </url>`
    })
    .join('\n')

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=86400')
  return xmlContent
})
