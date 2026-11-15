/**
 * Validasi signature fisik (magic bytes) berkas gambar untuk mencegah
 * spoofing Content-Type dan upload skrip berbahaya.
 */
export function detectImageMagicBytes(
  buffer: Uint8Array | Buffer,
): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (!buffer || buffer.length < 12) return null

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }

  // PNG: 89 50 4E 47 (0x89 'P' 'N' 'G')
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png'
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp'
  }

  return null
}
