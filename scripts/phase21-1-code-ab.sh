#!/usr/bin/env bash
set -euo pipefail
repo_dir=$(pwd)
baseline_dir=$(mktemp -d /tmp/sanity-404-phase21-1-baseline.XXXXXX)
current_dist=$(mktemp -d /tmp/sanity-404-phase21-1-current.XXXXXX)
mkdir -p docs/capturas/fase21_1
git archive HEAD | tar -x -C "$baseline_dir"
ln -s "$repo_dir/node_modules" "$baseline_dir/node_modules"
(
  cd "$baseline_dir"
  NODE_ENV=development npm run build
)
NODE_ENV=development npx vite build --outDir "$current_dist"
current_index=0
baseline_index=0
for variant in current baseline baseline current; do
  if [[ "$variant" == current ]]; then
    current_index=$((current_index + 1))
    index=$current_index
    asset_root=$current_dist
  else
    baseline_index=$((baseline_index + 1))
    index=$baseline_index
    asset_root=$baseline_dir/dist
  fi
  printf '%s %s loadavg %s\n' "$variant" "$index" "$(cat /proc/loadavg)"
  node scripts/performance-phase10.mjs \
    --headed --hardware --only=189:combat --seconds=10 --min-fps=1 \
    --url="http://127.0.0.1:5181/" --asset-root="$asset_root" \
    --output="docs/capturas/fase21_1/code-ab-${variant}-${index}.json"
done
printf 'Código anterior: %s\n' "$(git rev-parse HEAD)"
