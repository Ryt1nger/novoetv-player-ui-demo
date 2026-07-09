# Этап 3 — Mini-EPG ✅

## Что это

**Mini-EPG (`sepg-screen`)** — полоска из **3 карточек программ** внизу экрана поверх плеера.

- Слева / по центру / справа: предыдущая, **текущая** (выделена cyan), следующая передача
- У текущей — постер, красная полоска прогресса, иконка play (если архив)
- Стрелки ← → листают расписание
- Состояния: loading, «данные отсутствуют», ошибка

В APK открывается из плеера (кнопка вниз на архиве / `key_down`).

## Файлы

```
ui/
├── js/sepg-ui.js           ← DOM API
├── screens/sepg.screen.js  ← логика APK (референс)
└── 1920/
    └── sepg.html           ← превью + dev-panel
```

## API `SepgUI`

| Метод | Назначение |
|-------|------------|
| `setTitle(text)` | `#sepg-block-title` |
| `fillPrograms(centerIndex, programs[])` | 3 слота sepg-channel-0/1/2 |
| `setProgram(slot, program, selected)` | Одна карточка |
| `showLoading(show)` | Спinner в карточках (как APK) |
| `showEmpty()` | «Данные отсутствуют» |
| `shiftLeft()` / `shiftRight()` | Листание |
| `applyDemo()` | Мок NTV из player-mock.json |

## Превью

```
player-reference/ui/1920/sepg.html
```

Кнопки: 3 карточки | Loading | Empty | Error | ◀ ▶

Аудит-скрины: `node scripts/audit-sepg.mjs` → `screenshots/audit-sepg/`

## DOM-контракт

Без изменений — см. `DOM-CONTRACT.md` § sepg-screen.

## Дальше

**Этап 4** — Full EPG (`epg-screen`): дни + список программ + описание.
