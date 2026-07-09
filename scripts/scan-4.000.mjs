/**
 * Continuous scan: visual + technical + systemic vs APK 4.000.
 * Usage: node scripts/scan-4.000.mjs [--audit] [--mae]
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { PNG } from 'pngjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apkRoot = join(root, '..', 'apk-analysis', 'new-4.000');
const emuDir = join(root, 'screenshots', 'apk-4.000', 'emu-scan');
const webDir = join(root, 'screenshots', 'audit-all');
const outDir = join(root, 'screenshots', 'scan-reports');
mkdirSync(outDir, { recursive: true });

const runAudit = process.argv.includes('--audit');
const runMae = process.argv.includes('--mae') || !process.argv.includes('--no-mae');

const report = {
  generated: new Date().toISOString(),
  visual: [],
  technical: [],
  systemic: [],
  summary: { pass: 0, warn: 0, fail: 0 }
};

function add(section, item) {
  report[section].push(item);
  if (item.level === 'pass') report.summary.pass++;
  else if (item.level === 'warn') report.summary.warn++;
  else report.summary.fail++;
}

function loadText(path) {
  try { return readFileSync(path, 'utf8'); } catch { return ''; }
}

// ── Technical: DOM contract ─────────────────────────────────────────────
const REQUIRED_IDS = [
  'loading-bar', 'aspect-bar', 'playing-error-bar', 'player-screen', 'player-controller',
  'controller-gradient', 'controller-logo-badge', 'controller-logo', 'controller-panel',
  'controller-seek-block', 'controller-meta-row', 'controller-actions', 'controller-footer',
  'footer-clock', 'player-channel-icon', 'infobar-channel-name', 'infobar-program-name',
  'program-tag', 'infobar-program-time', 'infobar-program-duration', 'infobar-progress-info',
  'infobar-program-total', 'infobar-program-progress', 'infobar-program-pin',
  'controller-recycler-wrap', 'controller-recycler', 'controller-list', 'playing-error-bar-sepg',
  'iptv-guide', 'iptv-category-pane', 'iptv-category-list', 'iptv-date-screen', 'iptv-date-back',
  'iptv-date-list', 'iptv-channel-pane', 'iptv-channel-list', 'iptv-program-pane',
  'iptv-program-list', 'iptv-detail-poster', 'iptv-detail-stream', 'iptv-detail-watch',
  'iptv-detail-title', 'iptv-detail-description', 'iptv-detail-time', 'iptv-detail-rating',
  'player-toast', 'program-info-overlay', 'iptv-inline-date-list', 'iptv-inline-back'
];

const FORBIDDEN_IDS = ['tv-infobar', 'tv-fwdbar', 'sepg-screen', 'epg-screen', 'navigation-list'];
const indexHtml = loadText(join(root, 'ui', '1920', 'index.html'));

for (const id of REQUIRED_IDS) {
  const byId = indexHtml.includes(`id="${id}"`) || indexHtml.includes(`id='${id}'`);
  const byClass = indexHtml.includes(`class="${id}"`) || indexHtml.includes(`${id}"`) ||
    indexHtml.includes(`class='${id}'`);
  const ok = byId || byClass;
  add('technical', {
    level: ok ? 'pass' : 'fail',
    kind: 'dom',
    check: `id #${id}`,
    message: ok ? 'present' : 'MISSING in index.html'
  });
}

for (const id of FORBIDDEN_IDS) {
  const bad = indexHtml.includes(`id="${id}"`);
  add('technical', {
    level: bad ? 'fail' : 'pass',
    kind: 'dom-legacy',
    check: `no #${id}`,
    message: bad ? 'legacy id still in HTML' : 'absent (ok)'
  });
}

// ── Technical: CSS tokens vs APK ────────────────────────────────────────
const tokensCss = loadText(join(root, 'ui', '1920', 'css', 'v4-tokens.css'));
const tokenMap = JSON.parse(loadText(join(root, 'docs', 'token-map-v4.json')) || '{"tokens":{}}');

const TOKEN_EXPECT = {
  '--v4-accent': '#86dbff',
  '--v4-bg-outer': '#010e21',
  '--v4-bg-list': '#051a31',
  '--v4-bg-detail': '#304154',
  '--v4-panel-bg': '#6e000000',
  '--v4-track': '#70ffffff',
  '--v4-icon-bg': '#1affffff',
  '--v4-footer-bg': '#26000000',
  '--v4-footer-h': '72px',
  '--v4-gradient-h': '400px',
  '--v4-ch-icon': '96px',
  '--v4-ch-name': '42px',
  '--v4-prog-text': '30px',
  '--v4-panel-max-h': '344px'
};

for (const [varName, expected] of Object.entries(TOKEN_EXPECT)) {
  const m = tokensCss.match(new RegExp(varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:\\s*([^;]+);'));
  const actual = m ? m[1].trim().toLowerCase() : null;
  const ok = actual === expected.toLowerCase();
  add('technical', {
    level: ok ? 'pass' : 'warn',
    kind: 'token',
    check: varName,
    message: ok ? actual : `expected ${expected}, got ${actual || 'missing'}`
  });
}

// token-map px sync
for (const [key, val] of Object.entries(tokenMap.tokens || {})) {
  if (val.px == null) continue;
  const cssKey = {
    paddingHorizontal: '--v4-pad-h', panelMarginH: '--v4-panel-mx', footerH: '--v4-footer-h',
    channelIcon: '--v4-ch-icon', channelNameSp: '--v4-ch-name', programSp: '--v4-prog-text'
  }[key];
  if (!cssKey) continue;
  const m = tokensCss.match(new RegExp(cssKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:\\s*([0-9.]+)px'));
  const actual = m ? parseFloat(m[1]) : null;
  const ok = actual === val.px;
  add('technical', {
    level: ok ? 'pass' : 'warn',
    kind: 'token-px',
    check: `${key} → ${cssKey}`,
    message: ok ? `${actual}px` : `map ${val.px}px vs css ${actual}px`
  });
}

// ── Technical: strings vs resolved-keys ─────────────────────────────────
const resolved = JSON.parse(loadText(join(apkRoot, 'resolved-keys.json')) || '{"resolved":{}}');
const playerJs = loadText(join(root, 'ui', 'js', 'player-ui.js'));
const appJs = loadText(join(root, 'ui', 'js', 'app-preview.js'));

const STRING_CHECKS = [
  ['7F140296', 'Эфир', 'btn-live / MODE_LABELS.onAir'],
  ['7F140295', 'Программа', 'ACTION program label'],
  ['7F14029A', 'Буду смотреть', 'ACTION watch label'],
  ['7F140292', 'Добавить в Избранное', 'ACTION favorite label'],
  ['7F1402A7', 'Просмотр', 'footer hint'],
  ['7F1402B1', '--:--', 'time placeholder']
];

for (const [key, text, desc] of STRING_CHECKS) {
  const inJs = playerJs.includes(text) || appJs.includes(text) || indexHtml.includes(text);
  add('technical', {
    level: inJs ? 'pass' : 'fail',
    kind: 'string',
    check: `${key} «${text}»`,
    message: inJs ? desc : `not found — ${desc}`
  });
}

const errorMsg = 'Не удалось загрузить трансляцию. Попробуйте позже';
const errorInCode = playerJs.includes(errorMsg) || appJs.includes(errorMsg) ||
  loadText(join(root, 'mocks', 'player-mock.json')).includes(errorMsg);
add('technical', {
  level: errorInCode ? 'pass' : 'fail',
  kind: 'string',
  check: 'error overlay text',
  message: playerJs.includes(errorMsg) ? 'matches APK emu' : 'wrong error string'
});

// ── Technical: assets ───────────────────────────────────────────────────
const ICONS = [
  'assets/v4/icons/ic_program.svg', 'assets/v4/icons/ic_watch.svg', 'assets/v4/icons/ic_favorite.svg',
  'assets/v4/icons/ic_favorite_filled.svg', 'assets/v4/icons/ic_watch_filled.svg',
  'assets/v4/icons/ic_seekbar_thumb.svg', 'assets/v4/icons/ic_play_program.svg',
  'assets/v4/icons/ic_footer_hint_back.svg', 'assets/v4/icons/ic_iptv_schedule_back_arrow.svg',
  'assets/v4/img_logo_player.png', 'assets/v4/img_default_channel.png',
  'ui/1920/css/mvideo.ttf', 'mocks/player-mock.json', 'mocks/channel-poster-match.svg',
  'mocks/program-poster-fight-nights.svg'
];

for (const rel of ICONS) {
  const ok = existsSync(join(root, rel));
  add('technical', {
    level: ok ? 'pass' : 'fail',
    kind: 'asset',
    check: rel,
    message: ok ? 'exists' : 'MISSING'
  });
}

// ── Technical: font (mvideo.ttf vs APK widget asset) ────────────────────
const fontPath = join(root, 'ui', '1920', 'css', 'mvideo.ttf');
const refFont = join(root, '..', 'apk-analysis', 'raw', 'assets', 'widget2', 'ui', '1920', 'css', 'mvideo.ttf');
if (existsSync(fontPath) && existsSync(refFont)) {
  const hash = (p) => createHash('md5').update(readFileSync(p)).digest('hex');
  const h1 = hash(fontPath);
  const h2 = hash(refFont);
  add('technical', {
    level: h1 === h2 ? 'pass' : 'fail',
    kind: 'font',
    check: 'mvideo.ttf MD5',
    message: h1 === h2 ? `matches APK widget2 (${h1.slice(0, 8)}…)` : `drift ${h1} vs ${h2}`
  });
}
const baseCss = loadText(join(root, 'ui', '1920', 'css', 'base.css'));
add('technical', {
  level: baseCss.includes("font-family: 'mvideo'") ? 'pass' : 'fail',
  kind: 'font',
  check: 'base.css font-family mvideo',
  message: "APK @7F090000/@7F090005 → mvideo (native may use system sans; web demo uses legacy TTF)"
});

// ── Systemic: state coverage ────────────────────────────────────────────
const STATE_MATRIX = [
  ['01-live-loading.png', '02-player-live.png', 'live+loading'],
  ['02-live-playing.png', '01-player-playing.png', 'clean playing'],
  ['03-live-controller.png', '02-player-live.png', 'live controller'],
  ['04-player-controller.png', '03-player-archive.png', 'archive'],
  ['08-paused.png', '14-player-paused.png', 'paused'],
  ['12-error.png', '04-player-error.png', 'error'],
  ['09-fav-marked.png', '05-player-fav.png', 'favorites'],
  ['05-mini-list.png', '06-mini-list.png', 'mini-list'],
  ['10-iptv-guide.png', '16-guide-channel-first.png', 'channel-first guide'],
  ['11-iptv-dates.png', '12-guide-dates.png', 'date screen'],
  ['13-player-clean.png', '15-player-clean.png', 'clean video'],
  ['02-tv-guide-overlay.png', '17-player-program-info.png', 'program info overlay'],
  ['02-tv-guide-overlay.png', '19-player-channel-guide.png', 'guide from player']
];

for (const [emu, web, label] of STATE_MATRIX) {
  const emuOk = existsSync(join(emuDir, emu));
  const webOk = existsSync(join(webDir, web));
  add('systemic', {
    level: emuOk && webOk ? 'pass' : 'warn',
    kind: 'state-pair',
    check: label,
    message: `${emuOk ? '✓' : '✗'} emu / ${webOk ? '✓' : '✗'} web → ${emu} ↔ ${web}`
  });
}

// audit-all states count
const auditScript = loadText(join(root, 'scripts', 'audit-all.mjs'));
const shotCount = (auditScript.match(/name:\s*'/g) || []).length;
add('systemic', {
  level: shotCount >= 19 ? 'pass' : 'warn',
  kind: 'audit-coverage',
  check: 'audit-all states',
  message: `${shotCount} states defined (target ≥19)`
});

// outdated scripts
const auditPlayer = loadText(join(root, 'scripts', 'audit-player.mjs'));
const oldSepg = auditPlayer.includes("showScreen('sepg')");
add('systemic', {
  level: oldSepg ? 'warn' : 'pass',
  kind: 'script-drift',
  check: 'audit-player.mjs mini-list',
  message: oldSepg ? 'still uses sepg screen — update to player overlay' : 'ok'
});

// DOM contract doc drift
const domDoc = loadText(join(root, 'docs', 'DOM-CONTRACT-4.000.md'));
for (const id of ['player-toast', 'program-info-overlay', 'iptv-inline-dates-pane', 'channel-first']) {
  const inDoc = domDoc.includes(id);
  add('systemic', {
    level: inDoc ? 'pass' : 'warn',
    kind: 'doc-drift',
    check: `DOM-CONTRACT mentions ${id}`,
    message: inDoc ? 'documented' : 'missing from DOM-CONTRACT-4.000.md'
  });
}

// ── Run audit before visual MAE ───────────────────────────────────────────
if (runAudit) {
  console.log('Running audit-all.mjs…');
  const r = spawnSync('node', ['scripts/audit-all.mjs'], { cwd: root, stdio: 'inherit' });
  if (r.status !== 0) {
    add('systemic', { level: 'fail', kind: 'audit-run', check: 'audit-all', message: `exit ${r.status}` });
  }
}

// ── Visual: MAE full + crop (bottom UI band) ───────────────────────────
function loadPng(path) {
  return PNG.sync.read(readFileSync(path));
}

function maeRegion(a, b, y0, y1) {
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
  return { mae: n ? sum / n : 0, n };
}

const VIS_PAIRS = [
  ['02-live-playing.png', '01-player-playing.png', 'player', 0, 1],
  ['03-live-controller.png', '02-player-live.png', 'player', 0, 1],
  ['04-player-controller.png', '03-player-archive.png', 'player', 0, 1],
  ['08-paused.png', '14-player-paused.png', 'player', 0, 1],
  ['12-error.png', '04-player-error.png', 'player', 0, 1],
  ['09-fav-marked.png', '05-player-fav.png', 'player', 0, 1],
  ['05-mini-list.png', '06-mini-list.png', 'player', 0, 1],
  ['02-tv-guide-overlay.png', '17-player-program-info.png', 'player', 0, 1],
  ['13-player-clean.png', '15-player-clean.png', 'player', 0, 1],
  ['10-iptv-guide.png', '16-guide-channel-first.png', 'guide', 0, 1],
  ['11-iptv-dates.png', '12-guide-dates.png', 'guide', 0, 1]
];

if (runMae) {
  for (const [emu, web, kind, y0, y1] of VIS_PAIRS) {
    const emuPath = join(emuDir, emu);
    const webPath = join(webDir, web);
    if (!existsSync(emuPath) || !existsSync(webPath)) {
      add('visual', { level: 'warn', kind: 'mae', check: `${emu} ↔ ${web}`, message: 'missing screenshot' });
      continue;
    }
    const ref = loadPng(emuPath);
    const cur = loadPng(webPath);
    const full = maeRegion(ref, cur, 0, 1);
    const crop = maeRegion(ref, cur, y0, y1);
    const threshold = kind === 'guide' ? 28 : 20;
    const score = full.mae;
    const level = score < threshold ? 'pass' : score < threshold + 15 ? 'warn' : 'fail';
    add('visual', {
      level,
      kind: 'mae',
      check: `${emu} ↔ ${web}`,
      message: `full MAE ${full.mae.toFixed(1)} | UI-crop ${crop.mae.toFixed(1)} (${Math.round(y0 * 100)}–${Math.round(y1 * 100)}%)`,
      maeFull: +full.mae.toFixed(2),
      maeCrop: +crop.mae.toFixed(2)
    });
  }
}

// ── Write reports ───────────────────────────────────────────────────────
const jsonPath = join(outDir, `scan-${Date.now()}.json`);
const latestPath = join(outDir, 'latest.json');
writeFileSync(jsonPath, JSON.stringify(report, null, 2));
writeFileSync(latestPath, JSON.stringify(report, null, 2));

const md = [
  `# Scan report — ${report.generated}`,
  '',
  `| Level | Count |`,
  `|-------|-------|`,
  `| pass | ${report.summary.pass} |`,
  `| warn | ${report.summary.warn} |`,
  `| fail | ${report.summary.fail} |`,
  '',
  '## Visual (MAE)',
  ...report.visual.map((i) => `- **${i.level}** ${i.check}: ${i.message}`),
  '',
  '## Technical',
  ...report.technical.filter((i) => i.level !== 'pass').map((i) => `- **${i.level}** [${i.kind}] ${i.check}: ${i.message}`),
  '',
  '## Systemic',
  ...report.systemic.filter((i) => i.level !== 'pass').map((i) => `- **${i.level}** [${i.kind}] ${i.check}: ${i.message}`),
  ''
].join('\n');

writeFileSync(join(outDir, 'latest.md'), md);

console.log('\n═══ SCAN 4.000 ═══');
console.log(`pass ${report.summary.pass} | warn ${report.summary.warn} | fail ${report.summary.fail}`);
console.log(`Report: ${latestPath}`);
console.log(`Markdown: ${join(outDir, 'latest.md')}`);

if (report.summary.fail > 0) process.exit(1);
else if (report.summary.warn > 0) process.exit(0);
