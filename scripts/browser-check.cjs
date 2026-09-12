// Optional: npm install --prefix .tools/browser --no-save playwright
const { chromium } = require('../.tools/browser/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const artifacts = path.resolve(__dirname, '../artifacts');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const wasm = [];
    page.on('response', response => { if (response.url().includes('.wasm')) wasm.push(response.url()); });
    await page.goto(process.env.APP_URL || 'http://localhost:5080', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { level: 1, name: 'Hello World', exact: true }).waitFor();
    // FocusOnNavigate runs after the WebAssembly router becomes interactive.
    await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
    assert.ok(wasm.length > 0, 'WebAssembly must load');
    results.push('PASS: Hello World rendered with MudBlazor; the WebAssembly router started.');
    for (const [label, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
      await page.setViewportSize(viewport);
      const visible = await page.evaluate(() => {
        const heading = document.querySelector('h1');
        const rect = heading.getBoundingClientRect();
        const style = getComputedStyle(heading);
        return {
          text: document.body.innerText.trim(), color: style.color, fontSize: style.fontSize,
          x: rect.x + rect.width / 2, y: rect.y + rect.height / 2,
          width: innerWidth, height: innerHeight,
          overflow: document.documentElement.scrollWidth > innerWidth
        };
      });
      assert.equal(visible.text, 'Hello World');
      assert.equal(visible.color, 'rgb(0, 0, 0)');
      assert.equal(visible.fontSize, '32px');
      assert.ok(Math.abs(visible.x - visible.width / 2) < 1);
      assert.ok(Math.abs(visible.y - visible.height / 2) < 1);
      assert.equal(visible.overflow, false);
      await page.screenshot({ path: path.join(artifacts, label + '.png'), fullPage: true, animations: 'disabled' });
      results.push('PASS: ' + label + ' shows only Hello World, centered in black at 32px, without overflow.');
    }
    assert.deepEqual(errors, []);
    results.push('PASS: No unhandled browser exceptions.');
    fs.writeFileSync(path.join(artifacts, 'browser-check.txt'), new Date().toISOString() + '\n' + results.join('\n') + '\n');
    console.log(results.join('\n'));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
