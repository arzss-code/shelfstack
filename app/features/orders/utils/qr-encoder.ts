/**
 * Standard QR Code ISO/IEC 18004 Byte-Mode Matrix Generator
 * Self-contained pure TypeScript implementation with Galois Field GF(256)
 * and Reed-Solomon Error Correction.
 */

export interface QrMatrixResult {
  size: number
  modules: boolean[][]
}

interface QrVersionCapacity {
  version: number
  size: number
  dataBytes: number
  ecBytes: number
  alignmentPos: number[]
}

const QR_CAPACITIES: QrVersionCapacity[] = [
  { version: 1, size: 21, dataBytes: 19, ecBytes: 7, alignmentPos: [] },
  { version: 2, size: 25, dataBytes: 34, ecBytes: 10, alignmentPos: [6, 18] },
  { version: 3, size: 29, dataBytes: 55, ecBytes: 15, alignmentPos: [6, 22] },
  { version: 4, size: 33, dataBytes: 80, ecBytes: 20, alignmentPos: [6, 26] },
  { version: 5, size: 37, dataBytes: 108, ecBytes: 26, alignmentPos: [6, 30] },
  { version: 6, size: 41, dataBytes: 136, ecBytes: 36, alignmentPos: [6, 34] },
]

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)

let gfVal = 1
for (let i = 0; i < 255; i++) {
  EXP[i] = gfVal
  EXP[i + 255] = gfVal
  LOG[gfVal] = i
  gfVal = (gfVal << 1) ^ (gfVal >= 128 ? 0x11d : 0)
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP[LOG[a]! + LOG[b]!]!
}

function getRsGenerator(numEc: number): number[] {
  let poly = [1]
  for (let i = 0; i < numEc; i++) {
    const factor = EXP[i]!
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j]!, factor)
      next[j + 1] ^= poly[j]!
    }
    poly = next
  }
  return poly
}

function computeReedSolomon(data: number[], numEc: number): number[] {
  const gen = getRsGenerator(numEc)
  const remainder = new Array(numEc).fill(0)
  for (const byte of data) {
    const factor = byte ^ remainder[0]!
    for (let j = 0; j < numEc - 1; j++) {
      remainder[j] = remainder[j + 1]! ^ gfMul(factor, gen[numEc - 1 - j]!)
    }
    remainder[numEc - 1] = gfMul(factor, gen[0]!)
  }
  return remainder
}

function selectCapacity(textBytesLength: number): QrVersionCapacity {
  // Byte mode requires 4 bits (mode) + 8 bits (char count) = 1.5 bytes -> at least +2 bytes
  const requiredDataBytes = textBytesLength + 2
  for (const cap of QR_CAPACITIES) {
    if (cap.dataBytes >= requiredDataBytes) {
      return cap
    }
  }
  return QR_CAPACITIES[QR_CAPACITIES.length - 1]!
}

class BitBuffer {
  private bits: number[] = []

  put(val: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      this.bits.push((val >> i) & 1)
    }
  }

  get length(): number {
    return this.bits.length
  }

  getBits(): number[] {
    return this.bits
  }
}

export function encodeQrMatrix(payload: string): QrMatrixResult {
  const encoder = new TextEncoder()
  const rawBytes = Array.from(encoder.encode(payload))
  const config = selectCapacity(rawBytes.length)
  const { size, dataBytes, ecBytes } = config

  const buffer = new BitBuffer()
  buffer.put(0b0100, 4) // Byte mode indicator
  buffer.put(rawBytes.length, 8) // Character count indicator (8 bits for V1-V9)
  for (const b of rawBytes) {
    buffer.put(b, 8)
  }

  // 4-bit terminator
  const maxBits = dataBytes * 8
  const terminatorLen = Math.min(4, maxBits - buffer.length)
  buffer.put(0, terminatorLen)

  // Align to byte boundary
  if (buffer.length % 8 !== 0) {
    buffer.put(0, 8 - (buffer.length % 8))
  }

  // Pad bytes 0xEC and 0x11
  const bits = buffer.getBits()
  const dataCodewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byteVal = 0
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | (bits[i + j] || 0)
    }
    dataCodewords.push(byteVal)
  }

  let padToggle = false
  while (dataCodewords.length < dataBytes) {
    dataCodewords.push(padToggle ? 0x11 : 0xec)
    padToggle = !padToggle
  }

  const ecCodewords = computeReedSolomon(dataCodewords, ecBytes)
  const fullCodewords = [...dataCodewords, ...ecCodewords]

  const modules: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))

  // 1. Finder patterns & separators
  const placeFinder = (originR: number, originC: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = originR + r
        const nc = originC + c
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue
        isFunction[nr]![nc] = true
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
          modules[nr]![nc] = isOuter || isInner
        } else {
          modules[nr]![nc] = false
        }
      }
    }
  }

  placeFinder(0, 0)
  placeFinder(0, size - 7)
  placeFinder(size - 7, 0)

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6]![i]) {
      modules[6]![i] = i % 2 === 0
      isFunction[6]![i] = true
    }
    if (!isFunction[i]![6]) {
      modules[i]![6] = i % 2 === 0
      isFunction[i]![6] = true
    }
  }

  // 3. Alignment patterns for Version >= 2
  const { alignmentPos } = config
  for (const r of alignmentPos) {
    for (const c of alignmentPos) {
      if (isFunction[r]![c]) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2
          const isCenter = dr === 0 && dc === 0
          modules[r + dr]![c + dc] = isBorder || isCenter
          isFunction[r + dr]![c + dc] = true
        }
      }
    }
  }

  // 4. Dark module & format reservations
  modules[4 * config.version + 9]![8] = true
  isFunction[4 * config.version + 9]![8] = true

  for (let i = 0; i < 9; i++) {
    isFunction[8]![i] = true
    isFunction[i]![8] = true
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8]![size - 1 - i] = true
    isFunction[size - 1 - i]![8] = true
  }

  // 5. Format info bits (EC Level L, Mask 0) = 0x77c4 ^ 0x5412 = 0x23d6
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0]
  for (let i = 0; i < 6; i++) modules[8]![i] = Boolean(formatBits[i])
  modules[8]![7] = Boolean(formatBits[6])
  modules[8]![8] = Boolean(formatBits[7])
  modules[7]![8] = Boolean(formatBits[8])
  for (let i = 9; i < 15; i++) modules[14 - i]![8] = Boolean(formatBits[i])

  for (let i = 0; i < 8; i++) modules[size - 1 - i]![8] = Boolean(formatBits[i])
  for (let i = 8; i < 15; i++) modules[8]![size - 15 + i] = Boolean(formatBits[i])

  // 6. Data module placement in 2-column zig-zag with Mask 0 ((r + c) % 2 === 0)
  const allBits: number[] = []
  for (const byte of fullCodewords) {
    for (let i = 7; i >= 0; i--) {
      allBits.push((byte >> i) & 1)
    }
  }

  let bitIdx = 0
  let upward = true
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right-- // Skip vertical timing column
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i)

    for (const r of rows) {
      for (let c = right; c >= right - 1; c--) {
        if (!isFunction[r]![c]) {
          const bitVal = bitIdx < allBits.length ? allBits[bitIdx]! : 0
          const maskInvert = (r + c) % 2 === 0
          modules[r]![c] = Boolean(bitVal ^ (maskInvert ? 1 : 0))
          bitIdx++
        }
      }
    }
    upward = !upward
  }

  return { size, modules }
}
