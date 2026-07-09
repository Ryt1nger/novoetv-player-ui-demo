# Этап 2 — завершён

## Результат

UI-слой плеера для Samsung, структура как в widget2 APK, готов к merge в GitLab.

## Структура (готова к переносу)

```
player-reference/ui/
  1920/
    player.html          ← экран плеера
    no_logo.gif          ← из APK
    css/base.css, player.css, mvideo.ttf
    img/ → assets/img
  js/
    player-ui.js         ← контроллер DOM (setChannel, setProgress, syncNavIcons…)
  screens/
    player.screen.js     ← референс логики из APK
```

## PlayerUI API (для ядра)

| Метод | Назначение |
|-------|------------|
| `buildNavigation()` | Собрать кнопки nav |
| `syncNavIcons()` | Обновить классы pause/play/disabled |
| `setNavSelected(i)` | Фокус на кнопке |
| `setChannel({name, number, icon, program_name})` | Данные канала |
| `setProgress(%, sec, duration)` | Таймлайн |
| `setPlaying(bool)` | pause ↔ play иконка |
| `setFavoritesMarked(bool)` | ♥ marked |
| `setVodMode(bool)` | VOD layout |
| `showInfobar / showFwdBar / showLoading / showError` | Состояния экрана |
| `setArchiveControls()` | archive: rew/pause/stop enabled |
| `applyLiveDemo()` | Как скриншот Android |

## Состояния (dev-панель в player.html)

- Live + loading (как эмулятор)
- Playing / Paused (play ↔ pause icon)
- Loading overlay
- Error bar
- VOD mode
- Fwd bar (archive перемотка)
- Favorites marked
- Archive controls
- Nav focus (9 кнопок + cycle)
- Progress slider

## DOM-контракт

Сохранены все id/class из APK — см. `DOM-CONTRACT.md`

## Открыть

`player-reference/ui/1920/player.html`

## Следующий этап

**Этап 3** — Mini-EPG (`sepg-screen`) + **Этап 4** — Full EPG (`epg-screen`)
