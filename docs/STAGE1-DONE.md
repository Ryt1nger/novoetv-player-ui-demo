# Этап 1 — завершён

## Что сделано

| Задача | Статус | Артефакт |
|--------|--------|----------|
| Ассеты из APK (142 img) | ✅ | `assets/img/` |
| Шрифт mvideo.ttf | ✅ | `css/mvideo.ttf` |
| Скриншоты Android TV | ✅ | `screenshots/` (3 шт.) |
| DOM-контракт | ✅ | `DOM-CONTRACT.md` |
| Мок-данные | ✅ | `mocks/player-mock.json` |
| CSS плеера из APK | ✅ | `css/base.css`, `css/player.css` |
| HTML фрагменты экранов | ✅ | `html/player-screen.html`, `sepg-screen.html`, `epg-screen.html` |
| Preview всех состояний | ✅ | `preview/player-preview.html` |

## Preview — 11 состояний

**Player (6):** Live, Loading, Error, VOD, Fwd bar, Favorites marked  
**Mini-EPG (2):** Normal, Loading  
**Full EPG (3):** Normal, Loading, Empty  
**+ переключение фокуса** на 8 кнопок nav (♥, later, stop, pause, ch, epg, menu, info)

## Как открыть

```
open player-reference/index.html
```

или напрямую `player-reference/preview/player-preview.html` (1920×1080)

## Референс для сверки

- `screenshots/02-after-launch.png` — infobar с эмулятора
- `screenshots/03-player-current.png` — актуальный кадр

## Следующий этап

**Этап 2** — полировка infobar 1:1, все nav states визуально, сверка пиксель-в-пиксель.
