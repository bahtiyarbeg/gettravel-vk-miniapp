import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5177/';
const browser = await chromium.launch({ headless: true, ...(process.env.PW_BROWSER_CHANNEL ? { channel: process.env.PW_BROWSER_CHANNEL } : {}) });
const source = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
  await page.clock.install();
  await page.route('**/src/main.js*', route => route.fulfill({
    contentType: 'text/javascript',
    body: source.replace("from '@vkontakte/vk-bridge'", "from '/src/bridge-test.js'")
      .replace("from 'lucide'", "from '/node_modules/.vite/deps/lucide.js'")
      .replace("from './config.js'", "from '/src/config.js'")
      .replace("import './style.css';", "import '/src/style.css';")
  }));
  await page.route('**/src/bridge-test.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: `export default {
      isWebView: () => false,
      subscribe: fn => { window.vkConfig = fn; },
      unsubscribe: () => {},
      send: method => { window.vkMethod = method; return new Promise((resolve, reject) => {
        window.vkResolve = resolve; window.vkReject = reject;
      }); }
    };`
  }));
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let delayed = true;
  await page.route('https://gettravel.asia/**', async route => {
    if (delayed) await gate;
    await route.fulfill({ contentType: 'text/html', body: '<html><body><h1>Test website</h1><a href="/tours">Tours</a></body></html>' }).catch(() => {});
  });
  await page.goto(base + '?vk_app_id=1&vk_platform=desktop_web', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.vkResolve);
  assert.equal(await page.evaluate(() => window.vkMethod), 'VKWebAppInit');
  await page.clock.fastForward(16000);
  assert.match(await page.locator('#notice').innerText(), /дольше обычного/);
  await page.evaluate(() => window.vkResolve({ result: true }));
  assert.match(await page.locator('#notice').innerText(), /дольше обычного/);
  delayed = false;
  release();
  await page.frameLocator('#website').locator('h1').waitFor();
  await page.waitForFunction(() => document.querySelector('#notice').hidden);
  await context.setOffline(true);
  await page.waitForFunction(() => !navigator.onLine);
  assert.match(await page.locator('#notice').innerText(), /Нет подключения/);
  await page.evaluate(() => window.vkConfig({ detail: { type: 'VKWebAppUpdateConfig', data: { appearance: 'dark', insets: { top: 44, bottom: 34, left: 0, right: 0 } } } }));
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.locator('.toolbar').evaluate(el => getComputedStyle(el).paddingTop), '44px');
  await page.evaluate(() => window.vkConfig({ detail: { type: 'VKWebAppUpdateConfig' } }));
  await context.setOffline(false);
  await page.waitForFunction(() => navigator.onLine);
  await page.waitForFunction(() => document.querySelector('#notice').hidden);
  for (let n = 0; n < 4; n++) await page.locator('#reload').click();
  await page.frameLocator('#website').locator('h1').waitFor();
  assert.equal(await page.locator('#website').count(), 1);
  await page.clock.fastForward(16000);
  assert.equal(await page.locator('#notice').isHidden(), true);
  for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }, { width: 320, height: 640 }]) {
    await page.setViewportSize(viewport);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('.toolbar svg').count(), 3);
    const toolbar = await page.locator('.toolbar').boundingBox();
    const frame = await page.locator('#website').boundingBox();
    assert.ok(frame.y >= toolbar.y + toolbar.height);
  }
  await page.goto(base + '?vk_app_id=1&vk_platform=desktop_web', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.vkReject);
  await context.setOffline(true);
  await page.waitForFunction(() => !navigator.onLine);
  await page.evaluate(() => window.vkReject(new Error('test rejection')));
  assert.match(await page.locator('#notice').innerText(), /Нет подключения/);
  await context.setOffline(false);
  await page.waitForFunction(() => navigator.onLine);
  assert.match(await page.locator('#notice').innerText(), /Не удалось подключиться/);
  assert.deepEqual(errors, []);
  await context.close();
  console.log('PASS: slow and late loads, VK init success/failure, offline priority, themes, insets, malformed config, rapid resets, desktop/mobile layout.');
} finally { await browser.close(); }
