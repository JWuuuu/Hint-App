#!/bin/zsh
set -e

cd "$(dirname "$0")"

clear
echo "Starting Hint website..."
echo

if command -v python3 >/dev/null 2>&1; then
  python3 scripts/start_hint_website.py
else
  /usr/bin/python3 scripts/start_hint_website.py
fi

echo
echo "Hint website stopped. You can close this window."
read -k 1 -s "?Press any key to close..."
