# Этап 2 — аудит вёрстки плеера

Дата: 2026-07-07  
Эталон: `screenshots/02-after-launch.png` (Android TV emulator)  
Наша сборка: `ui/1920/player.html?audit=1`

## Как повторить аудит

```bash
cd player-reference
npm install playwright@1.49.1 --no-save   # один раз
node scripts/audit-player.mjs
```

Скриншоты: `screenshots/audit/`  
Сравнение side-by-side: `screenshots/audit/compare-01-live-loading.png`

## Метрики pixel-diff (меньше = лучше)

| Зона | mean | rms | Статус |
|------|------|-----|--------|
| full 1920×1080 | 1.33 | 14.6 | OK |
| infobar | 2.99 | 22.5 | OK |
| logo tab | 2.27 | 12.7 | OK |
| nav row | 6.58 | 33.2 | см. замечание |

Порог «визуально совпадает»: mean &lt; 5 на infobar, &lt; 15 на nav.

## Исправлено в аудите

1. **CSS infobar** — `#infobar-channel-name` / `#infobar-program-name` 1:1 из APK `main.css`
2. **formatSeconds** — `00:00:01` / `00:25:00` как `Helper.formatSeconds(..., true)`
3. **Live+loading** — иконка Play (не Pause), `isPlaying: false`, disabledIcons как в `setChannel` + `syncState`
4. **setVodMode** — класс `.vod` на `#player-screen`, не на `#tv-infobar`
5. **Spinner** — `img/spinner.gif` из APK (не `loading_data.gif`)
6. **DOM-структура** — `#loading-bar` и `#aspect-bar` вынесены из `#player-screen` (как в APK `index.html`)
7. **Логотип NOVOE TV** — `mocks/company-logo-novoetv.png` (прозрачный фон, эталон с эмулятора)
8. **Постер канала** — `mocks/channel-poster-ntv.png` 147×147 с эталонного кадра
9. **Превью** — auto scale-to-fit, `?audit=1` скрывает dev-panel

## Известные допустимые отличия

| Тема | APK / код | Android-скрин | Решение на Samsung |
|------|-----------|---------------|-------------------|
| Логотип | `company-logo.png` = MOOVI | NOVOE TV | `custom_css` / сервер при интеграции |
| EPG в nav | `navigationData` включает `epg` | 3 иконки справа (без calendar) | DOM `btn-epg-div` сохранён; видимость — в `player.screen.js` / конфиге |
| Постер | URL с CDN | JPG с сервера | `setChannel({ icon })` |
| Nav PNG | 24–40 px, 1:1 CSS | Чётко на TV | На TV без browser zoom — норм |

## Состояния (скрины audit)

| Файл | Состояние |
|------|-----------|
| `01-live-loading.png` | Live + spinner + infobar |
| `02-playing.png` | Playing, pause selected |
| `03-paused.png` | Paused, play icon |
| `04-error.png` | Ошибка «Нет каналов…» |
| `05-vod.png` | VOD mode |
| `06-fwd.png` | Fwd bar |

## Вердикт

**Этап 2 готов к merge / этапу 3.**  
Вёрстка и DOM-контракт совпадают с APK; визуально — с эталонным Android-скрином в пределах погрешности raster-скрина и server-брендинга.
