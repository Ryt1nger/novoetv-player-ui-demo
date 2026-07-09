# Скрины APK 4.000 — плеер (эмулятор)

## Состояния плеера (да, они разные)

| Режим | Badge справа | Seek | Кнопка «Эфир» | Mini list |
|-------|----------------|------|---------------|-----------|
| **Прямой эфир** (live) | «Прямой эфир» | нет / минимальный | скрыта | по кнопке «Программа» |
| **Архив** (archive) | «Архив» | да, cyan thumb | **видна** — вернуться в эфир | да |
| **Видео** (VOD) | «Видео» | да | скрыта | по контексту |

Это не два разных экрана, а **один** `ActivityPlayer` + `layout_controller.xml` с разными overlay-состояниями.

## Папки

| Путь | Содержимое |
|------|------------|
| `reference/` | Уже снятые кадры (home, splash, FIFA, no-network) |
| `emu-scan/` | **Сюда кладём эталон плеера** (интерактивная съёмка) |
| `assets/` | PNG/XML из APK |

## Как снять эталон плеера

### 1. Эмулятор: интернет + логин

Сейчас на эмуляторе: **«Нет подключения»** — без сети канал не откроется.

### 2. Интерактивный скрипт (рекомендуется)

```bash
chmod +x player-reference/scripts/capture-apk-player-interactive.sh
player-reference/scripts/capture-apk-player-interactive.sh
```

На каждом шаге выводится подсказка → вы наводите UI на эмуляторе → Enter.

### 3. Быстрый одиночный скрин

```bash
ADB=~/Library/Android/sdk/platform-tools/adb
$ADB -s emulator-5554 exec-out screencap -p > player-reference/screenshots/apk-4.000/emu-scan/manual.png
```

## Снято с эмулятора (2026-07-08, полный прогон)

Папка `emu-scan/` — **нативный APK 4.000**. Каналы: Матч! ТВ, Первый.

| Файл | Состояние |
|------|-----------|
| `01-live-loading.png` | Загрузка канала |
| `02-live-playing.png` | Видео без UI (или минимальный overlay) |
| `03-live-controller.png` | **Прямой эфир** + controller |
| `04-live-focus-program.png` | Фокус на кнопке «Программа» |
| `04-player-controller.png` | **Архив** — «Архив» + «Эфир» + seek |
| `05-mini-list.png` | Панель программы / закладка |
| `05-player-playing.png` | Controller (архив/эфир) |
| `06-archive-seek.png` | Архив с перемоткой |
| `07-archive-controller.png` | Controller в архиве |
| `08-paused.png` | Пауза (cyan thumb) |
| `09-fav-marked.png` | Избранное / «Добавить в Избранное» |
| `10-iptv-guide.png` | IPTV guide — 3 колонки |
| `11-iptv-dates.png` | EPG с колонкой дат (Первый) |
| `12-error.png` | Ошибка «Не удалось загрузить трансляцию» |
| `13-player-clean.png` | Чистый кадр видео |
| `02-tv-guide-overlay.png` | Program detail из плеера |
| `16-player-loading.png` | Видео при старте (без controller) |
| `00-main-home.png` | Home |

Копии: `apk-analysis/new-4.000/emu-*.png`

Скрипты:
```bash
player-reference/scripts/capture-apk-player-scan.sh      # быстрый
player-reference/scripts/capture-apk-player-full.sh      # полный чеклист
player-reference/scripts/capture-apk-player-interactive.sh
```

## Не путать с браузерным demo

`apk-analysis/new-4.000/demo-v4-*.png` — это **наш preview в Chrome** (с dev-panel), не нативный APK.
