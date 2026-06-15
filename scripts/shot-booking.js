/* One-off visual + flow check for the new priced booking flow against netlify dev.
   Drives: open -> pick service -> pick date -> pick time -> fill details ->
   screenshot the confirm card. Stops BEFORE confirming (no real booking made). */
const path = require('path');
const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname);
const BASE = 'http://localhost:8888/';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1000, deviceScaleFactor: 2 });
  page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE-ERR:', m.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle0' });

  // open modal + wait for services
  await page.evaluate(() => window.openBooking());
  await page.waitForSelector('.bm-svc', { timeout: 12000 });
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, 'shot-b1-services.png') });
  const groups = await page.$$eval('.bm-svc-cat', (els) => els.map((e) => e.textContent));
  const svcCount = await page.$$eval('.bm-svc', (els) => els.length);
  console.log('SERVICE_GROUPS:', JSON.stringify(groups));
  console.log('SERVICE_COUNT:', svcCount);

  // pick "Signature manicure" ($40)
  const picked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.bm-svc')];
    const b = btns.find((x) => /signature manicure/i.test(x.textContent));
    if (b) { b.click(); return b.textContent.replace(/\s+/g, ' ').trim(); }
    return null;
  });
  console.log('PICKED:', picked);
  await page.waitForSelector('.bm-svc-chosen', { timeout: 8000 });
  await sleep(400);
  const includes = await page.$$eval('.bm-includes li', (els) => els.map((e) => e.innerText.trim()));
  console.log('INCLUDES:', JSON.stringify(includes));
  await page.screenshot({ path: path.join(OUT, 'shot-b3-includes.png') });
  await page.waitForSelector('.bm-day:not([disabled])', { timeout: 8000 });

  // try enabled days until one has open slots
  let slotFilled = false;
  const enabledDays = await page.$$eval('.bm-day:not([disabled])', (els) => els.map((_, i) => i).slice(0, 12));
  for (const idx of enabledDays) {
    await page.evaluate((i) => {
      const days = [...document.querySelectorAll('.bm-day:not([disabled])')];
      if (days[i]) days[i].click();
    }, idx);
    try {
      await page.waitForFunction(() => {
        const msg = document.querySelector('.bm-slots-msg');
        const slots = document.querySelectorAll('.bm-slot');
        return slots.length > 0 || (msg && /No open times|Couldn't/.test(msg.textContent));
      }, { timeout: 8000 });
    } catch (_) { /* keep trying */ }
    const n = await page.$$eval('.bm-slot', (els) => els.length);
    if (n > 0) {
      await page.evaluate(() => document.querySelector('.bm-slot').click());
      slotFilled = true;
      break;
    }
  }
  console.log('SLOT_PICKED:', slotFilled);

  if (slotFilled) {
    await page.waitForSelector('.bm-fields', { timeout: 8000 });
    await page.type('.bm-field:nth-child(1) input', 'Test Guest');
    await page.type('.bm-field:nth-child(2) input', '(470) 555 0123');
    await page.waitForSelector('.bm-confirm', { timeout: 5000 });
    await sleep(400);
    const confirmText = await page.$eval('.bm-confirm', (e) => e.innerText.replace(/\n/g, ' | '));
    const btnText = await page.$eval('.bm-foot .btn', (e) => e.innerText);
    const btnDisabled = await page.$eval('.bm-foot .btn', (e) => e.disabled);
    console.log('CONFIRM_CARD:', confirmText);
    console.log('CONFIRM_BTN:', JSON.stringify(btnText), 'disabled=', btnDisabled);
    await page.screenshot({ path: path.join(OUT, 'shot-b2-confirm.png') });
  }

  await browser.close();
  console.log('DONE (no booking submitted)');
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
