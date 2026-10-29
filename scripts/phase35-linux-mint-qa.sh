#!/usr/bin/env bash
# Run from a regular Linux Mint terminal with a graphical desktop session.
set -u

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_root" || exit 2
stamp="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
evidence_dir="${SANITY_EVIDENCE_DIR:-$project_root/docs/capturas/fase35/linux-mint-$stamp}"
mkdir -p "$evidence_dir"
printf 'step\texit_code\tcommand\n' > "$evidence_dir/exit-codes.tsv"
overall=0
preview_pid=""

cleanup() {
  if [[ -n "$preview_pid" ]]; then
    kill "$preview_pid" 2>/dev/null || true
    wait "$preview_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT

record() {
  local name="$1" code="$2" command="$3"
  printf '%s\t%s\t%s\n' "$name" "$code" "$command" >> "$evidence_dir/exit-codes.tsv"
  printf '%s %s (exit %s)\n' "$( [[ "$code" -eq 0 ]] && printf PASS || printf FAIL )" "$name" "$code"
  if [[ "$code" -ne 0 ]]; then overall=1; fi
}

run_step() {
  local name="$1"
  shift
  local code
  if "$@" > "$evidence_dir/$name.txt" 2>&1; then code=0; else code=$?; fi
  record "$name" "$code" "$*"
  if [[ "$code" -ne 0 ]]; then tail -n 12 "$evidence_dir/$name.txt"; fi
}

{
  printf 'started_utc=%s\n' "$(date -u --iso-8601=seconds)"
  printf 'project=%s\n' "$project_root"
  printf 'git_commit=%s\n' "$(git rev-parse HEAD)"
  printf 'node=%s\n' "$(node --version)"
  printf 'npm=%s\n' "$(npm --version)"
  printf 'DISPLAY=%s\n' "${DISPLAY:-}"
  printf 'WAYLAND_DISPLAY=%s\n' "${WAYLAND_DISPLAY:-}"
  grep -E '^(NoNewPrivs|Seccomp|Seccomp_filters):' /proc/self/status || true
} > "$evidence_dir/environment.txt"

chrome_path="${CHROME_PATH:-$(command -v google-chrome || true)}"
if [[ -z "$chrome_path" || ! -x "$chrome_path" ]]; then
  printf 'Google Chrome no encontrado. Instálalo o define CHROME_PATH.\n' > "$evidence_dir/chrome.txt"
  record chrome 127 'CHROME_PATH / google-chrome'
  printf 'Evidencias: %s\n' "$evidence_dir"
  exit 1
fi
export CHROME_PATH="$chrome_path"
run_step chrome "$CHROME_PATH" --version

if [[ "${SANITY_SKIP_NPM_CI:-0}" != "1" ]]; then
  run_step npm-ci npm ci
  if [[ "$overall" -ne 0 ]]; then
    printf 'Evidencias: %s\n' "$evidence_dir"
    exit 1
  fi
fi
run_step build-web npm run build:web
if [[ "$overall" -ne 0 ]]; then
  printf 'Evidencias: %s\n' "$evidence_dir"
  exit 1
fi
run_step bundle-sha256 sha256sum dist/index.html dist/assets/*

"$project_root/node_modules/.bin/vite" preview --host 127.0.0.1 --port 5180 --strictPort > "$evidence_dir/preview.txt" 2>&1 &
preview_pid=$!
url='http://127.0.0.1:5180/SANITY-404/'
ready=0
for _ in {1..40}; do
  if curl --noproxy '*' --silent --fail --output /dev/null "$url"; then ready=1; break; fi
  if ! kill -0 "$preview_pid" 2>/dev/null; then break; fi
  sleep 0.5
done
if [[ "$ready" -ne 1 ]]; then
  record preview 1 'vite preview --host 127.0.0.1 --port 5180 --strictPort'
  tail -n 20 "$evidence_dir/preview.txt"
  printf 'Evidencias: %s\n' "$evidence_dir"
  exit 1
fi
record preview 0 'vite preview --host 127.0.0.1 --port 5180 --strictPort'

if curl --noproxy '*' --fail --silent --show-error --dump-header "$evidence_dir/headers.txt" --output "$evidence_dir/index.html" "$url" && grep -q '/SANITY-404/assets/' "$evidence_dir/index.html"; then
  record url 0 "curl $url; base /SANITY-404/assets/"
else
  record url 1 "curl $url; base /SANITY-404/assets/"
  printf 'Evidencias: %s\n' "$evidence_dir"
  exit 1
fi

export SANITY_TEST_URL="$url"
export SANITY_HARDWARE=1
unset SANITY_SOFTWARE
{
  printf 'CHROME_PATH=%s\n' "$CHROME_PATH"
  printf 'SANITY_TEST_URL=%s\n' "$SANITY_TEST_URL"
  printf 'SANITY_HARDWARE=1\n'
} >> "$evidence_dir/environment.txt"
run_step production-smoke node scripts/phase34-web-production-smoke.mjs
SANITY_SYSTEMS_OUTPUT="$evidence_dir/game-systems-failure" run_step game-systems node scripts/browser-systems.mjs
SANITY_NAV_RUNS=50 SANITY_NAV_OUTPUT="$evidence_dir/navigation-50.json" run_step navigation-50 node scripts/phase35-web-navigation.mjs
SANITY_FORCE_GC=1 SANITY_NAV_RUNS=20 SANITY_NAV_OUTPUT="$evidence_dir/navigation-gc-20.json" run_step navigation-gc-20 node scripts/phase35-web-navigation.mjs
SANITY_WEBGL_OUTPUT="$evidence_dir/webgl" run_step webgl node scripts/phase35-webgl-production.mjs

printf 'finished_utc=%s\n' "$(date -u --iso-8601=seconds)" >> "$evidence_dir/environment.txt"
printf 'Evidencias: %s\n' "$evidence_dir"
exit "$overall"
