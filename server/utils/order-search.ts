const FULL_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HEX_UUID_PREFIX_REGEX =
  /^[0-9a-f]{4,8}(-[0-9a-f]{0,4}(-[0-9a-f]{0,4}(-[0-9a-f]{0,4}(-[0-9a-f]{0,12})?)?)?)?$/i

function formatUuidFromHex(hex32: string): string {
  return [
    hex32.slice(0, 8),
    hex32.slice(8, 12),
    hex32.slice(12, 16),
    hex32.slice(16, 20),
    hex32.slice(20, 32),
  ].join('-')
}

/**
 * Build a PostgREST `.or()` filter expression for admin order searches without
 * running `ilike` against the `uuid` primary key column.
 */
export function buildAdminOrderSearchFilter(rawSearch: string): string | null {
  const trimmed = rawSearch.trim()
  if (!trimmed) return null

  const uuidCandidate = trimmed.startsWith('#') ? trimmed.slice(1).trim() : trimmed
  const clauses: string[] = []

  if (FULL_UUID_REGEX.test(uuidCandidate)) {
    clauses.push(`id.eq.${uuidCandidate.toLowerCase()}`)
  } else if (HEX_UUID_PREFIX_REGEX.test(uuidCandidate)) {
    const hexOnly = uuidCandidate.replace(/-/g, '').toLowerCase()
    if (hexOnly.length >= 4 && hexOnly.length <= 31) {
      const minUuid = formatUuidFromHex(hexOnly.padEnd(32, '0'))
      const maxUuid = formatUuidFromHex(hexOnly.padEnd(32, 'f'))
      clauses.push(`and(id.gte.${minUuid},id.lte.${maxUuid})`)
    }
  }

  const textSource = trimmed.startsWith('#') ? uuidCandidate : trimmed
  const safeText = textSource
    .replace(/[,()%_\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (safeText) {
    clauses.push(`address->>name.ilike.%${safeText}%`)
  }

  return clauses.length > 0 ? clauses.join(',') : null
}
