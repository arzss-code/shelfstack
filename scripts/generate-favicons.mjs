import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const svgContent = fs.readFileSync(path.resolve('public/favicon.svg'), 'utf-8')
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: transparent; display: flex; align-items: center; justify-content: center; }
    svg { width: 100%; height: 100%; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`

async function main() {
  const browser = await chromium.launch()
  
  // 1. Render 32x32 PNG
  const page32 = await browser.newPage({ viewport: { width: 32, height: 32 }, deviceScaleFactor: 1 })
  await page32.setContent(html)
  const png32 = await page32.screenshot({ omitBackground: true, type: 'png' })
  fs.writeFileSync(path.resolve('public/favicon-32x32.png'), png32)
  await page32.close()

  // 2. Render 180x180 Apple Touch Icon
  const page180 = await browser.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 })
  await page180.setContent(html)
  const png180 = await page180.screenshot({ omitBackground: true, type: 'png' })
  fs.writeFileSync(path.resolve('public/apple-touch-icon.png'), png180)
  await page180.close()

  await browser.close()

  // 3. Package 32x32 PNG into a valid ICO file
  // ICO header: 6 bytes
  const header = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00])
  // Directory entry: 16 bytes
  const entry = Buffer.alloc(16)
  entry.writeUInt8(32, 0) // width (32)
  entry.writeUInt8(32, 1) // height (32)
  entry.writeUInt8(0, 2)  // colors (0 = no palette)
  entry.writeUInt8(0, 3)  // reserved
  entry.writeUInt16LE(1, 4) // color planes
  entry.writeUInt16LE(32, 6) // bits per pixel (32-bit RGBA)
  entry.writeUInt32LE(png32.length, 8) // image size in bytes
  entry.writeUInt32LE(22, 12) // offset (6 + 16 = 22)

  const icoBuffer = Buffer.concat([header, entry, png32])
  fs.writeFileSync(path.resolve('public/favicon.ico'), icoBuffer)

  console.log('Favicons generated successfully!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
