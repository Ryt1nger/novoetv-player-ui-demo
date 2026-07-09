# Аудит: player-reference vs NovoeTV APK 4.000

**Дата:** 2026-07-08  
**Цель:** привести вёрстку плеера 1:1 к нативному UI APK 4.000  
**Источники:**
- Эталон: `apk-analysis/new-4.000/decoded-res/` + `resolved-keys.json`
- Текущее: `player-reference/ui/1920/` + `player-v4.css` + `player-ui.js`
- Легаси: `apk-analysis/raw/` (3.038 WebView) — уже не целевой UI

> **Обновление 2026-07-08:** APK `app-autoUpdater-anton-debug-4.000.apk` получен и просканирован.  
> Этап 0 частично выполнен: ассеты в `assets/v4/icons/`, `fragment_tv_category.xml` декодирован, `DOM-CONTRACT-4.000.md` создан.  
> Pixel-сравнение: скрины в `screenshots/audit-v4/` (browser preview, не эмулятор).

---

## 1. Архитектура

| | 3.038 (legacy) | 4.000 (target) | player-reference сейчас |
|--|----------------|----------------|-------------------------|
| Стек | WebView HTML/CSS | Native Kotlin + ExoPlayer + Jetpack TV | HTML/CSS preview |
| Пакет | `de.soft.novoetv.smart` | `de.soft.novoetv.novoetvapplication` | — |
| Контроллер | `#tv-infobar` 1760×286, `#051A31` | `layout_controller.xml`, panel `#6E000000` | **частично v4** (`#player-controller`) |
| Mini-EPG | `#sepg-screen`, 3 карточки | **нет** отдельного sepg; вертикальный RecyclerView над controller | **всё ещё 3.038** |
| Full EPG | 3 колонки float | 4 зоны `fragment_tv_*` | **всё ещё 3.038** |
| DOM-контракт | id из 3.038 (ядро Samsung) | новые id натива | **гибрид**: визуал v4, контракт 3.038 ломается |

**Вывод:** это не «подкрутить тему», а замена оболочки плеера под другой UI-стек. Старые `#tv-infobar` / `#navigation-panel` / `#tv-fwdbar` в v4 уже скрыты CSS, но SEPG и Full EPG — старые.

---

## 2. Плеер (controller) — детальное сравнение

### 2.1 Токены 4.000 (dip ×2 @ 1920×1080)

| Токен | dip | px (×2) | Значение |
|-------|-----|---------|----------|
| Accent | — | — | `#86DBFF` |
| Panel bg | — | — | `#6E000000` (~43% black) |
| Seek track | — | — | `#70FFFFFF` |
| Icon circle | — | — | `#1AFFFFFF` |
| Footer bg | — | — | `#26000000` |
| Panel maxH | 172 | **344** | |
| Logo badge | 60×45.5 | **120×91** | `img_logo_player.png` |
| Poster | 48 | **96** | |
| Footer H | ~36 | **72** | «Просмотр» + часы |
| Channel name | 21sp | **42px** | |
| Program / time | 15sp | **30px** | |

### 2.2 Кнопки FocusSwitch (4.000)

| Порядок | focusedText | Иконка drawable | Видимость в layout |
|---------|-------------|-----------------|-------------------|
| 0 (optional) | **Эфир** | `sel_btn_nav_player` | `visibility=gone` по умолчанию |
| 1 | **Программа** | `ic_program.xml` | visible |
| 2 | **Инфо** | `ic_info.xml` | `visibility=gone` |
| 3 | **Буду смотреть** | `ic_watch.xml` | visible |
| 4 | **Добавить в Избранное** | `ic_favorite.xml` | visible |

### 2.3 Что уже сделано в player-reference (v4)

| Элемент | Статус |
|---------|--------|
| `#player-controller` структура | ✅ |
| gradient + logo badge 120×91 | ✅ (есть `assets/v4/img_logo_player.png`) |
| panel `#6E000000`, max-height 344 | ✅ |
| seek accent `#86DBFF`, track 44% white | ✅ |
| poster 96×96 | ✅ |
| FocusSwitch + labels on focus | ✅ (SVG, не xml-drawable) |
| footer «Просмотр» + clock | ✅ |
| hide `#tv-infobar` / `#tv-fwdbar` / `#navigation-panel` | ✅ |
| aspect-bar справа по центру | ✅ |
| loading по центру | ✅ |
| `btn-live` «Эфир» | ✅ (toggle) |

### 2.4 Несостыковки плеера (P0)

