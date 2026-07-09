# Этап 4 — аудит Full EPG vs APK

Сверка `ui/1920/epg.html` с `apk-analysis/.../index.html`, `main.css`, `epg.screen.js` и `preview/player-preview.html`.

## Найдено и исправлено

| # | Проблема | APK | Было у нас | Исправление |
|---|----------|-----|------------|-------------|
| 1 | **Переполнение списка программ** | 8 строк в колонке (665px) | 10 `<li>` → список 800px, обрезка снизу | Окно 8 строк в `epg-ui.js` |
| 2 | **`box-sizing: border-box`** в `base.css` | content-box (нет глобального rule) | li уже уже на 20px padding | `#epg-screen ul li { box-sizing: content-box }` |
| 3 | **Размер `.screen`** | 1760×920 + padding 80px | 1920×1080 без padding | `#epg-screen` по APK |
| 4 | **Отступы header/content** | header width 100%, content без margin | margin 80px на content | Override для `#epg-screen` |
| 5 | **margin-bottom заголовков колонок** | 10px | 20px из base.css | `#epg-screen .screen-content .header { margin-bottom: 10px }` |
| 6 | **Обрезка колонок** | overflow hidden в list | программы вылезали | `overflow: hidden` на `.list.*` |
| 7 | **Рейтинг** | `<span>Рейтинг</span>12+` | «Рейтинг 12+» | Формат как в `epg.screen.js` |
| 8 | **Clearfix строки заголовков** | float left/right | возможный collapse | `.epg-headers { overflow: hidden }` |
| 9 | **CSS clickable_container** | есть в main.css | отсутствовал | Добавлен для совместимости с DOM из `epg.screen.js` |
| 10 | **Выделение программы** | selected = текущая передача | `setFocusedColumn` сбрасывал window → выделялся последний `<li>` | `programsWindowStart` в state |
| 11 | **Рейтинг «12++»** | `12+` | двойной `+` в шаблоне | Не добавлять `+`, если уже есть |

## Ожидаемые отличия (не баги)

| | APK | Наш preview |
|---|-----|-------------|
| Логотип | `company-logo.png` (MOOVI в assets) | `mocks/company-logo-novoetv.png` — по скрину эмулятора |
| Данные | API канала/EPG | `mocks/player-mock.json` |
| Навигация | Пульт, BaseMenu | Dev-panel (▲▼, фокус колонок) |
| `program-timestart` | Не в начальном `loadProgramData` | Есть в моке (как в stage-1 preview) |

## Проверка

```bash
cd player-reference
node scripts/audit-epg.mjs          # screenshots/audit-epg/
node scripts/measure-epg.mjs        # epgList.h ≈ 640 (8×80)
python3 -m http.server 8765         # открыть ui/1920/epg.html
```

## Метрики после фикса

- `#epg-list` height ≈ 640px (8 строк × 80px)
- `#epg-screen .list.epg` height = 665px
- Колонки не выходят за нижнюю границу list-блока
