# Font map — APK 4.000 vs player-reference

| APK resource | Layout usage | Web demo |
|--------------|--------------|----------|
| `@7F090000` | Controller seek times, channel/program names (`layout_controller.xml`) | `mvideo.ttf` via `base.css` |
| `@7F090005` | IPTV lists, detail, categories | `mvideo.ttf` (same file) |

## Verification

`ui/1920/css/mvideo.ttf` is **byte-identical** to  
`apk-analysis/raw/assets/widget2/ui/1920/css/mvideo.ttf` (MD5 `db8f42af…`).

Native APK 4.000 may resolve `@7F090000` / `@7F090005` to bundled sans or system Roboto on Android TV; the **web demo** intentionally uses the legacy NovoeTV `mvideo` face shipped with widget2.

Automated check: `npm run scan` → `technical.font` (MD5 match).

## CSS notes

- `font-variant-numeric: tabular-nums` on seek times (APK `fontFeatureSettings="tnum"` on channel EPG time)
- `includeFontPadding="false"` in APK → tight `line-height` in `player-v4.css` / `iptv-v4.css`
