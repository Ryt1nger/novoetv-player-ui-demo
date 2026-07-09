/**
 * Lists emu vs web screenshot pairs; optionally runs pixel MAE if audit-all exists.
 */
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const emuDir = join(root, 'screenshots', 'apk-4.000', 'emu-scan');
const webDir = join(root, 'screenshots', 'audit-all');

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

let allOk = true;
for (const [emu, web] of PAIRS) {
  const ok = existsSync(join(emuDir, emu)) && existsSync(join(webDir, web));
  if (!ok) allOk = false;
  console.log(`${ok ? '✓' : '✗'} ${emu} ↔ ${web}`);
}

if (allOk && process.argv.includes('--mae')) {
  console.log('\nRunning pixel MAE…');
  const r = spawnSync('node', ['scripts/pixel-diff-mae.mjs'], { cwd: root, stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
