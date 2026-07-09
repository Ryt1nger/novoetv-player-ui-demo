import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const outDir = join(root, 'screenshots', 'audit-epg');
mkdirSync(outDir, { recursive: true });

const server = createServer((req, res) => {
  let path = req.url.split('?')[0];
  if (path === '/') path = '/ui/1920/epg.html';
  try {
    res.writeHead(200);
    res.end(readFileSync(join(root, path.replace(/^\//, ''))));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

await new Promise((r) => server.listen(8768, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://127.0.0.1:8768/ui/1920/epg.html?audit=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof EpgUI !== 'undefined');

const shots = [
  { name: '01-demo', fn: 'EpgUI.applyDemo()' },
  { name: '02-loading', fn: 'EpgUI.applyLoadingDemo()' },
  { name: '03-empty', fn: 'EpgUI.applyEmptyDemo()' },
  { name: '04-focus-days', fn: "EpgUI.applyDemo(); EpgUI.setFocusedColumn('days')" }
];

for (const s of shots) {
  await page.evaluate((fn) => { eval(fn); }, s.fn);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(outDir, s.name + '.png') });
  console.log('saved', s.name);
}

server.close();
await browser.close();
console.log('Audit:', outDir);
