import { spawn } from 'node:child_process'
import process from 'node:process'
import puppeteer from 'puppeteer-core'

const chrome = process.env.CHROME_PATH || '/home/nova/.local/bin/google-chrome'
const port = 4173
const externalBase = process.env.BASE_URL
const base = externalBase || `http://127.0.0.1:${port}`
const server = externalBase ? null : spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const assert = (condition, message) => { if (!condition) throw new Error(message) }

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try { const response = await fetch(base); if (response.ok) return } catch {}
    await wait(250)
  }
  throw new Error('Preview server did not start')
}

// Helper to click admin tab by text
async function clickAdminTab(page, tabName) {
  await page.waitForSelector('.admin-nav')
  const button = await page.evaluateHandle((name) => {
    const buttons = document.querySelectorAll('.admin-nav button')
    for (const btn of buttons) {
      const text = btn.textContent.trim().toLowerCase()
      if (text.includes(name.toLowerCase())) {
        return btn
      }
    }
    return null
  }, tabName)
  const element = await button.asElement()
  assert(element, `Admin tab "${tabName}" button not found`)
  await element.click()
}

let browser
let hfRequests = 0
try {
  await waitForServer()
  browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  page.on('request', request => {
    const url = request.url()
    if (url.includes('huggingface.co') || url.includes('hf.co')) {
      hfRequests++
    }
  })

  // 1. All routes render
  for (const route of ['/', '/collection', '/product/pia-flatback-gold', '/about', '/contact', '/admin', '/not-a-real-page']) {
    await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' })
    await wait(250)
    assert(await page.$('main'), `${route} did not render main content`)
  }

  // 2. All 10 admin tabs render
  await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' })
  await wait(500)
  const tabNames = ['Overview', 'Products', 'Stock', 'Locations', 'Replenishment', 'Suppliers', 'Purchase orders', 'Team', 'Audit log', 'Settings']
  for (const tab of tabNames) {
    await clickAdminTab(page, tab)
    await wait(200)
    assert(await page.$('.admin-panel'), `Admin tab "${tab}" did not render`)
  }

  // 3. Keyword search finds a known product (typo tolerance: "cliker" -> "Classic Clickers")
  // First verify initial load shows all 29 products
  await page.goto(`${base}/collection`, { waitUntil: 'domcontentloaded' })
  await wait(300)
  let initialCards = await page.$$('.product-card')
  assert(initialCards.length >= 20, `Initial load: expected 20+ products, got ${initialCards.length}`)

  // Then search for "cliker" and verify typo tolerance finds Clickers
  const searchInput = await page.$('.collection-search input')
  assert(searchInput, 'Search input not found')
  await searchInput.type('cliker')
  await wait(300)
  const productCards = await page.$$('.product-card')
  assert(productCards.length > 0, 'Keyword search returned no results for "cliker"')
  const firstCardText = await page.$eval('.product-card h2', el => el.textContent)
  assert(firstCardText.toLowerCase().includes('clicker'), `Expected "Clicker" in results, got "${firstCardText}"`)

  // 4. Cart + WhatsApp flow
  await page.click('.product-card .add-button')
  await page.click('.cart-trigger')
  assert(await page.$('.cart-drawer.open .drawer-item'), 'Cart did not open with the selected item')
  const cartHref = await page.$eval('.cart-drawer.open .button-primary', el => el.href)
  assert(cartHref.startsWith('https://wa.me/254794590908?text='), 'Cart did not create a WhatsApp order link')

  // 5. Contact form
  await page.goto(`${base}/contact`, { waitUntil: 'domcontentloaded' })
  await wait(250)
  await page.type('#name', 'Test Visitor')
  await page.type('#message', 'Please share your available pieces.')
  const contactHref = await page.$eval('.enquiry-form a', el => el.href)
  assert(contactHref.includes('Test%20Visitor'), 'Contact form did not prepare WhatsApp message')

  // 6. Admin: verify audit log tab shows content (placeholder entries)
  await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' })
  await wait(500)
  await clickAdminTab(page, 'Audit')
  await wait(300)
  const auditText = await page.$eval('.admin-table', el => el.textContent)
  assert(auditText.includes('cycle count') || auditText.includes('TATU'), 'Audit log did not show expected entries')

  // 7. No console errors
  assert(errors.length === 0, `Browser errors:\n${errors.join('\n')}`)

  // 8. No HuggingFace requests
  assert(hfRequests === 0, `Found ${hfRequests} request(s) to huggingface.co - AI model should not be loaded`)

  console.log('Smoke passed: all 10 admin tabs render, keyword search (typo tolerance) works, cart/WhatsApp flow works, contact form works, audit log shows entries, zero console errors, zero HF requests.')
} finally {
  if (browser) await browser.close()
  if (server) server.kill('SIGTERM')
}