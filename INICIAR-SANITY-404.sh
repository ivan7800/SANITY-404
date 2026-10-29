#!/bin/sh
set -eu
base=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
if [ ! -f "$base/game/index.html" ] || [ ! -x "$base/sanity404-server" ]; then
  echo 'Faltan el servidor o los recursos del juego.' >&2
  exit 2
fi
exec "$base/sanity404-server" --launch "$base/game"
