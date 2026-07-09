# Редизайн под NovoeTV 4.000

**Старая база:** APK 3.038 (`de.soft.novoetv.smart`) — WebView widget2, HTML/CSS в `assets/widget2/ui/1920/`.  
**Новая база:** APK 4.000 (`de.soft.novoetv.novoetvapplication`) — нативный Android (Kotlin + ExoPlayer + Jetpack TV).

Это **не обновление темы**, а другой UI-стек. Вёрстка 3.038 не переносится 1:1 — нужен новый DOM/CSS по `layout_controller.xml` и IPTV-фрагментам.

## Плеер

| Было (3.038) | Стало (4.000) |
|--------------|---------------|
| Панель 1760×286px, `#051A31`, скругления | Панель max 344px, `#6E000000`, на всю ширину |
| 9 иконок nav (pause, epg, menu…) | 3–4 кнопки FocusSwitch: Программа, Буду смотреть, Избранное |
| Прогресс: красный pin 50px + bar 8px | Seekbar: accent `#86DBFF`, track `#70FFFFFF` |
| Логотип над панелью (navy chip) | Badge 120×91px, `img_logo_player.png` |
| Номер канала 3 цифры | Нет номера в controller |
| Постер 147×147 | Постер 96×96 |
| Fwd bar отдельно | Убран |
| Aspect-bar сверху справа | Hint overlay справа по центру |
| Footer — нет | Полоска 72px: «Просмотр» + часы |

## Mini-EPG

| Было | Стало |
|------|-------|
| `#sepg-screen`, 3 карточки 480×110 | **Нет отдельного sepg-screen** |
| Стрелки влево/вправо | Вертикальный список над controller ИЛИ кнопка «Программа» → IPTV guide |

## Full EPG

| Было | Стало |
|------|-------|
| 3 колонки float (дни / программы / описание) | 4 зоны: даты + каналы + программы + detail (`fragment_tv_*`) |
| Focus `#18bbcc` | Focus `#86DBFF`, выбранная программа — белый фон / чёрный текст |
| Фон `#051A31` | `#010E21` / `#051A31` |

## Токены (×2 для 1920×1080 @ 320dpi)

- Accent: `#86DBFF`
- Panel: `#6E000000`
- Seek track: `#70FFFFFF`
- Icon circle: `#1AFFFFFF`
- Footer: `#26000000`

## План работ

1. **Player** — `player-v4.css`, новый `#player-controller`, обновить `player-ui.js`
2. **Mini-EPG** — recycler над controller или stub + переход в guide
3. **Full EPG** — новый `#iptv-guide` 4-pane layout
4. Скриншоты с эмулятора 4.000 для pixel-audit

Источник layout: `apk-analysis/new-4.000/decoded-res/layout_controller.xml`
