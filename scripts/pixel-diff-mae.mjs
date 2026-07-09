/**
 * Mean absolute error (MAE) between emu reference and web audit screenshots.
 * Usage: node scripts/pixel-diff-mae.mjs
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const emuDir = join(root, 'screenshots', 'apk-4.000', 'emu-scan');
const webDir = join(root, 'screenshots', 'audit-all');
const outDir = join(root, 'screenshots', 'diff-mae');
mkdirSync(outDir, { recursive: true });

const PAIRS = [
  ['03-live-controller.png', '02-player-live.png'],
  ['04-player-controller.png', '03-player-archive.png'],
  ['08-paused.png', '14-player-paused.png'],
  ['12-error.png', '04-player-error.png'],
  ['09-fav-marked.png', '05-player-fav.png'],
  ['05-mini-list.png', '06-mini-list.png'],
  ['10-iptv-guide.png', '16-guide-channel-first.png'],
  ['11-iptv-dates.png', '12-guide-dates.png'],
];

function loadPng(path) {
  return PNG.sync.read(readFileSync(path));
}

function mae(a, b, y0 = 0, y1 = 1) {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const yStart = Math.floor(h * y0);
  const yEnd = Math.floor(h * y1);
  let sum = 0;
  let n = 0;
  for (let y = yStart; y < yEnd; y++) {
    for (let x = 0; x < w; x++) {
      const i = (a.width * y + x) << 2;
      const j = (b.width * y + x) << 2;
      sum += Math.abs(a.data[i] - b.data[j]);
      sum += Math.abs(a.data[i + 1] - b.data[j + 1]);
      sum += Math.abs(a.data[i + 2] - b.data[j + 2]);
      n += 3;
    }
  }
  return { mae: sum / n, w, h, sizeMismatch: a.width !== b.width || a.height !== b.height };
}

const CROP = {
  '03-live-controller.png': 0.45,
  '04-player-controller.png': 0.45,
  '08-paused.png': 0.45,
  '12-error.png': 0.35,
  '09-fav-marked.png': 0.45,
  '05-mini-list.png': 0.25,
};

const rows = [];
console.log('Pixel diff MAE (0 = identical, 255 = opposite)\n');

for (const [emu, web] of PAIRS) {
  const emuPath = join(emuDir, emu);
  const webPath = join(webDir, web);
  if (!existsSync(emuPath) || !existsSync(webPath)) {
    console.log(`✗ skip ${emu} ↔ ${web} (missing file)`);
    rows.push({ emu, web, status: 'missing' });
    continue;
  }
  const ref = loadPng(emuPath);
  const cur = loadPng(webPath);
  const cropY = CROP[emu] ?? 0;
  const full = mae(ref, cur, 0, 1);
  const crop = cropY > 0 ? mae(ref, cur, cropY, 1) : full;
  const score = full.mae;
  const pct = ((score / 255) * 100).toFixed(1);
  const cropPct = ((crop.mae / 255) * 100).toFixed(1);
  const flag = crop.mae < 35 ? '✓' : crop.mae < 50 ? '~' : '✗';
  console.log(`${flag} ${emu} ↔ ${web}: full ${score.toFixed(2)} (${pct}%) | UI ${crop.mae.toFixed(2)} (${cropPct}%) ${full.sizeMismatch ? `[size]` : ''}`);
  rows.push({ emu, web, mae: +score.toFixed(2), maeCrop: +crop.mae.toFixed(2), pct: +pct, cropPct: +cropPct, sizeMismatch: full.sizeMismatch });
}

const report = { generated: new Date().toISOString(), pairs: rows };
const reportPath = join(outDir, 'report.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log('\nReport:', reportPath);
