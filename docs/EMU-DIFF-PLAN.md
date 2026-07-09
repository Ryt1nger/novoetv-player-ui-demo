# EMU diff — player-reference vs APK 4.000

**Дата:** 2026-07-08  
**Эталон:** `screenshots/apk-4.000/emu-scan/`  
**Preview:** `screenshots/audit-all/` (`?audit=1`)

## Матрица состояний

| APK (emu-scan) | Preview (audit-all) | Статус до правок |
|----------------|---------------------|------------------|
| `03-live-controller` | `02-player-live` | ❌ tag/aspect/loading |
| `04-player-controller` | `03-player-archive` | ❌ tag в aspect-bar, не под title |
| `08-paused` | — | ❌ нет state `paused` |
| `12-error` | `04-player-error` | ❌ текст, позиция, controller скрыт |
| `09-fav-marked` | `05-player-fav` | ⚠️ toast нет, только border |
| `05-mini-list` | `06-mini-list` | ⚠️ program overlay ≠ recycler |
| `10-iptv-guide` | `08-guide-normal` | ⚠️ layout 3 vs 4 col, mock NTV |
| `11-iptv-dates` | `12-guide-dates` | ⚠️ отдельный экран дат |
| `02-live-playing` | `01-player-playing` | ⚠️ UI не скрывается |
| `13-player-clean` | — | ⚠️ нет отдельного state |

## P0 — Player controller

1. **Режим live/archive** — badge «Прямой эфир» / «Архив» под program name (`#program-tag`), не `aspect-bar` справа.
2. **Цвета tag** — live `#5ad66a`, archive `#f5d442` (emu).
3. **Кнопка «Эфир»** — только в archive; фон `sel_btn_nav_player`, не icon-bg.
4. **Error** — «Не удалось загрузить трансляцию. Попробуйте позже», controller остаётся, box справа с белой рамкой.
5. **Paused** — отдельный preview state, thumb pause (уже в SVG).
6. **Live demo** — без спиннера и без aspect popup при `playing`.
7. **Footer** — APK `Просмотр`; на Матч! иногда «Список каналов» (контекст) — оставляем `Просмотр` + data-attr.

## P1 — Визуал

1. Время seek: `H:MM:SS` без ведущего нуля часа (emu `1:51:13`).
2. Demo channel → Матч! ТВ HD / Fight Nights (emu).
3. `#btn-live` — rounded pill как в APK.
4. Error bar — не center modal, а `bg_player_message_overlay` style.

## P2 — IPTV / mini-list

1. Guide: channel-first flow (даты слева в program pane) vs category sidebar.
2. Mini recycler — белая selected bar над panel (есть в CSS, не в demo).
3. Program description overlay при «Программа» — отдельный слой (не sepg screen).
4. Toast «Передача добавлена…» при fav/watch.

## P3 — Полировка

1. Шрифт APK vs mvideo.ttf
2. Анимации show/hide controller
3. Pixel-diff script в CI

## Порядок работ (текущий спринт)

- [x] `scripts/audit-emu-diff.mjs`
- [x] P0 player-ui + player-v4.css
- [x] P1 channel-first EPG (`applyChannelGuideDemo`)
- [x] P1 program-info overlay + toast
- [x] P1 Match TV mock + poster SVG
- [x] P2 mini-list recycler overlay на player (не sepg tab)
- [x] P2 channel-guide overlay из player + archive→Программа
- [x] P2 анимации controller / recycler / guide (`preview-animations.css`)
- [x] P2 pixel-diff MAE (`scripts/pixel-diff-mae.mjs`)
- [x] Continuous scan (`scripts/scan-4.000.mjs`, `npm run scan`)
- [x] Matched emu-bg per audit shot (снижает MAE player до ~3–7%)
- [x] P3 шрифт — `mvideo.ttf` MD5 = widget2 APK asset (`docs/font-map-4.000.md`)
- [x] GitHub Actions `scan-4.000` workflow
