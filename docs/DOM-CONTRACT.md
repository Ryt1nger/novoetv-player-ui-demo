# DOM-контракт плеера (не менять при переносе в Samsung)

Ядро (`player.screen.js`, `sepg.screen.js`, `epg.screen.js`, `screen.js`) привязано к этим id и class.

## player-screen

| id / class | Тип | Назначение |
|------------|-----|------------|
| `player-screen` | id | Корневой экран |
| `playing-error-bar` | id | Ошибка воспроизведения |
| `tv-infobar` | id | Основная панель (+ class `vod` для VOD) |
| `tv-fwdbar` | id | Панель перемотки archive |
| `player-company-logo` | id | Логотип, клик → меню |
| `player-company-logo-img` | id | img логотипа |
| `block-tv-info` | id | Блок infobar |
| `navigation-list` | id | ul кнопок (+ class `selected` на ul) |
| `nav0`…`navN` | id | li кнопок (+ class `selected` на li) |
| `btn-{action}-div` | id | div внутри li |
| `.favorites` `.mycontent` `.stop` `.pause` `.play` | class | Иконки навигации |
| `.multiaudio` `.tvchannels` `.epg` `.mainmenu` `.info` | class | Иконки навигации |
| `.favorites.marked` | class | Канал в избранном |
| `.multiaudio_disabled` | class | Нет мультиаудио |
| `infobar-channel-icon` | id | Контейнер иконки канала |
| `player-channel-icon` | id | img иконки канала |
| `infobar-channel-number` | id | Номер канала (3 цифры) |
| `infobar-channel-name` | id | Название канала |
| `infobar-program-name` | id | Название программы |
| `infobar-program-time` | id | Текущее время |
| `infobar-program-duration` | id | Длительность |
| `infobar-progress-info` | id | Контейнер прогресса |
| `infobar-program-total` | id | Фон таймлайна |
| `infobar-program-progress` | id | Заполнение (width inline) |
| `infobar-program-pin` | id | Красный pin (left inline) |
| `infobar-program-name-fwd` | id | Название в fwd bar |
| `infobar-program-time-fwd` | id | Время в fwd bar |
| `infobar-progress-fwd` | id | Прогресс fwd |
| `infobar-program-total-fwd` | id | |
| `infobar-program-progress-fwd` | id | |
| `infobar-program-pin-fwd` | id | |
| `infobar-program-duration-fwd` | id | |

## sepg-screen

| id / class | Назначение |
|------------|------------|
| `sepg-screen` | Корневой экран |
| `sepg-block-title` | Заголовок |
| `sepg-container` | Контейнер карточек |
| `sepg-menu-list` | ul (+ `selected` на ul) |
| `sepg-channel-0/1/2` | li карточки (+ `selected` на li) |
| `sepg-left-arrow` `sepg-right-arrow` | Стрелки |
| `.sepg-image` `.absolute_img` `.absolute_play` | Постер + play |
| `.sepg-name` `.sepg-line` `.sepg-line-inner` | Текст + прогресс |
| `playing-error-bar-sepg` | Ошибка **воспроизведения** (дубль `#playing-error-bar`), не «нет EPG» |

## epg-screen

| id / class | Назначение |
|------------|------------|
| `epg-screen` | Корневой экран |
| `epg-category` `epg-channel-name` `epg-channel-description` | Заголовки |
| `epg-days-list` | Список дней |
| `epgday0`… | Элементы дней |
| `epg-list` | Список программ |
| `epg0`… | Элементы программ |
| `epg-data-loading` `no-epg-message` | Состояния |
| `program-data` `program-data-loading` | Описание программы |
| `.epg-program-record` `.has-record` `.myrecord` | Иконки записи |
| `.epg-program-time` `.epg-program-name` | Поля программы |

## Глобальные overlay

| id | Назначение |
|----|------------|
| `loading-bar` | Спиннер загрузки видео |
| `aspect-bar` | Бейдж «Видео» / режим |
