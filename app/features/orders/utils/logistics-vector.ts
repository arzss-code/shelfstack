/**
 * Logistics Vector Generator
 * Pure TypeScript SVG rendering for Code 128 shipping barcodes and transaction QR verification.
 * Zero external runtime dependencies.
 */

import { encodeQrMatrix } from './qr-encoder'

// Code 128 pattern table (module widths for 107 symbols: 6 widths per pattern + stop code)
const CODE128_PATTERNS: readonly string[] = [
  '212222',
  '222122',
  '222221',
  '121223',
  '121322',
  '131222',
  '122213',
  '122312',
  '132212',
  '221213',
  '221312',
  '231212',
  '112232',
  '122132',
  '122231',
  '113222',
  '123122',
  '123221',
  '223211',
  '221132',
  '221231',
  '213212',
  '223112',
  '312131',
  '311222',
  '321122',
  '321221',
  '312212',
  '322112',
  '322211',
  '212123',
  '212321',
  '232121',
  '111323',
  '131123',
  '131321',
  '112313',
  '132113',
  '132311',
  '211313',
  '231113',
  '231311',
  '112133',
  '112331',
  '132131',
  '113123',
  '113321',
  '133121',
  '313121',
  '211331',
  '231131',
  '213113',
  '213311',
  '213131',
  '311123',
  '311321',
  '331121',
  '312113',
  '312311',
  '332111',
  '314111',
  '221411',
  '431111',
  '111224',
  '111422',
  '121124',
  '121421',
  '141122',
  '141221',
  '112214',
  '112412',
  '122114',
  '122411',
  '142112',
  '142211',
  '241211',
  '221114',
  '413111',
  '241112',
  '134111',
  '111242',
  '121142',
  '121241',
  '114212',
  '124112',
  '124211',
  '411212',
  '421112',
  '421211',
  '212141',
  '214121',
  '412121',
  '111143',
  '111341',
  '131141',
  '114113',
  '114311',
  '411113',
  '411311',
  '113141',
  '114131',
  '311141',
  '411131',
  '211412',
  '211214',
  '211232',
  '2331112',
]

const START_CODE_B = 104
const STOP_CODE = 106

export interface BarcodeSvgOptions {
  height?: number
  moduleWidth?: number
  showText?: boolean
  className?: string
}

/**
 * Render standard Code 128-B barcode as a crisp vector SVG.
 */
export function renderBarcodeSvg(rawText: string, options: BarcodeSvgOptions = {}): string {
  const text = (rawText || '').trim().replace(/[^\x20-\x7E]/g, '') || '000000'
  const height = options.height ?? 50
  const moduleWidth = options.moduleWidth ?? 2
  const showText = options.showText ?? true

  // Encode characters into code values (Subset B: ASCII 32..126 -> val 0..94)
  const values: number[] = [START_CODE_B]
  let checkSum = START_CODE_B

  for (let i = 0; i < text.length; i++) {
    const val = text.charCodeAt(i) - 32
    const safeVal = Math.max(0, Math.min(val, 94))
    values.push(safeVal)
    checkSum += safeVal * (i + 1)
  }

  values.push(checkSum % 103)
  values.push(STOP_CODE)

  // Build binary sequence: 1 = bar, 0 = space
  const bars: boolean[] = []
  // Quiet zone: 10 modules
  for (let q = 0; q < 10; q++) bars.push(false)

  for (const val of values) {
    const pattern = CODE128_PATTERNS[val] || '212222'
    let isBar = true
    for (let p = 0; p < pattern.length; p++) {
      const runLen = parseInt(pattern[p] || '1', 10)
      for (let r = 0; r < runLen; r++) {
        bars.push(isBar)
      }
      isBar = !isBar
    }
  }

  // Quiet zone: 10 modules
  for (let q = 0; q < 10; q++) bars.push(false)

  const totalModules = bars.length
  const svgWidth = totalModules * moduleWidth
  const totalHeight = showText ? height + 16 : height

  // Generate SVG rects for bars
  const rects: string[] = []
  let runStart = -1

  for (let m = 0; m <= totalModules; m++) {
    if (m < totalModules && bars[m]) {
      if (runStart === -1) runStart = m
    } else if (runStart !== -1) {
      const x = runStart * moduleWidth
      const w = (m - runStart) * moduleWidth
      rects.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="currentColor" />`)
      runStart = -1
    }
  }

  const textElement = showText
    ? `<text x="${svgWidth / 2}" y="${height + 12}" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="currentColor">${text}</text>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${totalHeight}" class="${options.className || 'w-full h-auto text-black'}" shape-rendering="crispEdges">${rects.join('')}${textElement}</svg>`
}

export interface QrSvgOptions {
  size?: number
  className?: string
  alt?: string
}

/**
 * Generate standard ISO/IEC 18004 QR code matrix SVG with Reed-Solomon Error Correction.
 * Designed for invoice verification and logistics package validation.
 */
export function renderQrCodeSvg(payloadText: string, options: QrSvgOptions = {}): string {
  const size = options.size ?? 80
  const { size: matrixSize, modules } = encodeQrMatrix(payloadText || ' ')

  const rects: string[] = []
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (modules[r]![c]) {
        rects.push(`<rect x="${c}" y="${r}" width="1" height="1" fill="currentColor" />`)
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${matrixSize} ${matrixSize}" width="${size}" height="${size}" class="${options.className || 'text-black inline-block'}" shape-rendering="crispEdges">${rects.join('')}</svg>`
}
