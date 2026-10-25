#!/usr/bin/env bash
set -euo pipefail
qa_dist=$(mktemp -d /tmp/sanity-404-phase21-1-qa.XXXXXX)
mkdir -p docs/capturas/fase21_1
NODE_ENV=development npx vite build --outDir "$qa_dist"
for mode in chapter-exits chapter-functional phase21-cases; do
  node scripts/performance-phase10.mjs \
    --headed --hardware --only=189:combat "--$mode" \
    --url=http://127.0.0.1:5184/ --asset-root="$qa_dist" \
    --output="docs/capturas/fase21_1/${mode}-run.json"
done
