#!/usr/bin/env bash
# Interactive capture: YOU navigate emulator, script saves screenshots.
# Usage: ./capture-apk-player-interactive.sh
set -euo pipefail

ADB="${ADB:-$HOME/Library/Android/sdk/platform-tools/adb}"
SERIAL="${SERIAL:-emulator-5554}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/screenshots/apk-4.000/emu-scan"
mkdir -p "$OUT"

adb() { "$ADB" -s "$SERIAL" "$@"; }

shot() {
  local name="$1"
  adb exec-out screencap -p > "$OUT/$name"
  echo "  → $OUT/$name"
}

echo "NovoeTV 4.000 — интерактивная съёмка плеера"
echo "Папка: $OUT"
echo ""
adb wait-for-device
echo "Текущий фокус: $(adb shell dumpsys window 2>/dev/null | grep mCurrentFocus | head -1)"
echo ""

steps=(
  "01-live-loading|Прямой эфир: открой канал, дождись загрузки (спиннер + controller)"
  "02-live-playing|Прямой эфир: видео идёт, controller скрыт"
  "03-live-controller|Прямой эфир: OK — показать controller + badge «Прямой эфир»"
  "04-live-focus-program|Фокус на кнопке «Программа» (mini list)"
  "05-mini-list|Mini program list (recycler над panel)"
  "06-archive-seek|Архив: открой запись, seek + кнопка «Эфир»"
  "07-archive-controller|Архив: controller с перемоткой"
  "08-paused|Пауза"
  "09-fav-marked|Избранное отмечено (♥ filled)"
  "10-iptv-guide|IPTV guide (полная программа)"
  "11-iptv-dates|Экран выбора даты"
  "12-error|Ошибка воспроизведения (если есть)"
)

for item in "${steps[@]}"; do
  file="${item%%|*}"
  hint="${item#*|}"
  echo "────────────────────────────────────────"
  echo "[$file] $hint"
  read -r -p "Enter = снять скрин, s = пропустить, q = выход: " ans
  case "${ans:-}" in
    q|Q) echo "Выход."; exit 0 ;;
    s|S) echo "  пропуск"; continue ;;
    *) shot "$file.png" ;;
  esac
done

echo ""
echo "Готово: $OUT"
ls -la "$OUT"/*.png 2>/dev/null || true
