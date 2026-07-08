# NovoeTV — Player UI (демо 4.000)

Интерактивное превью интерфейса NovoeTV **APK 4.000** для Samsung TV: плеер, mini program list, IPTV guide.

**Демо:** https://ryt1nger.github.io/novoetv-player-ui-demo/ui/1920/index.html

## Как смотреть

1. Откройте ссылку выше (лучше на широком экране или в полноэкранном режиме браузера).
2. Внизу — панель переключения экранов:
   - **Player** — controller panel (seek, FocusSwitch, footer)
   - **Mini list** — список программ над панелью (`layout_controller` recycler)
   - **IPTV Guide** — категории | каналы | программа | detail (`fragment_tv_category`)
3. На экране Guide кнопка **◀ даты** открывает отдельный экран выбора дня (`fragment_tv_date`).
4. Для каждого экрана доступны состояния (playing, loading, empty, error и т.д.).

Данные — mock, логика пульта и API не подключены (только вёрстка и UI-состояния).

## Структура

| Путь | Назначение |
|------|------------|
| `ui/1920/index.html` | Главная точка входа |
| `ui/1920/css/player-v4.css` | Controller panel |
| `ui/1920/css/iptv-v4.css` | IPTV guide + date screen |
| `ui/1920/css/v4-tokens.css` | Design tokens (dimen APK ×2) |
| `assets/v4/icons/` | SVG-иконки из APK |
| `mocks/player-mock.json` | Mock-данные |
