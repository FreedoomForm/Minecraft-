import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';

const urlProd = process.env.URL || 'http://127.0.0.1:5175/?screenshot=1';
const urlDev = 'http://127.0.0.1:5173/?screenshot=1';
const outDir = path.resolve(process.cwd(), 'screenshots');

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=swiftshader',
      '--ignore-gpu-blocklist',
      '--enable-webgl',
      '--allow-insecure-localhost'
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  page.on('console', (msg) => {
    const text = msg.text();
    if (/error|warn|Глобальная ошибка/i.test(text)) {
      console.log('[browser]', text);
    }
  });

  let loaded = false;
  for (const targetUrl of [urlProd, urlDev]) {
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('#root', { timeout: 15000 });
      await page.evaluate(() => { document.getElementById('splash')?.remove(); });
      // Give app time to mount and render
      await new Promise(r => setTimeout(r, 2000));
      // Try to detect a canvas
      await page.waitForSelector('canvas', { timeout: 8000 });
      loaded = true;
      break;
    } catch (e) {
      // Try next targetUrl
    }
  }

  if (!loaded) {
    // Still try with whatever is on screen (likely splash/background)
    await page.evaluate(() => { document.getElementById('splash')?.remove(); });
    await new Promise(r => setTimeout(r, 1000));
  }

  // Try to ensure canvas shows scene (not flat white/sky). Wait up to ~10s.
  for (let i = 0; i < 7; i++) {
    // Simulate a tap to trigger r3f pointer events if needed
    await page.mouse.click(640, 360, { delay: 10 });
    const isUniformWhite = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return true;
      const w = Math.min(320, c.width), h = Math.min(180, c.height);
      const tmp = document.createElement('canvas');
      tmp.width = w; tmp.height = h;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(c, 0, 0, w, h);
      const data = tctx.getImageData(0, 0, w, h).data;
      let sum = 0, sumSq = 0;
      for (let p = 0; p < data.length; p += 4) {
        const r = data[p], g = data[p + 1], b = data[p + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        sum += lum; sumSq += lum * lum;
      }
      const n = data.length / 4;
      const mean = sum / n;
      const variance = (sumSq / n) - (mean * mean);
      // Consider "bad" if mean is very bright and variance very low (flat)
      return mean > 230 && variance < 50;
    });
    if (!isUniformWhite) break;
    await new Promise(r => setTimeout(r, 1500));
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const fullPath = path.join(outDir, `game-${ts}.png`);
  await page.screenshot({ path: fullPath, fullPage: false });
  await browser.close();

  console.log('Saved screenshot:', fullPath);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

