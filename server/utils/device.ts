import { getRequestHeaders, type H3Event } from 'h3'

function readSafeHeaders(event: H3Event): Record<string, string | string[] | undefined> {
  try {
    return (getRequestHeaders(event) as Record<string, string | string[] | undefined>) || {}
  } catch {
    return (
      (event?.node?.req?.headers as Record<string, string | string[] | undefined> | undefined) || {}
    )
  }
}

export function getDeviceInfo(event: H3Event) {
  const headers = readSafeHeaders(event)

  const forwarded = headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
  const cfIp = headers['cf-connecting-ip']?.toString().trim()
  const realIp = headers['x-real-ip']?.toString().trim()
  const socketIp = event?.node?.req?.socket?.remoteAddress?.trim()

  let ipAddress = cfIp || forwarded || realIp || socketIp || 'Tidak tercatat'
  if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1' || ipAddress === '127.0.0.1') {
    ipAddress = '127.0.0.1 (Localhost)'
  } else if (ipAddress.startsWith('::ffff:')) {
    ipAddress = ipAddress.slice(7)
  }

  const userAgent = headers['user-agent']?.toString() || ''

  let browser = 'Tidak dikenal'
  if (!userAgent) {
    browser = 'Tidak tercatat'
  } else if (userAgent.includes('Edg/') || userAgent.includes('Edge')) {
    browser = 'Edge'
  } else if (userAgent.includes('OPR/') || userAgent.includes('Opera')) {
    browser = 'Opera'
  } else if (userAgent.includes('SamsungBrowser')) {
    browser = 'Samsung Internet'
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox'
  } else if (userAgent.includes('Chrome') || userAgent.includes('CriOS')) {
    browser = 'Chrome'
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari'
  } else if (userAgent.includes('HeadlessChrome')) {
    browser = 'Headless Chrome'
  }

  let platform = 'Tidak dikenal'
  if (!userAgent) {
    platform = 'Tidak tercatat'
  } else if (userAgent.includes('Android')) {
    platform = 'Android'
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    platform = 'iOS'
  } else if (userAgent.includes('Windows')) {
    platform = 'Windows'
  } else if (userAgent.includes('Mac')) {
    platform = 'macOS'
  } else if (userAgent.includes('Linux')) {
    platform = 'Linux'
  }

  return {
    ipAddress,
    browser,
    platform,
  }
}
