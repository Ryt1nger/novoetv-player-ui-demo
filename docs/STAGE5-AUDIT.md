# Этап 5 — полный аудит

Дата: 2026-07-07  
Сборка: `ui/1920/index.html?audit=1`  
Эталон: APK `index.html` + `main.css` + скрины эмулятора

## Чеклист PLAN.md — сделано vs требовалось

| Приоритет | Экран | Требование | Статус | Скрин |
|-----------|-------|------------|--------|-------|
| P0 | Player + infobar | DOM, CSS, состояния | ✅ | `audit-all/01–04` |
| P1 | Mini-EPG | 3 карточки, overlay на плеере | ✅ | `audit-all/05–06` |
| P1 | Full EPG | 3 колонки, loading, empty | ✅ | `audit-all/07–09` |
| P2 | Fwd bar | archive перемотка | ✅ | `audit-all/03` |
| P2 | Error / loading | overlays | ✅ | `audit-all/02`, `04` |

## Scope PLAN.md

| | Требовалось | Статус |
|---|-------------|--------|
| HTML/CSS 1:1 | ✅ | `ui/1920/css/player.css` из APK |
| DOM-контракт | ✅ | `DOM-CONTRACT.md` без изменений |
| Статические моки | ✅ | `mocks/player-mock.json` |
| Логика пульта / API | ❌ by design | после merge → `*.screen.js` |

## Склейка (этап 5)

| Задача | Статус |
|--------|--------|
| `ui/1920/index.html` — player + sepg + epg | ✅ |
| Mini-EPG поверх плеера + mock video bg | ✅ |
| Full EPG — отдельный экран | ✅ |
| `app-preview.js` — dev-panel | ✅ |
| EPG nav: ← дни / программы →, ▲▼ | ✅ |
| `MERGE.md` — инструкция GitLab | ✅ |

## Исправления по этапам (сводка)

### Этап 2 — Player
- CSS infobar, formatSeconds, spinner.gif, DOM loading-bar/aspect-bar вне player-screen
- Логотип NOVOE TV, постер канала

### Этап 3 — Mini-EPG
- box-sizing content-box на `#sepg-screen li`
- ширина списка 1620px (3 карточки в ряд)

### Этап 4 — Full EPG
- окно 8 строк программ/дней
- `#epg-screen` padding 80px как APK
- фикс выделения программы (programsWindowStart)
- рейтинг `Рейтинг12+`

## Ожидаемые отличия (не баги)

| Тема | Причина |
|------|---------|
| Логотип NOVOE TV vs MOOVI в assets | Брендинг с эмулятора |
| Mock-данные NTV / Сёстры | Нет API |
| Dev-panel вместо пульта | Preview-only |
| `program-timestart` в EPG details | Как stage-1 preview |
| Nav EPG icon (4-я кнопка) | DOM есть; видимость — server config |

## Вне scope (post-merge)

- [ ] `player.screen.js` + Tizen keys
- [ ] `sepg.screen.js` — key_down в archive
- [ ] `epg.screen.js` — → info, OK watch
- [ ] AVPlayer, API, custom_css
- [ ] tvchannels, info screens

## Как повторить аудит

```bash
cd player-reference
node scripts/audit-all.mjs      # unified → screenshots/audit-all/
node scripts/audit-player.mjs   # isolated player
node scripts/audit-sepg.mjs
node scripts/audit-epg.mjs
```

## Вердict

**Player-reference готов к merge в GitLab `feature/player`.**  
Вёрстка P0–P2 закрыта; логика — следующий шаг в Samsung-репо.
