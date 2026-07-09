import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const server = createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/ui/1920/epg.html';
  try {
    res.end(readFileSync(join(root, p.replace(/^\//, ''))));
  } catch {
    res.writeHead(404);
    res.end('');
  }
});

await new Promise((r) => server.listen(8770, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://127.0.0.1:8770/ui/1920/epg.html?audit=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof EpgUI !== 'undefined');
await page.evaluate(() => EpgUI.applyDemo());

const metrics = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) };
  };
  const list = document.querySelector('#epg-list');
  return {
    screen: pick('#epg-screen'),
    days: pick('#epg-screen .list.days'),
    epg: pick('#epg-screen .list.epg'),
    epgList: pick('#epg-list'),
    programCount: list ? list.querySelectorAll('li').length : 0,
    lastProgram: pick('#epg-list li:last-child')
  };
});
console.log(JSON.stringify(metrics, null, 2));
server.close();
await browser.close();
