import type { H3Event } from 'h3'

export function getDeviceInfo(event: H3Event) {
  const headers = getRequestHeaders(event)

  // Get IP Address
  // Vercel / Cloudflare use x-forwarded-for, otherwise fallback to connection remote address
  let ipAddress =
    headers['x-forwarded-for']?.toString().split(',')[0] ||
    headers['x-real-ip']?.toString() ||
    event.node.req.socket.remoteAddress ||
    'Unknown'

  if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
    ipAddress = '127.0.0.1 (Localhost)'
  }

  const userAgent = headers['user-agent'] || 'Unknown'

  // Extremely basic parsing for browser and platform just to fulfill requirements
  // In a real prod app, use a library like 'ua-parser-js'
  let browser = 'Unknown'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  let platform = 'Unknown'
  if (userAgent.includes('Windows')) platform = 'Windows'
  else if (userAgent.includes('Mac')) platform = 'MacOS'
  else if (userAgent.includes('Linux')) platform = 'Linux'
  else if (userAgent.includes('Android')) platform = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'iOS'

  return {
    ipAddress,
    browser,
    platform,
  }
}
