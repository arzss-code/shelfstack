/**
 * Master Data Wilayah Administratif Indonesia (Kepmendagri No 300.2.2-2138 Tahun 2025)
 * Mencakup 38 Provinsi, 514 Kota/Kabupaten, 7.265 Kecamatan, dan pemetaan Kode Pos nasional.
 */
import rawAdminData from './indonesia-administrative.json'

export interface Province {
  id: string
  name: string
}

export interface City {
  id: string
  provId: string
  type: 'Kota' | 'Kabupaten'
  name: string
  cleanName: string
  fullName: string
  provinceName?: string
  postalCode?: string
}

export interface District {
  id: string
  cityId: string
  name: string
  postalCodes: string[]
}

export interface AdministrativeSearchResult {
  id: string
  name: string
  provinceId: string
  provinceName: string
  cityId: string
  cityName: string
  districtId: string
  districtName: string
  postalCode: string
  displayLabel: string
}

export const INDONESIA_PROVINCES: Province[] = rawAdminData.provinces as Province[]
export const INDONESIA_CITIES: City[] = rawAdminData.cities as City[]
export const INDONESIA_DISTRICTS: District[] = rawAdminData.districts as District[]

export const POPULAR_CITIES = [
  { id: '31.74', name: 'Jakarta Selatan', fullName: 'Kota Jakarta Selatan', postal: '12110' },
  { id: '31.71', name: 'Jakarta Pusat', fullName: 'Kota Jakarta Pusat', postal: '10110' },
  { id: '32.73', name: 'Bandung', fullName: 'Kota Bandung', postal: '40115' },
  { id: '35.78', name: 'Surabaya', fullName: 'Kota Surabaya', postal: '60111' },
  { id: '32.75', name: 'Bekasi', fullName: 'Kota Bekasi', postal: '17111' },
  { id: '36.71', name: 'Tangerang', fullName: 'Kota Tangerang', postal: '15111' },
  { id: '33.74', name: 'Semarang', fullName: 'Kota Semarang', postal: '50111' },
  { id: '73.71', name: 'Makassar', fullName: 'Kota Makassar', postal: '90111' },
  { id: '12.71', name: 'Medan', fullName: 'Kota Medan', postal: '20111' },
]

const cityMap = new Map<string, City>()
const provMap = new Map<string, Province>(INDONESIA_PROVINCES.map((p) => [p.id, p]))
const districtMap = new Map<string, District>(INDONESIA_DISTRICTS.map((d) => [d.id, d]))

for (const city of INDONESIA_CITIES) {
  const prov = provMap.get(city.provId)
  city.provinceName = prov?.name || ''
  const firstDist = INDONESIA_DISTRICTS.find((d) => d.cityId === city.id)
  city.postalCode = firstDist?.postalCodes[0] || '10110'

  cityMap.set(city.id, city)
  cityMap.set(city.id.replace('.', ''), city)
}

export function getProvinces(): Province[] {
  return INDONESIA_PROVINCES
}

export function getCitiesByProvince(provinceId: string): City[] {
  return INDONESIA_CITIES.filter((c) => c.provId === provinceId)
}

export function getDistrictsByCity(cityId: string): District[] {
  const normalizedId = cityId.includes('.') ? cityId : `${cityId.slice(0, 2)}.${cityId.slice(2)}`
  return INDONESIA_DISTRICTS.filter((d) => d.cityId === normalizedId || d.cityId === cityId)
}

export function getPostalCodesByDistrict(districtId: string): string[] {
  const dist = districtMap.get(districtId)
  return dist ? dist.postalCodes : []
}

export function getCityById(cityId: string): City | undefined {
  return cityMap.get(cityId)
}

export function getDistrictById(districtId: string): District | undefined {
  return districtMap.get(districtId)
}

/**
 * Normalisasi nama kota agar tidak pernah menghasilkan duplikasi 'Kota Kota' atau 'Kabupaten Kabupaten'.
 */
export function formatCityDisplay(cityName: string, type?: string): string {
  const trimmed = cityName.trim()
  const isKab = type === 'Kabupaten' || /^(kabupaten|kab\.)/i.test(trimmed)
  let clean = trimmed
  while (/^(kota\s+administrasi|kota|kabupaten|kab\.)\s+/i.test(clean)) {
    clean = clean.replace(/^(kota\s+administrasi|kota|kabupaten|kab\.)\s+/i, '').trim()
  }
  return isKab ? `Kabupaten ${clean}` : `Kota ${clean}`
}

/**
 * Pencarian komprehensif 4-tingkat (Kecamatan, Kota, Provinsi, Kode Pos) dengan prioritas relevansi.
 */
export function searchAdministrativeLocations(
  query: string,
  limit = 25,
): AdministrativeSearchResult[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  interface ScoredResult {
    score: number
    result: AdministrativeSearchResult
  }

  const scoredResults: ScoredResult[] = []

  for (const d of INDONESIA_DISTRICTS) {
    const city = cityMap.get(d.cityId)
    const prov = city ? provMap.get(city.provId) : null
    if (!city || !prov) continue

    const distNameLower = d.name.toLowerCase()
    const cityNameLower = city.name.toLowerCase()
    const cleanCityLower = city.cleanName.toLowerCase()
    const provNameLower = prov.name.toLowerCase()

    let score = 0
    if (cityNameLower === q || cleanCityLower === q) score += 100
    else if (distNameLower === q) score += 90
    else if (cityNameLower.startsWith(q) || cleanCityLower.startsWith(q)) score += 70
    else if (distNameLower.startsWith(q)) score += 60
    else if (cityNameLower.includes(q) || cleanCityLower.includes(q)) score += 50
    else if (distNameLower.includes(q)) score += 40
    else if (provNameLower.includes(q) || (prov.id === '31' && (q === 'dki' || q === 'jakarta')))
      score += 30

    const matchPostal = d.postalCodes.some((pos) => pos.includes(q))
    if (matchPostal) score += 45

    if (score > 0) {
      for (const pos of d.postalCodes) {
        let posScore = score
        if (pos === q) posScore += 20
        else if (pos.startsWith(q)) posScore += 10

        scoredResults.push({
          score: posScore,
          result: {
            id: `${d.id}-${pos}`,
            name: city.fullName,
            provinceId: prov.id,
            provinceName: prov.name,
            cityId: city.id,
            cityName: city.fullName,
            districtId: d.id,
            districtName: d.name,
            postalCode: pos,
            displayLabel: `${d.name}, ${city.fullName}, ${prov.name} (${pos})`,
          },
        })
      }
    }
  }

  scoredResults.sort((a, b) => b.score - a.score)
  return scoredResults.slice(0, limit).map((s) => s.result)
}

/**
 * Backward compatibility searchLocations
 */
export function searchLocations(query: string, limit = 25) {
  return searchAdministrativeLocations(query, limit)
}
