#!/bin/sh
set -eu

bind_address=127.0.0.1
if [ "$#" -gt 1 ]; then
  printf 'Usage: %s [--network]\n' "$0" >&2
  exit 2
fi

case "${1:-}" in
  "") ;;
  --network) bind_address=0.0.0.0 ;;
  *)
    printf 'Unknown option: %s\nUsage: %s [--network]\n' "$1" "$0" >&2
    exit 2
    ;;
esac

port=${PORT:-8000}
case "$port" in
  ''|*[!0-9]*)
    printf 'PORT must contain only digits.\n' >&2
    exit 2
    ;;
esac
if [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
  printf 'PORT must be between 1 and 65535.\n' >&2
  exit 2
fi

script_dir=$(CDPATH= cd "$(dirname "$0")" && pwd)
cd "$script_dir"

if [ "$bind_address" = "127.0.0.1" ]; then
  printf 'Serving this folder at http://127.0.0.1:%s\n' "$port"
else
  printf 'Serving this folder on the local network, port %s.\n' "$port"
  printf 'Open http://IP-DO-COMPUTADOR:%s on another device on the same Wi-Fi.\n' "$port"
fi

exec python3 -m http.server "$port" --bind "$bind_address"
