import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'screenshots', 'audit-all');
mkdirSync(outDir, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.json': 'application/json'
};

const server = createServer((req, res) => {
  let path = req.url.split('?')[0];
  if (path === '/') path = '/ui/1920/index.html';
  try {
    const file = join(root, path.replace(/^\//, ''));
    const ext = file.slice(file.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

await new Promise((r) => server.listen(8765, r));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://127.0.0.1:8765/ui/1920/index.html?audit=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof AppPreview !== 'undefined');
await page.evaluate(() => AppPreview.loadMocks());

const EMU_BG = '../../screenshots/apk-4.000/emu-scan/';

const shots = [
  { name: '01-player-playing', emuBg: '02-live-playing.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('playing')" },
  { name: '02-player-live', emuBg: '03-live-controller.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('playing')" },
  { name: '03-player-archive', emuBg: '04-player-controller.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('archive')" },
  { name: '04-player-error', emuBg: '12-error.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('error')" },
  { name: '05-player-fav', emuBg: '09-fav-marked.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('fav')" },
  { name: '14-player-paused', emuBg: '08-paused.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('paused')" },
  { name: '15-player-clean', emuBg: '13-player-clean.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('clean')" },
  { name: '16-guide-channel-first', fn: "AppPreview.showScreen('epg'); AppPreview.applyEpgState('channel-guide'); EpgUI.setFocusedColumn('detail')" },
  { name: '17-player-program-info', emuBg: '02-tv-guide-overlay.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('program-info')" },
  { name: '18-player-watch-toast', emuBg: '09-fav-marked.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('playing'); PlayerUI.setWatchMarked(true)" },
  { name: '06-mini-list', emuBg: '05-mini-list.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('mini-list')" },
  { name: '19-player-channel-guide', emuBg: '10-iptv-guide.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('channel-guide')" },
  { name: '07-mini-loading', emuBg: '05-mini-list.png', fn: "AppPreview.showScreen('player'); AppPreview.applyPlayerState('mini-list'); SepgUI.applyLoadingDemo()" },
  { name: '08-guide-normal', fn: "AppPreview.showScreen('epg'); AppPreview.applyEpgState('demo')" },
  { name: '09-guide-categories', fn: "AppPreview.showScreen('epg'); AppPreview.applyEpgState('demo'); EpgUI.setFocusedColumn('categories')" },
  { name: '10-guide-ch-loading', fn: "AppPreview.showScreen('epg'); AppPreview.applyEpgState('channel-loading')" },
  { name: '11-guide-empty', fn: "AppPreview.showScreen('epg'); AppPreview.applyEpgState('empty')" },
  { name: '12-guide-dates', fn: "AppPreview.showScreen('epg'); AppPreview.applyEpgState('demo'); EpgUI.showDateScreen()" },
  { name: '13-guide-detail', fn: "AppPreview.showScreen('epg'); AppPreview.applyEpgState('demo'); EpgUI.setFocusedColumn('detail')" }
];

for (const s of shots) {
  if (s.emuBg) {
    await page.evaluate(({ url }) => {
      var bg = document.getElementById('mock-video-bg');
      if (bg) bg.style.backgroundImage = 'url(' + url + ')';
    }, { url: EMU_BG + s.emuBg });
  }
  await page.evaluate((fn) => { eval(fn); }, s.fn);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, s.name + '.png') });
  console.log('saved', s.name);
}

server.close();
await browser.close();
console.log('Audit:', outDir);
