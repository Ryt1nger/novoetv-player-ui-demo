# DOM-контракт NovoeTV 4.000 (для merge в Samsung ядро)

**Версия:** APK 4.000 (`de.soft.novoetv.novoetvapplication`)  
**Заменяет:** `DOM-CONTRACT.md` (APK 3.038 WebView)  
**Источник layout:** `apk-analysis/new-4.000/decoded-res/`

> Старые id (`#tv-infobar`, `#sepg-screen`, `#epg-screen` 3.038) **не использовать** в новом ядре.  
> Допускается dual-layer на переходный период: v4 DOM + адаптер в `player.screen.js`.

---

## Глобальные overlay

| id | Назначение | APK |
|----|------------|-----|
| `loading-bar` | Спиннер загрузки видео | `activity_player_tv` ProgressBar |
| `aspect-bar` | Hint «Прямой эфир» / «Архив» / «Видео» | `tv_message` overlay |
| `playing-error-bar` | Ошибка воспроизведения на player | message overlay |

---

## player-screen

| id / class | Тип | Назначение | APK layout |
|------------|-----|------------|------------|
| `player-screen` | id | Корневой экран | activity host |
| `player-controller` | id | Controller panel (замена `tv-infobar`) | `layout_controller.xml` |
| `controller-gradient` | id | Нижний градиент | `bg_gradient_episodes_overlay` |
| `controller-logo-badge` | id | Badge логотипа оператора | RelativeLayout above panel |
| `controller-logo` | id | img `img_logo_player.png` | ImageView |
| `controller-panel` | id | Панель seek + meta + actions | LinearLayout `#6E000000` |
| `controller-seek-block` | id | Блок seekbar | seek row |
| `controller-center-title` | id | Центральный заголовок (archive seek) | TextView, visibility gone |
| `controller-meta-row` | class | Строка канал + кнопки | RelativeLayout |
| `controller-actions` | id | Контейнер FocusSwitch + «Эфир» | LinearLayout end |
| `controller-footer` | id | Footer «Просмотр» + часы | LinearLayout `#26000000` |
| `footer-clock` | id | Текущие дата/время | TextView |
| `btn-live` | id | Кнопка «Эфир» (archive) | TextView, visibility gone в live |
| `focus-switch` | class | Кнопка FocusSwitch | FocusSwitchView |
| `data-action` | attr | `program` \| `watch` \| `favorite` | focusedText |
| `focus-switch.focused` / `.selected` | class | Фокус D-pad | stroke `#86DBFF` |
| `focus-switch.marked` | class | Избранное активно | `ic_favorite_filled` |
| `player-channel-icon` | id | Постер канала 96×96 | ImageView 48dip |
| `infobar-channel-name` | id | Название канала | TextView 21sp |
| `infobar-program-name` | id | Название программы | TextView 15sp |
| `program-tag` | id | Тег программы (опционально) | TextView |
| `infobar-program-time` | id | Текущее время seek | TextView |
| `infobar-program-duration` | id | Длительность | TextView |
| `infobar-progress-info` | id | Контейнер seek | MediaAppCompatSeekBar |
| `infobar-program-total` | id | Track фон | progressBackgroundTint |
| `infobar-program-progress` | id | Track fill | progressTint `#86DBFF` |
| `infobar-program-pin` | id | Thumb seek | `sel_seekbar_thumb` |

### Удалено в 4.000 (не создавать в ядре)

| id 3.038 | Причина |
|----------|---------|
| `tv-infobar` | Заменён `player-controller` |
| `tv-fwdbar` | Seek в controller |
| `navigation-list`, `nav0`…`navN` | Заменены FocusSwitch |
| `infobar-channel-number` | Нет в layout 4.000 |
| `player-company-logo` | Заменён `controller-logo-badge` |

---

## controller-recycler (mini program list)

Замена `#sepg-screen` (3 карточки 3.038).

| id / class | Назначение | APK |
|------------|------------|-----|
| `controller-recycler-wrap` | Обёртка списка над panel (padding 24dip) | LinearLayout |
| `controller-recycler` | Контейнер списка | VerticalCyclicFrameLayout |
| `controller-list` | ul программ | DpadRecyclerView |
| `controller-list li.selected` | Текущая программа | white bg / black text |
| `.recycler-time` | Время | |
| `.recycler-name` | Название | |
| `.recycler-play` | Иконка play | `ic_play_program` |
| `playing-error-bar-sepg` | Ошибка архива поверх списка | stream error |
| `player-toast` | Toast «Передача добавлена…» | `bg_player_message_overlay` |
| `program-info-overlay` | Описание программы над controller | program info layer |
| `program-info-text` | Текст описания | TextView |
| `program-info-accent` | Красная полоса слева | accent bar |

