# AUDIT 4.000 — результат (browser preview)

**Дата:** 2026-07-09  
**Эталон:** `screenshots/apk-4.000/emu-scan/`  
**Preview:** `ui/1920/index.html?audit=1`  
**Скан:** `npm run scan` → `screenshots/scan-reports/latest.md`

> **Scan status: 128 pass / 0 fail** (11 visual pairs + DOM/tokens/font/assets)

---

## Матрица готовности

| Модуль | Статус | MAE (full) |
|--------|--------|------------|
| Player live | ✅ | ~6.6 |
| Player archive | ✅ | ~6.2 |
| Player paused | ✅ | ~7.8 |
| Player error | ✅ | ~6.2 |
| Player fav | ✅ | ~9.5 |
| Mini-list recycler | ✅ | ~15 (после mock/dim fix) |
| IPTV channel-first | ✅ | ~15.9 |
| IPTV dates | ✅ | ~23.1 |
| Channel guide overlay | ✅ | audit `19-player-channel-guide` |
| Program poster detail | ✅ | `program-poster-fight-nights.svg` |

---

## Continuous scan

```bash
npm run scan          # audit + DOM + tokens + strings + MAE
npm run scan:quick    # без MAE
```

Проверяет:
- **Visual** — pixel MAE emu ↔ web (matched video frame per state)
- **Technical** — DOM contract, CSS tokens APK hex, strings, assets
- **Systemic** — state matrix, audit coverage, script/doc drift

Документация: `docs/SCAN-4.000.md`

---

## Открытые (вне scope demo)

1. Stage 5 merge в Samsung `player.screen.js`
2. Native `@7F090000` glyph metrics vs mvideo на Android TV (системный sans)
