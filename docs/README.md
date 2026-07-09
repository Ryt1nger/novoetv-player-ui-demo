# Player UI Reference (Android APK v3.038)

Документация и артефакты разработки. Рабочий UI: `../ui/1920/index.html`.

```
docs/
  DOM-CONTRACT.md, MERGE.md, PLAN.md, STAGE*.md
  dev-links.html          — ссылки на превью
  legacy/                 — html/, css/, preview/ (этап 1)
```

Источник: `novoetv-smart-v3.038.apk` → `assets/widget2/ui/1920/`

## Состав плеера (3 экрана)

| Экран | DOM id | Назначение |
|-------|--------|------------|
| Player | `#player-screen` | Видео + infobar + навигация |
| Mini-EPG | `#sepg-screen` | Панель программ поверх плеера (key_down в archive) |
| Full EPG | `#epg-screen` | Полная программа передач (кнопка epg в infobar) |

## Визуальная структура Player

```
#player-screen
├── #playing-error-bar
├── #tv-infobar (основная панель, bottom: 80px, left: 80px, width: 1760px)
│   ├── #player-company-logo
│   └── #block-tv-info
│       ├── #navigation-panel
│       │   └── #navigation-list (ul > li#navN > div.btn-*)
│       └── #infobar-common-info
│           ├── #infobar-channel-icon / #player-channel-icon
│           ├── #infobar-channel-number
│           ├── #infobar-channel-name
│           ├── #infobar-program-name
│           ├── #infobar-program-time
│           ├── #infobar-progress-info (total / progress / pin)
│           └── #infobar-program-duration
└── #tv-fwdbar (панель перемотки archive)
```

## Кнопки навигации infobar (TV mode)

Порядок в `player.screen.js` → `navigationData`:

1. favorites
2. mycontent («смотреть позже»)
3. stop
4. multiaudio (часто disabled)
5. pause
6. tvchannels
7. **epg** ← открывает `#epg-screen`
8. mainmenu
9. info

Классы кнопок: `.favorites`, `.mycontent`, `.stop`, `.pause`, `.tvchannels`, `.epg`, `.mainmenu`, `.info`

Selected: `li.selected` + `*_selected.png` иконки, фон `#18bbcc`

## Цвета и размеры

| Элемент | Значение |
|---------|----------|
| Панель infobar bg | `rgba(5, 26, 49, 1.0)` |
| Navigation panel bg | `rgba(9, 30, 54, 1)` |
| Focus/selected | `#18bbcc` |
| Progress bar track | `#f7f7f7` |
| Progress bar fill / pin | `#ef341d` |
| Block height | 286px |
| Nav icons | 60×60px |
| Channel icon | 147×147px |

## EPG flow (из TV)

- Infobar → кнопка `.epg` → `key_epg()` → `App.display.showScreen('epg')`
- Archive mode: `key_down` → `App.display.showScreen('sepg')`
- `tvchannels.screen.js` тоже может открыть epg

## DOM-контракт (НЕ МЕНЯТЬ при переносе в Samsung)

Критичные id для ядра:
`player-screen`, `tv-infobar`, `navigation-list`, `nav0..navN`,
`btn-{action}-div`, `infobar-channel-icon`, `player-channel-icon`,
`infobar-channel-number`, `infobar-channel-name`, `infobar-program-name`,
`infobar-program-time`, `infobar-progress-info`, `infobar-program-total`,
`infobar-program-progress`, `infobar-program-pin`, `infobar-program-duration`,
`sepg-screen`, `sepg-menu-list`, `sepg-channel-0/1/2`,
`epg-screen`, `epg-days-list`, `epg-list`, `program-data`

## Файлы в этой папке

- `index.html` — вход в preview
- `preview/player-preview.html` — 11 состояний + переключение фокуса nav
- `DOM-CONTRACT.md` — полный список id/class
- `mocks/player-mock.json` — данные для вёрстки
- `css/base.css`, `css/player.css` — стили из APK
- `html/player-screen.html`, `sepg-screen.html`, `epg-screen.html` — разметка
- `assets/img/` — 142 картинки
- `screenshots/` — референс с Android TV
- `STAGE1-DONE.md` — итог этапа 1

## Работа без GitLab

Можно верстать в `player-reference/` локально, затем перенести в `feature/player` когда будет доступ к репозиторию. Сохранять id/class из DOM-контракта.