### Channel-first EPG (из плеера)

| id / class | Назначение |
|------------|------------|
| `iptv-inline-dates-pane` | Колонка дат + header канала |
| `iptv-inline-back` | Назад из channel-first |
| `iptv-inline-channel-logo` | Лого канала в header |
| `iptv-inline-channel-name` | Имя канала |
| `iptv-inline-date-list` | ul дней (inline) |
| `#iptv-guide.channel-first` | Режим 2–3 колонки без category/channel |

---

## iptv-guide (full EPG)

Замена `#epg-screen` (3 колонки 3.038). Host: `fragment_tv_category.xml`.

| id / class | Назначение | APK fragment |
|------------|------------|--------------|
| `iptv-guide` | Корневой guide (category \| channel \| program \| detail?) | `fragment_tv_category` |
| `iptv-guide.has-detail` | 4 колонки с detail pane | detail FragmentContainerView visible |
| `iptv-category-pane` | Категории + поиск | left 21.86% FrameLayout |
| `iptv-category-search` | Поле поиска каналов | search LinearLayout |
| `iptv-category-list` | ul категорий | DpadRecyclerView `#7F0B016A` |
| `iptv-date-screen` | Отдельный fullscreen экран дат | `fragment_tv_date` |
| `iptv-date-back` | Кнопка назад на экране дат | ImageView back |
| `iptv-date-list` | ul дней | VerticalGridView |
| `iptv-date-header-logo` | Лого канала в header дат | ImageView |
| `iptv-date-header-channel` | Имя канала в header дат | TextView |
| `iptv-channel-pane` | Список каналов (без header) | `fragment_tv_channel` |
| `iptv-channel-list` | ul каналов | DpadRecyclerView |
| `iptv-channel-loading` | Loading каналов | CircularProgressIndicator |
| `iptv-program-pane` | Список программ (без header) | `fragment_tv_program` |
| `iptv-program-list` | ul программ | DpadRecyclerView |
| `iptv-program-loading` | Loading | CircularProgressIndicator |
| `iptv-program-empty` | Empty state | TextView |
| `iptv-detail-pane` | Описание программы | `fragment_tv_detail` |
| `iptv-detail-poster` | Постер 242×367 | ImageView |
| `iptv-detail-stream` | Кнопка «Смотреть» | TextView |
| `iptv-detail-watch` | «Буду смотреть» | FocusSwitchView |
| `iptv-detail-title` | Заголовок | TextView |
| `iptv-detail-description` | Описание | TextView |
| `iptv-detail-time` | Время эфира | TextView |
| `iptv-detail-rating` | Возрастной рейтинг | TextView |

### Focus / selected states

| class | Эффект |
|-------|--------|
| `.focused` | outline / stroke `#86DBFF` |
| `.selected` (program row) | white bg, black text |
| `.selected` (channel/date) | accent tint bg |
| `.current` (program) | green progress bar |

---

## JS API (preview only — не merge в production)

| Модуль | Методы для dev-panel |
|--------|---------------------|
| `PlayerUI` | `showInfobar`, `setChannel`, `setProgress`, `setActionFocus`, `setFavoritesMarked`, `setArchiveControls` |
| `SepgUI` | `applyDemo`, `hide`, `shiftLeft`, `shiftRight` → `#controller-recycler-wrap` |
| `EpgUI` | `applyDemo`, `setFocusedColumn`, `showDateScreen`, `hideDateScreen`, `shiftSelection`, `hide` → `#iptv-guide` / `#iptv-date-screen` |
| `AppPreview` | `showScreen('player'\|'sepg'\|'epg')`, `showGuideOverlay`, `closeGuideOverlay` |

---

## Merge checklist (ядро Samsung)

- [ ] `player.screen.js` → селекторы `#player-controller`, не `#tv-infobar`
- [ ] Mini-EPG key → `#controller-recycler` / кнопка «Программа»
- [ ] Full EPG → `#iptv-guide`, не `#epg-screen`
- [ ] Focus nav → `.focus-switch[data-action]`, не `#navigation-list`
- [ ] Seek → `#infobar-progress-info` (id сохранены для совместимости полей времени)
- [ ] CSS: `player-v4.css`, `iptv-v4.css` (не `player.css` infobar 3.038)
