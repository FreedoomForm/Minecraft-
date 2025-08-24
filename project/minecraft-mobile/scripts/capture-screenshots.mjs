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

