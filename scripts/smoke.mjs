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

let browser
try {
  await waitForServer()
  browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))

  for (const route of ['/', '/collection', '/product/pia-flatback-gold', '/about', '/contact', '/not-a-real-page']) {
    await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' })
    await wait(250)
    assert(await page.$('main'), `${route} did not render main content`)
  }

  await page.goto(`${base}/collection`, { waitUntil: 'domcontentloaded' })
  await wait(250)
  const productCards = await page.$$('.product-card')
  assert(productCards.length >= 20, 'Expected catalogue product cards')
  await page.click('.product-card .add-button')
  await page.click('.cart-trigger')
  assert(await page.$('.cart-drawer.open .drawer-item'), 'Cart did not open with the selected item')
  const cartHref = await page.$eval('.cart-drawer.open .button-primary', el => el.href)
  assert(cartHref.startsWith('https://wa.me/254794590908?text='), 'Cart did not create a WhatsApp order link')

  await page.goto(`${base}/contact`, { waitUntil: 'domcontentloaded' })
  await wait(250)
  await page.type('#name', 'Test Visitor')
  await page.type('#message', 'Please share your available pieces.')
  const contactHref = await page.$eval('.enquiry-form a', el => el.href)
  assert(contactHref.includes('Test%20Visitor'), 'Contact form did not prepare WhatsApp message')
  assert(errors.length === 0, `Browser errors:\n${errors.join('\n')}`)
  console.log('Smoke passed: routes, inventory cards, persistent cart, WhatsApp order, contact enquiry, and browser console.')
} finally {
  if (browser) await browser.close()
  if (server) server.kill('SIGTERM')
}
