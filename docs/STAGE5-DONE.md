# Этап 5 — Склейка + аудит ✅

## Что сделано

Единая сборка как в APK: **player + mini-EPG overlay + full EPG** в одном файле.

## Главный URL

```
player-reference/ui/1920/index.html
```

или `http://127.0.0.1:8765/ui/1920/index.html`

## Dev-panel

| Вкладка | Что проверять |
|---------|---------------|
| **Player** | Live, Playing, Paused, Fwd, VOD, Error, Nav, прогресс |
| **Mini-EPG overlay** | Плеер (archive) + полоска карточек снизу, ◀▶ |
| **Full EPG** | 3 колонки, Normal/Loading/Empty, ←дни / программы→, ▲▼ |

## Файлы этапа 5

```
ui/1920/index.html       ← unified (основной)
ui/js/app-preview.js     ← переключение экранов
scripts/audit-all.mjs    ← полный аудит
STAGE5-AUDIT.md          ← чеклист сделано vs план
MERGE.md                 ← инструкция GitLab
screenshots/audit-all/   ← 9 скринов
```

## Изолированные превью (этапы 2–4)

- `ui/1920/player.html`
- `ui/1920/sepg.html`
- `ui/1920/epg.html`

## Аудит

```bash
node scripts/audit-all.mjs
```

## Дальше

1. GitLab access → merge по `MERGE.md`
2. Подключить `*.screen.js`, API, Tizen
3. Убрать `*-ui.js` / `app-preview.js` из production
