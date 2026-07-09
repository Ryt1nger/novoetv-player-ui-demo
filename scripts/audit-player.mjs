import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const outDir = join(root, 'screenshots', 'audit-v4');
mkdirSync(outDir, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.json': 'application/json'
};

function serve(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let path = req.url.split('?')[0];
      if (path === '/') path = '/ui/1920/index.html';
      const file = join(root, path.replace(/^\//, ''));
      try {
        const data = readFileSync(file);
        const ext = file.slice(file.lastIndexOf('.'));
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(port, () => resolve(server));
  });
}

const STATES = [
  { name: '01-live-loading', fn: () => { AppPreview.showScreen('player'); PlayerUI.applyLiveDemo(); } },
  { name: '02-playing', fn: () => { AppPreview.showScreen('player'); PlayerUI.applyPlayingDemo(); } },
  { name: '03-paused', fn: () => { AppPreview.showScreen('player'); PlayerUI.applyPausedDemo(); } },
  { name: '04-error', fn: () => { AppPreview.showScreen('player'); PlayerUI.showError('Нет каналов в тарифе'); } },
  { name: '05-archive', fn: () => { AppPreview.showScreen('player'); AppPreview.applyPlayerState('archive'); } },
  { name: '06-fav', fn: () => { AppPreview.showScreen('player'); AppPreview.applyPlayerState('fav'); } },
  { name: '07-mini-list', fn: () => { AppPreview.showScreen('player'); AppPreview.applyPlayerState('mini-list'); } },
  { name: '08-guide', fn: () => { AppPreview.showScreen('epg'); EpgUI.applyChannelGuideDemo(); } }
];

const port = 8765;
const server = await serve(port);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await page.goto(`http://127.0.0.1:${port}/ui/1920/index.html?audit=1`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof AppPreview !== 'undefined' && typeof PlayerUI !== 'undefined');
await page.waitForTimeout(800);

for (const state of STATES) {
  await page.evaluate((fnBody) => {
    // eslint-disable-next-line no-eval
    eval('(' + fnBody + ')()');
  }, state.fn.toString());
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, `${state.name}.png`) });
  console.log('saved', state.name);
}

await browser.close();
server.close();
console.log('Audit v4 screenshots:', outDir);
