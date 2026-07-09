# Этап 4 — Full EPG (план)

## Цель

Экран `#epg-screen` 1:1 с APK: заголовок + 3 колонки (дни | программы | описание).  
Открывается из раздела ТВ (кнопка EPG в nav плеера / из списка каналов).

## Scope этапа

| В scope | Вне scope |
|---------|-----------|
| HTML/CSS по APK `index.html` + `main.css` | API, `requestProgramList` |
| `epg-ui.js` — DOM API | Навигация пультом |
| Мок NTV из `player-mock.json` | Merge с `player.html` (после этапа 4) |
| Состояния: normal, loading, empty | `epg.screen.js` логика (только копия-референс) |

## DOM-контракт

См. `DOM-CONTRACT.md` § epg-screen. Ключевые id:

- Заголовки: `epg-category`, `epg-channel-name`, `epg-channel-description`
- Колонки: `epg-days-list` / `epgdayN`, `epg-list` / `epgN`, `program-data`
- Состояния: `epg-data-loading`, `no-epg-message`, `program-data-loading`
- Классы записи: `.epg-program-record` + `.has-record` / `.active-record` / `.myrecord` / `.locked`
- Фокус колонки: class `selected` на `ul` (дни или программы), class `selected` на `li`

## Файлы

```
ui/js/epg-ui.js           ← новый
ui/1920/epg.html          ← превью + dev-panel
ui/screens/epg.screen.js  ← копия из APK (референс)
scripts/audit-epg.mjs     ← скриншоты
mocks/player-mock.json    ← расширить epg-секцию
```

## API `EpgUI` (по `epg.screen.js`)

| Метод | Назначение |
|-------|------------|
| `setHeaders(category, channel, description)` | 3 header-блока |
| `setHeaderClock(date, time)` | `.header-date` / `.header-time` |
| `fillDays(days[], selectedIndex)` | Список дней |
| `fillPrograms(programs[], selectedIndex)` | Список программ + иконки записи |
| `setProgramDetails(details)` | Правая колонка |
| `setFocusedColumn('days' \| 'programs')` | Фокус колонки (`ul.selected`) |
| `showProgramsLoading(show)` | Spinner в средней колонке |
| `showDetailsLoading(show)` | Spinner справа |
| `showEmpty(message)` | «Программа передач недоступна» |
| `applyDemo()` | Полный мок из JSON |
| `applyLoadingDemo()` | Loading state |
| `applyEmptyDemo()` | Empty state |

## Dev-panel (epg.html)

- **Normal** — 3 колонки с данными
- **Loading** — спиннеры в программах и описании
- **Empty** — нет программ
- **Фокус: дни / программы**
- **▲ ▼** — смена выделенного пункта в активной колонке

## Критерии готовности

- [ ] `epg.html` открывается в браузере, масштаб как у player/sepg
- [ ] 3 колонки визуально совпадают с APK/preview
- [ ] Selected state: cyan фон + стрелка
- [ ] Иконки записи: has-record, active-record
- [ ] `node scripts/audit-epg.mjs` → `screenshots/audit-epg/`
- [ ] `STAGE4-DONE.md`

## После этапа 4

Склейка `player.html` + `sepg-screen` + `epg-screen` в один `index.html`, merge в GitLab.
