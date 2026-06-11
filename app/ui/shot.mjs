// usage: node shot.mjs <url> <out.png> [width] [height]
// drives installed Chrome via playwright-core for true mobile viewports
import { chromium } from 'playwright-core'

const [url, out, w = '390', h = '844'] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {})
await page.waitForTimeout(1500)
const overflow = await page.evaluate(() => {
  const bad = []
  document.querySelectorAll('*').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.right > window.innerWidth + 1) {
      bad.push(`${el.tagName}.${String(el.className).slice(0, 60)} r=${Math.round(r.right)}`)
    }
  })
  return bad.slice(0, 8)
})
await page.screenshot({ path: out })
console.log(JSON.stringify({ errors, overflow }, null, 1))
await browser.close()
