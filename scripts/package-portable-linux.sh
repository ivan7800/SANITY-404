#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
npm run build:portable:assets
mkdir -p portable/bin/linux portable/release
gcc -static -std=c11 -D_DEFAULT_SOURCE -O2 -Wall -Wextra -Werror portable/server.c -o portable/bin/linux/sanity404-server
node scripts/stage-portable.mjs linux
cd portable/release/linux
zip -q -r ../SANITY-404-Linux-x64.zip .
cd ..
unzip -t SANITY-404-Linux-x64.zip
