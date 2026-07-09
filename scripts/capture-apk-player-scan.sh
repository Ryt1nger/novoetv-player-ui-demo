#!/usr/bin/env bash
set -euo pipefail

ADB_BIN="${ADB:-$HOME/Library/Android/sdk/platform-tools/adb}"
SERIAL="${SERIAL:-emulator-5554}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/screenshots/apk-4.000/emu-scan"
PKG="de.soft.novoetv.novoetvapplication"
APK="${APK:-/Users/a1111/Downloads/app-autoUpdater-anton-debug-4.000.apk}"

mkdir -p "$OUT"

adb() { "$ADB_BIN" -s "$SERIAL" "$@"; }

shot() { adb exec-out screencap -p > "$OUT/$1"; echo "✓ $1"; }
key() { adb shell input keyevent "$1"; sleep "${2:-0.65}"; }
tap() { adb shell input tap "$1" "$2"; sleep "${3:-0.9}"; }
focus() { adb shell dumpsys window 2>/dev/null | grep mCurrentFocus | head -1 || true; }

K_UP=19 K_DOWN=20 K_LEFT=21 K_RIGHT=22 K_CENTER=23 K_BACK=4

echo "=== NovoeTV player scan ==="
echo "OUT: $OUT"
adb wait-for-device

if ! adb shell pm list packages | grep -q "$PKG"; then
  adb install -r "$APK"
fi

adb shell am force-stop "$PKG"
sleep 1
adb shell am start -n "$PKG/novoetv.android.tv.MainActivity"
sleep 6
shot "00-main-home.png"
focus

# Sidebar: Home is default. Down to Live TV (3rd icon ~ y=280)
echo "→ Live TV"
key "$K_LEFT"
key "$K_DOWN"
key "$K_DOWN"
shot "01-sidebar-tv.png"
key "$K_CENTER" 1.5
shot "02-tv-guide.png"
focus

echo "→ Open channel"
key "$K_RIGHT"
key "$K_CENTER" 3
shot "03-player-loading.png"
focus

echo "→ Controller"
key "$K_CENTER"
shot "04-player-controller.png"
sleep 2
shot "05-player-playing.png"

echo "→ Focus actions"
key "$K_RIGHT"
key "$K_RIGHT"
shot "06-focus-watch.png"
key "$K_LEFT"
key "$K_LEFT"
key "$K_CENTER" 0.8
shot "07-mini-list.png"

echo "→ Back hide overlay"
key "$K_BACK"
key "$K_BACK"
shot "08-player-clean.png"

echo "Done:"
ls -la "$OUT"/*.png
focus
