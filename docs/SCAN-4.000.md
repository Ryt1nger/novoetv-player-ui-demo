# Continuous scan — APK 4.000 vs player-reference

Автоматическая проверка визуальных, технических и системных расхождений.

## Запуск

```bash
cd player-reference
npm run scan          # audit-all + MAE + DOM/tokens/strings
npm run scan:quick    # без pixel MAE (быстро)
node scripts/scan-4.000.mjs --no-mae --audit
```

Отчёты:
- `screenshots/scan-reports/latest.json`
- `screenshots/scan-reports/latest.md`

## Что проверяется

| Категория | Проверки |
|-----------|----------|
| **Visual** | Pixel MAE full + UI-crop (нижняя полоса controller) vs `emu-scan/` |
| **Technical** | DOM ids/classes, CSS tokens vs APK hex, strings vs `resolved-keys.json`, assets |
| **Systemic** | Матрица состояний emu↔web, покрытие audit-all, drift скриптов/docs |

## Пороги MAE (UI-crop)

| Тип | pass | warn | fail |
|-----|------|------|------|
| Guide (fullscreen) | <28 | <40 | ≥40 |
| Player (bottom band) | <55 | <67 | ≥67 |

Player MAE завышен из‑за разного кадра видео даже при `audit-mode` emu-bg.

## Регулярный цикл

1. `npm run scan` после любых правок CSS/JS/HTML
2. `node scripts/audit-emu-diff.mjs --mae` — быстрая сверка пар
3. При расхождении guide MAE >28 — править `iptv-v4.css`
4. При fail DOM/strings — синхронизировать с `DOM-CONTRACT-4.000.md`

## Эмулятор (обновление эталона)

```bash
player-reference/scripts/capture-apk-player-full.sh
```

Скрины → `screenshots/apk-4.000/emu-scan/` (коммитятся в репо для CI)

## CI

GitHub Actions: `.github/workflows/scan.yml` — `npm run scan` на push/PR.
