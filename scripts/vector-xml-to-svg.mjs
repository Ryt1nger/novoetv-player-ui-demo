#!/usr/bin/env node
/**
 * Convert Android vector drawable XML → SVG for WebView preview.
 * Usage: node scripts/vector-xml-to-svg.mjs <input.xml> [output.svg]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, basename, join } from 'path';

const COLOR_MAP = {
  '@android:0106000D': 'none',
  '@7F060528': '#FFFFFF',
  '#FFFFFFFF': '#FFFFFF',
  '#FF86DBFF': '#86DBFF',
  '#FFA6A6A6': '#A6A6A6',
};

function resolveColor(raw) {
  if (!raw) return '#FFFFFF';
  return COLOR_MAP[raw] || (raw.startsWith('#') ? raw : '#FFFFFF');
}

function convert(xml, name) {
  const vw = xml.match(/android:viewportWidth="([^"]+)"/)?.[1] || '24';
  const vh = xml.match(/android:viewportHeight="([^"]+)"/)?.[1] || '24';
  const paths = [...xml.matchAll(/<path\b([^>]*)\/>/g)].map((m) => m[1]);

  const svgPaths = paths.map((attrs) => {
    const d = attrs.match(/android:pathData="([^"]+)"/)?.[1];
    if (!d) return '';
    const fill = resolveColor(attrs.match(/android:fillColor="([^"]+)"/)?.[1]);
    const stroke = attrs.match(/android:strokeColor="([^"]+)"/)?.[1];
    const sw = attrs.match(/android:strokeWidth="([^"]+)"/)?.[1];
    const cap = attrs.match(/android:strokeLineCap="([^"]+)"/)?.[1];
    const join = attrs.match(/android:strokeLineJoin="([^"]+)"/)?.[1];
    const fillRule = attrs.match(/android:fillType="1"/) ? 'evenodd' : 'nonzero';

    let el = `<path d="${d}"`;
    if (fill !== 'none') el += ` fill="${fill}" fill-rule="${fillRule}"`;
    else el += ' fill="none"';
    if (stroke) {
      el += ` stroke="${resolveColor(stroke)}"`;
      if (sw) el += ` stroke-width="${sw}"`;
      if (cap === '1') el += ' stroke-linecap="round"';
      if (join === '1') el += ' stroke-linejoin="round"';
    }
    el += '/>';
    return el;
  }).filter(Boolean).join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="100%" height="100%">\n  ${svgPaths}\n</svg>\n`;
}

const input = process.argv[2];
const output = process.argv[3] || input.replace(/\.xml$/i, '.svg');
const xml = readFileSync(input, 'utf8');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, convert(xml, basename(input, '.xml')));
console.log('Wrote', output);
