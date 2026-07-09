#!/usr/bin/env bash
# Capture NovoeTV 4.000 player states from Android TV emulator via adb.
set -euo pipefail

ADB="${ADB:-$HOME/Library/Android/sdk/platform-tools/adb}"
SERIAL="${SERIAL:-emulator-5554}"
OUT="${1:-$(cd "$(dirname "$0")/.." && pwd)/screenshots/apk-4.000}"
mkdir -p "$OUT"

K_UP=19 K_DOWN=20 K_LEFT=21 K_RIGHT=22 K_CENTER=23 K_BACK=4 K_MENU=82

adb() { "$ADB" -s "$SERIAL" "$@"; }

shot() {
  local name="$1"
  adb exec-out screencap -p > "$OUT/$name"
  echo "saved $OUT/$name"
}

key() {
  adb shell input keyevent "$1"
  sleep "${2:-0.55}"
}

focus() {
  adb shell dumpsys window 2>/dev/null | grep mCurrentFocus | head -1 || true
}

echo "Output: $OUT"
adb wait-for-device
focus

# --- Navigate: home → Live TV → channel → player ---
echo "→ Back to home"
for _ in 1 2 3 4 5 6; do key "$K_BACK" 0.7; done
shot "01-home.png"
focus

echo "→ Sidebar: Live TV (3rd icon)"
key "$K_DOWN"
key "$K_DOWN"
shot "02-sidebar-tv-focused.png"
key "$K_CENTER" 1.2
shot "03-tv-guide.png"
focus

echo "→ Open first channel"
key "$K_CENTER" 2
shot "04-player-loading.png"
focus

echo "→ Show controller"
key "$K_CENTER" 0.8
shot "05-player-live-controller.png"
focus

echo "→ Mini program list (Программа button — right to first action, or down)"
key "$K_RIGHT"
key "$K_RIGHT"
key "$K_CENTER" 0.8
shot "06-player-mini-list.png"

echo "→ Back to controller"
key "$K_BACK" 0.8
shot "07-player-live-playing.png"

echo "→ IPTV guide (if mapped to program button / EPG key)"
key "$K_MENU" 0.8
shot "08-player-epg-attempt.png" || true

echo "Done. Review shots in $OUT"
ls -la "$OUT"/*.png | tail -20