| # | Проблема | Эталон 4.000 | Сейчас |
|---|----------|--------------|--------|
| P0-1 | **Нет иконок из APK** | `ic_program`, `ic_watch`, `ic_favorite`, `ic_info`, `ic_footer_hint_back` | Inline SVG |
| P0-2 | **Нет вертикального списка программ над controller** | `DpadRecyclerView` в `layout_controller` (id cyclic layout, visibility gone→show) | Отсутствует; остался `#sepg-screen` 3.038 |
| P0-3 | **Fwd bar спрятан, но логика/API archive не заменена** | Нет отдельного fwdbar; seek в controller | `showFwdBar()` ещё в UI API |
| P0-4 | **DOM-контракт 3.038 vs v4** | Нативный | `DOM-CONTRACT.md` описывает `tv-infobar`, `nav0…`, pin 50px — **устарел** |
| P0-5 | **Нет скринов эталона 4.000** | Emulator screenshots | Только layouts/res; pixel-audit невозможен |
| P0-6 | Seek thumb | `sel_seekbar_thumb.xml` | Круг 18px — ок по смыслу, нет drawable/sel states |
| P0-7 | Gradient bottom | `bg_gradient_episodes_overlay.xml` | Кастомный linear-gradient — проверить высоту vs `@7F0701D8` |

### 2.5 Несостыковки плеера (P1)

| # | Проблема | Деталь |
|---|----------|--------|
| P1-1 | Кнопка «Инфо» | В layout `visibility=gone`; сейчас может рендериться иначе — сверить с `ACTION_BUTTONS` |
| P1-2 | Шрифт | 4.000: `fontFamily=@7F090000`; у нас `mvideo.ttf` / system — проверить |
| P1-3 | Message overlay | `bg_player_message_overlay`, maxWidth 400dip (800px), справа по центру | aspect/error близко, но отступы 24/16/48 dip |
| P1-4 | Нет номера канала | В 4.000 нет — ок; убедиться что не торчит из legacy CSS |
| P1-5 | `PlayerView` / Exo controls | `use_controller=false` — наш preview с mock-video ок |

---

## 3. Mini-EPG (SEPG)

| | 3.038 | 4.000 | reference |
|--|-------|-------|-----------|
| Экран | `#sepg-screen`, 3× карточки 480×110 | **Удалён как отдельный экран** | **legacy HTML+CSS** |
| Альтернатива | — | 1) вертикальный Recycler над controller 2) «Программа» → IPTV guide | sepg-ui.js 3.038 |

**Разрыв:** полная замена SEPG. Либо stub (скрыть sepg + вести в guide), либо новый `#controller-program-list`.

---

## 4. Full EPG (IPTV Guide)

Эталон — 4 фрагмента:

| Фрагмент | Роль |
|---------|------|
| `fragment_tv_date.xml` | Даты / сайдбар + back caret + заголовок |
| `fragment_tv_channel.xml` | Список каналов + loading |
| `fragment_tv_program.xml` | Список программ + loading + empty |
| `fragment_tv_detail.xml` | Постер, «Смотреть»/Эфир, Watch later, title, desc |
| `item_tv_channel.xml` | Строка канала: лого + имя + текущая программа + время |
| `item_tv_program.xml` | Строка программы: focus white bg / time / title |

Focus accent **`#86DBFF`**, выбранная программа — **белый фон / чёрный текст** (из селекторов drawables).

**Сейчас:** `#epg-screen` 3 колонки, `#18bbcc`, float — **полная несостыковка с 4.000**.

---

## 5. DOM / merge-риск

`docs/DOM-CONTRACT.md` = контракт **3.038** для Samsung-ядра (`player.screen.js`).

При переходе на 4.000 визуал:
1. Либо ядро меняет селекторы под `#player-controller` / FocusSwitch / `#iptv-guide`
2. Либо сохраняем dual-layer: новые визуальные id + адаптер, который дергает старые id (нежелательно)

**Нужно:** новый `DOM-CONTRACT-4.000.md` до начала этапа 2 UI-работ.

---

## 6. Что не закрыто без APK/эмулятора

- Pixel-perfect отступы paddingHorizontal `@7F070053`, margins panel/footer
- Реальные drawable иконок и seek thumb states (focused/pressed)
- Поведение «открыть вертикальный список программ» vs сразу guide
- Шрифт / letter-spacing item rows
- Состояния избранного (marked), Live-кнопки в archive

---

## 7. Сводка разрывов по приоритету

### P0 — блокер 1:1
1. Нет эталонных скринов / APK 4.000 для pixel-audit  
2. SEPG всё ещё 3.038  
3. Full EPG всё ещё 3.038  
4. Нет XML-иконок из APK (только SVG)  
5. Нет вертикального program-list над controller  
6. Устаревший DOM-CONTRACT  

### P1 — важно для визуала
7. Шрифт / typography scale  
8. Exact padding/margins из dimen  
9. Message overlay geometry  
10. Info button visibility + Live button states  
11. Обновить audit-скрипты под v4 states  

