# План: вёрстка плеера Samsung TV (референс Android APK)

## Цель
Визуальный перенос 1:1 плеера из `novoetv-smart-v3.038.apk` в `player-reference/` для последующего merge в GitLab `feature/player`.

## Scope
- ✅ HTML/CSS, статические моки
- ✅ Сохранение DOM id/class (контракт с ядром)
- ❌ Логика фокуса, навигация пультом, API, видео

## Экраны

| # | Экран | id | Приоритет |
|---|-------|-----|-----------|
| 1 | Player + infobar | `player-screen` | P0 |
| 2 | Mini-EPG | `sepg-screen` | P1 |
| 3 | Full EPG | `epg-screen` | P1 |
| 4 | Fwd bar (archive) | `tv-fwdbar` | P2 |
| 5 | Error / loading | overlays | P2 |

## Этапы

### Этап 1 — Подготовка (день 1) ✅ ЗАВЕРШЁН
- [x] Распаковать ассеты из APK
- [x] Скриншот с эмулятора
- [x] DOM-контракт и README
- [x] Шрифт mvideo.ttf
- [x] Preview со всеми состояниями
- [x] Мок-данные (`mocks/player-mock.json`)
- [x] HTML-фрагменты экранов (`html/`)
- [x] DOM-CONTRACT.md

См. `STAGE1-DONE.md`

### Этап 2 — Player infobar ✅ ЗАВЕРШЁН
- [x] Структура `ui/1920/` под merge в Samsung
- [x] `player-ui.js` — DOM API (канал, прогресс, nav, состояния)
- [x] `ui/1920/player.html` — экран плеера
- [x] Infobar по APK + скриншоту эмулятора
- [x] Nav: normal / selected / disabled / play↔pause / favorites marked
- [x] Состояния: loading, error, VOD, fwd bar, archive controls
- [x] `no_logo.gif`, CSS пути `img/`

См. `STAGE2-DONE.md`

### Этап 3 — Mini-EPG (день 2) ✅ ЗАВЕРШЁН
- [x] `sepg-ui.js` — DOM API (карточки, loading, empty, shift)
- [x] `ui/1920/sepg.html` — превью + dev-panel
- [x] 3 карточки, selected, progress line, play icon
- [x] Loading, empty, error
- [x] `ui/screens/sepg.screen.js` — референс из APK

См. `STAGE3-DONE.md`

### Этап 4 — Full EPG ✅ ЗАВЕРШЁН
- [x] `epg-ui.js` — DOM API (дни, программы, описание, loading, empty)
- [x] `ui/1920/epg.html` — превью + dev-panel
- [x] Header + 3 колонки (дни / список / описание)
- [x] Record icons, selected states
- [x] Loading, empty
- [x] `ui/screens/epg.screen.js` — референс из APK

См. `STAGE4-DONE.md`

### Этап 5 — Склейка + аудит ✅ ЗАВЕРШЁН
- [x] `ui/1920/index.html` — player + sepg overlay + epg
- [x] `app-preview.js` — dev-panel, переключение экранов
- [x] Mock video bg, z-index overlay
- [x] EPG nav в dev-panel (← → ▲ ▼)
- [x] `scripts/audit-all.mjs` → `screenshots/audit-all/`
- [x] `STAGE5-AUDIT.md`, `MERGE.md`

См. `STAGE5-DONE.md`

## Merge в GitLab (когда будет доступ)

См. **`MERGE.md`**

## Файлы проекта

```
player-reference/
├── PLAN.md
├── STAGE1-DONE.md       ← итог этапа 1
├── DOM-CONTRACT.md      ← id/class для ядра
├── README.md
├── index.html           ← вход в preview
├── mocks/
│   └── player-mock.json
├── preview/
│   └── player-preview.html
├── css/
│   ├── base.css
│   ├── player.css
│   ├── preview.css
│   └── mvideo.ttf
├── html/
│   ├── player-screen.html
│   ├── sepg-screen.html
│   └── epg-screen.html
├── assets/img/
└── screenshots/
```
