# Этап 4 — Full EPG ✅

## Что это

**Full EPG (`epg-screen`)** — полноэкранный гид передач из раздела ТВ.

- Шапка: логотип, дата/время
- 3 заголовка: категория | канал | описание канала
- 3 колонки: **дни** | **программы** | **описание выбранной**
- Иконки записи: `has-record`, `active-record` (текущая передача)
- Фокус колонки: class `selected` на `ul`
- Состояния: loading, empty

В APK открывается из плеера (кнопка EPG) / списка каналов.

## Файлы

```
ui/
├── js/epg-ui.js            ← DOM API
├── screens/epg.screen.js   ← логика APK (референс)
└── 1920/
    └── epg.html            ← превью + dev-panel
scripts/audit-epg.mjs       ← аудит-скрины
STAGE4-PLAN.md              ← план этапа
```

## API `EpgUI`

| Метод | Назначение |
|-------|------------|
| `setHeaders(category, channel, description)` | 3 header-блока |
| `setHeaderClock(date, time)` | Дата/время в шапке |
| `fillDays(days[], selectedIndex)` | Колонка дней |
| `fillPrograms(programs[], selectedIndex)` | Колонка программ |
| `setProgramDetails(details)` | Правая колонка |
| `setFocusedColumn('days' \| 'programs')` | Фокус колонки |
| `showProgramsLoading(show)` | Spinner в программах |
| `showDetailsLoading(show)` | Spinner в описании |
| `showEmpty(message)` | Нет программ |
| `shiftSelection(delta)` | ▲/▼ в dev-panel |
| `applyDemo()` | Мок NTV из player-mock.json |

## Превью

```
player-reference/ui/1920/epg.html
```

Кнопки: Normal | Loading | Empty | Фокус дни/программы | ▲ ▼

Аудит: `node scripts/audit-epg.mjs` → `screenshots/audit-epg/`

## DOM-контракт

Без изменений — см. `DOM-CONTRACT.md` § epg-screen.

## Дальше

1. **Склейка** `player.html` + `sepg-screen` + `epg-screen` в один `index.html`
2. **Merge** в GitLab `feature/player`
3. Подключение `epg.screen.js`, API, пульт