### P2 — polish
12. Seek thumb drawable states  
13. Gradient drawable 1:1  
14. Анимации show/hide controller  
15. Empty/loading states guide  

---

## 8. Поэтапный план правок (к 1:1 с APK 4.000)

### Этап 0 — Материалы (0.5 дня) ← **частично ✅**
- [x] Получить APK 4.000 (`app-autoUpdater-anton-debug-4.000.apk`)
- [x] Доэкстрагировать drawables → `assets/v4/icons/` (SVG из vector XML)
- [x] Декодировать `fragment_tv_category.xml` → `apk-analysis/new-4.000/decoded-res/`
- [x] Зафиксировать `docs/DOM-CONTRACT-4.000.md`
- [ ] Скрины с эмулятора 4.000 (есть browser audit `screenshots/audit-v4/`)
- [ ] Решение по SEPG: **A)** program-list над controller **B)** только guide — реализовано **A** (кнопка «Программа» → mini list)

**Критерий выхода:** есть скрины + ассеты + контракт.

### Этап 1 — Player controller pixel-lock (1–1.5 дня) ← **в работе**
- [x] Заменить SVG на ассеты из APK  
- [x] Сверить размеры/отступы с dimen ×2 (`docs/token-map-v4.json`)  
- [x] Seek thumb = `ic_seekbar_thumb.svg` (48dip)  
- [x] Gradient по `bg_gradient_episodes_overlay.xml`  
- [x] Footer hint = `ic_footer_hint_back`  
- [ ] Pixel-сверка со скрином эмулятора (browser audit: `screenshots/audit-v4/`)  
- [ ] Шрифт app font vs `mvideo.ttf`  

**Критерий:** плеер live/paused/error визуально совпадает со скрином.

### Этап 2 — Program rail (замена SEPG) (1 день)
- [ ] Новый блок `#controller-program-list` (вертикальный список над panel)  
- [ ] Или: скрыть `#sepg-screen`, кнопка «Программа» → open guide  
- [ ] Удалить/архивировать `sepg-ui.js` 3.038 из основного preview (`docs/legacy/`)  
- [ ] Обновить `app-preview.js` + audit  

**Критерий:** нет 3-карточного sepg в основном флоу.

### Этап 3 — IPTV Guide 4+1 pane (2–3 дня) ← **в работе**
- [x] Layout: back | categories | dates | channels | programs | detail  
- [x] Category pane (`fragment_tv_category.xml`, 21.86%)  
- [x] Items: channel number + logo + epg + time (`item_tv_channel`)  
- [x] Program focus gradient + selected white (`sel_item_program`)  
- [x] Loading spinner (program + channel panes)  
- [x] Detail: poster, Смотреть, Watch later (APK icons)  
- [ ] Pixel-сверка колонок со скрином эмулятора  
- [ ] Date pane ↔ fragment_tv_date (отдельная навигация в APK)  

### Этап 4 — Склейка + аудит (1 день)
- [x] `index.html` — единая точка входа  
- [x] Legacy HTML → redirect на `index.html`  
- [x] `scripts/audit-all.mjs` под 4.000 states  
- [ ] `docs/AUDIT-4.000-RESULT.md` side-by-side  
- [ ] Закрыть оставшиеся P1 (шрифт, анимации controller)  

**Критерий:** закрыты P0; список P1/P2 зафиксирован.

### Этап 5 — Merge в Samsung (вне vёрстки)
- [ ] Адаптация `player.screen.js` / keys под новый DOM  
- [ ] Не трогать видео/API в reference — только прокидка id  

---

## 9. Рекомендуемый порядок старта прямо сейчас

1. **Пришлите APK 4.000** (или скрины плеера + EPG) — без них audit останется structural, не pixel.  
2. Этап 0: контракт + ассеты.  
3. Этап 1: дожать controller.  
4. Этап 2–3: убить 3.038 SEPG/EPG.  

---

## 10. Краткая матрица «готово / нет»

| Модуль | vs 4.000 |
|--------|----------|
| Player shell / tokens | ~70% |
| Player icons/drawables | ~30% |
| Player program rail | 0% |
| Mini-EPG 3.038 | устарел (должен уйти) |
| Full EPG 3.038 | устарел (должен уйти) |
| IPTV Guide 4-pane | 0% |
| Pixel-audit vs emulator | blocked (нет APK/скринов) |
| DOM-CONTRACT 4.000 | нет |

**Вердикт:** база controller v4 есть, но **1:1 с 4.000 не достигнуто** — SEPG/EPG легаси, нет program-rail, нет guide, нет pixel-эталона, DOM-контракт старый.
