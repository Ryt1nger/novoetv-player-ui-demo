# Merge в GitLab `feature/player` (NovoeTV 4.000)

Когда будет доступ к репозиторию Samsung TV.

## 1. Подготовка

```bash
git clone <samsung-repo-url>
cd <repo>
git checkout dev
git checkout -b feature/player-4.000
```

## 2. Что переносить из `player-reference/`

```
player-reference/ui/1920/index.html     → фрагменты в главный index.html репо
player-reference/ui/1920/css/base.css
player-reference/ui/1920/css/player-v4.css   ← новый controller (не player.css infobar 3.038)
player-reference/ui/1920/css/iptv-v4.css     ← guide + program rail
player-reference/assets/v4/                  → img/icons оператора
player-reference/ui/1920/mvideo.ttf
player-reference/docs/DOM-CONTRACT-4.000.md  ← контракт для ядра
```

**Не merge (dev-only):**
- `ui/js/player-ui.js`, `sepg-ui.js`, `epg-ui.js`, `app-preview.js`
- `ui/1920/player.html`, `sepg.html`, `epg.html` (legacy 3.038)
- `scripts/audit-*.mjs`, `screenshots/`
- `mocks/` (кроме фикстур по согласованию)

## 3. DOM-контракт 4.000

Использовать **`DOM-CONTRACT-4.000.md`**, не `DOM-CONTRACT.md` (3.038).

Критичные блоки:
- `#player-controller` (замена `#tv-infobar`)
- `#controller-recycler`, `#controller-list` (замена `#sepg-screen`)
- `#iptv-guide`, `#iptv-category-list`, `#iptv-date-list`, `#iptv-channel-list`, `#iptv-program-list`, `#iptv-detail-*`
- `#loading-bar`, `#aspect-bar` — **вне** `#player-screen`

## 4. Адаптация ядра

| Файл ядра | Изменение |
|-----------|-----------|
| `player.screen.js` | Селекторы `#player-controller`, `.focus-switch`, seek ids |
| `sepg.screen.js` | `#controller-recycler` вместо `#sepg-channel-*` |
| `epg.screen.js` | `#iptv-guide` вместо `#epg-screen` |
| `screen.js` | Навигация на новые overlay id |

Preview API (`PlayerUI`, `SepgUI`, `EpgUI`) **не** подключать в production.

## 5. MR checklist

- [ ] DOM id/class совпадают с `DOM-CONTRACT-4.000.md`
- [ ] CSS: `player-v4.css` + `iptv-v4.css` (без 3.038 infobar)
- [ ] Скрины `screenshots/audit-all/` приложены к MR
- [ ] Full EPG (IPTV guide) открывается из TV
- [ ] MR → `dev`, не в `main` напрямую
