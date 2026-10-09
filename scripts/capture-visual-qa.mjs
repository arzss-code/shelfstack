import { chromium } from 'playwright'
import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const screenshotsDir = path.join(rootDir, 'tests', 'screenshots')

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

const PORT = 3000
const BASE_URL = `http://127.0.0.1:${PORT}`

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  let lastErr = null
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`${url}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve(true)
        } else {
          retry()
        }
      })
      req.on('error', (err) => {
        lastErr = err
        retry()
      })
      req.setTimeout(2000, () => {
        req.destroy()
        retry()
      })
    }

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timeout waiting for server at ${url}. Last error: ${lastErr ? lastErr.message : 'none'}`))
      } else {
        setTimeout(check, 500)
      }
    }

    check()
  })
}

async function run() {
  const nodeArgs = []
  if (fs.existsSync(path.join(rootDir, '.env'))) {
    nodeArgs.push('--env-file=.env')
  }
  nodeArgs.push('.output/server/index.mjs')

  const serverProcess = spawn('node', nodeArgs, {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: '127.0.0.1',
      NITRO_PORT: String(PORT),
      NITRO_HOST: '127.0.0.1',
    },
    stdio: 'inherit',
  })

  try {
    await waitForServer(BASE_URL)
    console.log('2. Server ready at', BASE_URL)

    console.log('3. Launching Playwright Chromium...')
    const browser = await chromium.launch({ headless: true })

    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    })
    const desktopPage = await desktopContext.newPage()

    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    })
    const mobilePage = await mobileContext.newPage()

    console.log('4. Capturing Homepage screenshots...')
    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
    await desktopPage.waitForTimeout(1000)
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop-home.png'),
      fullPage: true,
    })

    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(1000)
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'mobile-home.png'),
      fullPage: true,
    })

    console.log('5. Capturing Katalog screenshots...')
    await desktopPage.goto(`${BASE_URL}/katalog`, { waitUntil: 'networkidle' })
    await desktopPage.waitForTimeout(1000)
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop-catalog.png'),
      fullPage: true,
    })

    await mobilePage.goto(`${BASE_URL}/katalog`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(1000)
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'mobile-catalog.png'),
      fullPage: true,
    })

    console.log('6. Capturing Product Detail & Gallery screenshots...')
    // Ambil tautan produk pertama dari halaman katalog jika ada, atau buka /product/1
    const firstProductLink = await desktopPage.$('a[href*="/product/"]')
    const productUrl = firstProductLink
      ? await firstProductLink.getAttribute('href')
      : '/product/1'

    const fullProductUrl = productUrl.startsWith('http') ? productUrl : `${BASE_URL}${productUrl}`
    await desktopPage.goto(fullProductUrl, { waitUntil: 'networkidle' })
    await desktopPage.waitForTimeout(1000)
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop-product-detail.png'),
      fullPage: true,
    })

    await mobilePage.goto(fullProductUrl, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(1000)
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'mobile-product-detail.png'),
      fullPage: true,
    })

    console.log('7. Capturing Cart screenshots...')
    await desktopPage.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' })
    await desktopPage.waitForTimeout(1000)
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop-cart.png'),
      fullPage: true,
    })

    await mobilePage.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(1000)
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'mobile-cart.png'),
      fullPage: true,
    })

    console.log('8. Capturing Checkout & Saved Addresses screenshots...')
    await desktopPage.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' })
    await desktopPage.waitForTimeout(1000)
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop-checkout.png'),
      fullPage: true,
    })

    await mobilePage.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(1000)
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'mobile-checkout.png'),
      fullPage: true,
    })

    console.log('9. Capturing Orders screenshots...')
    await desktopPage.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' })
    await desktopPage.waitForTimeout(1000)
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop-orders.png'),
      fullPage: true,
    })

    await mobilePage.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(1000)
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'mobile-orders.png'),
      fullPage: true,
    })

    console.log('10. Authenticating as Admin (admin@shelfstack.local)...')
    try {
      await desktopPage.goto(`${BASE_URL}/auth/login?redirect=/admin`, { waitUntil: 'networkidle' })
      const emailInput = desktopPage.locator('input[placeholder="nama@email.com"]')
      if (await emailInput.isVisible({ timeout: 4000 })) {
        await emailInput.fill('admin@shelfstack.local')
        await desktopPage.locator('input[type="password"]').fill('Password123!')
        await desktopPage.locator('form button:has-text("Masuk")').click()
        await desktopPage.waitForTimeout(3000)
      }
      const cookies = await desktopContext.cookies()
      if (cookies.length > 0) {
        await mobileContext.addCookies(cookies)
      }
    } catch (authErr) {
      console.log('Admin login attempt note:', authErr.message)
    }

    console.log('11. Capturing Admin Dashboard screenshots...')
    await desktopPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' })
    await desktopPage.waitForTimeout(1000)
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop-admin-dashboard.png'),
      fullPage: true,
    })

    await mobilePage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(1000)
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'mobile-admin-dashboard.png'),
      fullPage: true,
    })

    console.log('12. Capturing Admin Products & Stock Movements Modal screenshots...')
    await desktopPage.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle' })
    await desktopPage.waitForTimeout(1000)
    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'desktop-admin-products.png'),
      fullPage: true,
    })

    await mobilePage.goto(`${BASE_URL}/admin/products`, { waitUntil: 'networkidle' })
    await mobilePage.waitForTimeout(1000)
    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'mobile-admin-products.png'),
      fullPage: true,
    })

    // Coba trigger Stock Movements Modal jika ada tombol
    const stockBtn = await desktopPage.$('button[aria-label*="Mutasi"], button:has(.pi-history), button:has-text("Mutasi")')
    if (stockBtn) {
      console.log('Found Mutasi Stok button, clicking to trigger modal...')
      await stockBtn.click()
      await desktopPage.waitForTimeout(1000)
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'desktop-admin-stock-movement-modal.png'),
        fullPage: true,
      })
    } else {
      console.log('No direct Mutasi Stok button clicked, saving view.')
    }

    await browser.close()
    console.log('12. Visual QA screenshots captured successfully in tests/screenshots!')
  } finally {
    serverProcess.kill('SIGTERM')
  }
}

run().catch((err) => {
  console.error('Visual QA run error:', err)
  process.exit(1)
})
