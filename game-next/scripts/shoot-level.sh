#!/usr/bin/env bash
# Chụp một màn bằng Chrome headless để tự kiểm tra thị giác.
# Dùng: bash scripts/shoot-level.sh <level-id> <thư-mục-ra> [port] [mode] [tiền-tố]
#   mode: campaign (mặc định) hoặc harness (chỉ có tác dụng trên dev server)
# Không dùng `set -e`: Chrome headless đôi khi thoát mã khác 0 dù đã ghi ảnh.
set -uo pipefail
LEVEL="$1"
OUT="$2"
PORT="${3:-5173}"
MODE="${4:-campaign}"
PREFIX="${5:-$LEVEL}"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
mkdir -p "$OUT"

shoot() {
  local name="$1" query="$2" budget="${3:-6000}"
  "$CHROME" --headless=new --disable-gpu --use-angle=swiftshader --enable-unsafe-swiftshader \
    --hide-scrollbars --force-device-scale-factor=1 --window-size=720,1280 \
    --virtual-time-budget="$budget" \
    --screenshot="$OUT/${PREFIX}-${name}.png" "http://localhost:${PORT}/${query}" >/dev/null 2>&1
  echo "$OUT/${PREFIX}-${name}.png"
}

BASE="?scene=play&level=${LEVEL}&mode=${MODE}"
shoot play "$BASE"
shoot drag "$BASE&autosolve=drag"
shoot win "$BASE&autosolve=win" 9000
