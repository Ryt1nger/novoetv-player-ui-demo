# Этап 5 — Склейка, доработки, полный аудит

## Цель

Единая сборка как в APK `index.html`: player + mini-EPG overlay + full EPG, dev-panel для QA, полный аудит «сделано vs план».

## Задачи

### 1. Склейка
- [ ] `ui/1920/index.html` — все `#player-screen`, `#sepg-screen`, `#epg-screen` + overlays
- [ ] `ui/js/app-preview.js` — переключение экранов, dev-panel
- [ ] Mini-EPG поверх плеера (как APK: video + sepg overlay)
- [ ] Full EPG — отдельный полноэкранный режим

### 2. Доработки / остаточные фиксы
- [ ] z-index, прозрачный sepg, mock-фон за плеером
- [ ] EPG nav в dev-panel: ← → ▲ ▼ (имитация колонок)
- [ ] Корневой `index.html` → unified preview

### 3. Полный аудит
- [ ] `scripts/audit-all.mjs` — скрины всех режимов
- [ ] `STAGE5-AUDIT.md` — чеклист P0–P2 vs PLAN.md
- [ ] Сводка из STAGE2/3/4 аудитов

### 4. Документация merge
- [ ] `STAGE5-DONE.md` — итог, как открыть, что в merge
- [ ] `MERGE.md` — инструкция для GitLab `feature/player`

## Вне scope (после merge в Samsung)

- `player.screen.js` / `sepg.screen.js` / `epg.screen.js` — логика пульта
- API, Tizen AVPlayer, `custom_css` брендинг
- Экраны tvchannels, info, settings

## Критерии готовности

- [ ] `http://localhost:8765/ui/1920/index.html` — один URL для всего
- [ ] Переключение Player | Mini-EPG overlay | Full EPG
- [ ] `node scripts/audit-all.mjs` без ошибок
- [ ] STAGE5-AUDIT: все P0/P1 пункты ✅
