#!/usr/bin/env bash
# Full APK 4.000 player screenshot capture (coordinate-aware).
set -euo pipefail

ADB_BIN="${ADB:-$HOME/Library/Android/sdk/platform-tools/adb}"
SERIAL="${SERIAL:-emulator-5554}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/screenshots/apk-4.000/emu-scan"
PKG="de.soft.novoetv.novoetvapplication"
MAIN="$PKG/novoetv.android.tv.MainActivity"
PLAYER="$PKG/novoetv.android.tv.ui.player.ActivityPlayer"
MIN_BYTES="${MIN_BYTES:-250000}"

mkdir -p "$OUT"

adb() { "$ADB_BIN" -s "$SERIAL" "$@"; }
key() { adb shell input keyevent "$1"; sleep "${2:-0.75}"; }
tap() { adb shell input tap "$1" "$2"; sleep "${3:-1.0}"; }
focus() { adb shell dumpsys window 2>/dev/null | grep mCurrentFocus | head -1 | sed 's/^ *//'; }

shot() {
  local name="$1"
  adb exec-out screencap -p > "$OUT/$name"
  local sz
  sz=$(wc -c < "$OUT/$name" | tr -d ' ')
  if [ "$sz" -lt "$MIN_BYTES" ]; then
    echo "⚠ $name ($sz bytes) — слишком маленький"
    return 1
  fi
  echo "✓ $name ($sz bytes)"
}

dump_ui() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb shell cat /sdcard/ui.xml
}

tap_id_center() {
  local id="$1"
  local xml
  xml=$(dump_ui)
  local b
  b=$(echo "$xml" | tr '>' '\n' | grep "id/$id\"" | grep -o 'bounds="[^"]*"' | head -1 | cut -d'"' -f2)
  if [ -z "$b" ]; then
    echo "  id $id not found"
    return 1
  fi
  local x1 y1 x2 y2 cx cy
  x1=$(echo "$b" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\1/')
  y1=$(echo "$b" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\2/')
  x2=$(echo "$b" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\3/')
  y2=$(echo "$b" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\4/')
  cx=$(( (x1 + x2) / 2 ))
  cy=$(( (y1 + y2) / 2 ))
  echo "  tap $id @ $cx,$cy"
  tap "$cx" "$cy" "${2:-1.2}"
}

K_UP=19 K_DOWN=20 K_LEFT=21 K_RIGHT=22 K_CENTER=23 K_BACK=4
K_PLAY_PAUSE=85

echo "=== NovoeTV 4.000 full capture ==="
echo "OUT: $OUT"
adb wait-for-device

# ── IPTV guide + dates (from home) ─────────────────────────────
adb shell am force-stop "$PKG"
sleep 1
adb shell am start -n "$MAIN"
sleep 7
focus

key "$K_LEFT"
key "$K_DOWN"
key "$K_DOWN"
key "$K_CENTER" 2
shot "10-iptv-guide.png" || true

# Open full date screen: focus left dates column, go to dedicated date view
key "$K_LEFT" 1.2
key "$K_CENTER" 1.5
shot "11-iptv-dates.png" || true
key "$K_BACK" 0.8

# Play selected program
key "$K_RIGHT"
key "$K_CENTER" 4
focus
shot "01-live-loading.png" || true
sleep 4
shot "16-player-loading.png" || true

# Hide controller
key "$K_BACK"
key "$K_BACK" 1
shot "02-live-playing.png" || true

# Live controller
key "$K_CENTER" 1.5
shot "03-live-controller.png" || true

# Focus program/calendar button
tap_id_center "fw_program" 0.5 || tap 1675 845 0.5
shot "04-live-focus-program.png" || true

# Mini list via watch button
tap_id_center "fw_watch" 1.5 || tap 1754 845 1.5
shot "05-mini-list.png" || true
key "$K_BACK" 0.8

# Archive: seek to beginning of timeline
key "$K_CENTER" 0.8
tap 350 782 0.5
key "$K_CENTER" 1.2
shot "06-archive-seek.png" || true
shot "07-archive-controller.png" || true

# Paused
key "$K_PLAY_PAUSE" 1.2
shot "08-paused.png" || true
key "$K_PLAY_PAUSE" 0.8

# Favorite
key "$K_CENTER" 0.8
tap_id_center "fw_favorite" 1.0 || tap 1833 845 1.0
shot "09-fav-marked.png" || true

# Program guide overlay from player (calendar)
key "$K_CENTER" 0.8
tap_id_center "fw_program" 2.0 || tap 1675 845 2.0
shot "02-tv-guide-overlay.png" || true
key "$K_BACK" 1.0
key "$K_BACK" 0.8

# Error state: cold start player without waiting for stream
adb shell am force-stop "$PKG"
sleep 1
adb shell am start -n "$PLAYER"
sleep 2
key "$K_CENTER" 1.0
shot "12-error.png" || true

# Clean video frame
adb shell am start -n "$PLAYER"
sleep 4
key "$K_BACK" 1.5
shot "13-player-clean.png" || true

# Resume good stream for legacy names
adb shell am force-stop "$PKG"
adb shell am start -n "$MAIN"
sleep 6
key "$K_LEFT"
key "$K_DOWN"
key "$K_DOWN"
key "$K_CENTER" 1.5
key "$K_RIGHT"
key "$K_CENTER" 4
key "$K_CENTER" 1.5
shot "04-player-controller.png" || true
shot "05-player-playing.png" || true

echo ""
echo "=== Summary ==="
ls -la "$OUT"/*.png | awk '{printf "%8d %s\n", $5, $9}' | sort -n
focus
