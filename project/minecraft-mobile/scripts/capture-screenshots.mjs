import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.URL || 'http://127.0.0.1:5175/?screenshot=1';
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

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for React to mount something under #root
  await page.waitForSelector('#root', { timeout: 60000 });
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    return root && root.children && root.children.length > 0;
  }, { timeout: 60000 });

  // Give it time to render chunks / loading screen
  await new Promise(r => setTimeout(r, 4000));

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

