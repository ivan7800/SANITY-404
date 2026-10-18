#!/usr/bin/env bash
set -uo pipefail
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
compatible_node() {
  "$1" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(((a===20&&b>=19)||(a===22&&b>=12)||a>=24)?0:1)' >/dev/null 2>&1
}
find_node() {
  if command -v node >/dev/null 2>&1 && compatible_node "$(command -v node)"; then command -v node; return; fi
  local nvm_root="${NVM_DIR:-${HOME}/.nvm}" candidate
  if [[ -s "$nvm_root/nvm.sh" ]]; then
    export NVM_DIR="$nvm_root"
    # NVM se carga explícitamente: los lanzadores gráficos no leen .bashrc.
    source "$nvm_root/nvm.sh" --no-use
    nvm use --silent default >/dev/null 2>&1 || true
    if command -v node >/dev/null 2>&1 && compatible_node "$(command -v node)"; then command -v node; return; fi
  fi
  while IFS= read -r candidate; do
    if [[ -x "$candidate/bin/node" ]] && compatible_node "$candidate/bin/node"; then printf '%s\n' "$candidate/bin/node"; return; fi
  done < <(printf '%s\n' "$nvm_root"/versions/node/* | sort -Vr)
  return 1
}
if ! NODE_BIN="$(find_node)"; then
  mkdir -p -- "$PROJECT_DIR/.sanity-launcher"
  printf '%s\n' 'No se encuentra Node.js en PATH ni NVM.' >> "$PROJECT_DIR/.sanity-launcher/server.log"
  printf '%s\n' 'No se encuentra Node.js en PATH ni NVM. Instala Node 22.12+ o 24+ y vuelve a abrir el juego.' >&2
  [[ -t 0 ]] && read -r -p 'Pulsa Intro para cerrar…' || true
  exit 1
fi
export PATH="$(dirname -- "$NODE_BIN"):$PATH"
case "${1:-}" in
 --stop) ACTION=stop;; --status) ACTION=status;; --check) ACTION=check;; --no-browser|'') ACTION=start;; *) printf '%s\n' 'Uso: --stop | --status | --check | --no-browser'; exit 1;;
esac
"$NODE_BIN" "$PROJECT_DIR/scripts/launcher.mjs" "$ACTION" "${@:1}"
RESULT=$?
if (( RESULT != 0 )); then
  printf '%s\n' "Revisa $PROJECT_DIR/.sanity-launcher/server.log" >&2
  [[ -t 0 ]] && read -r -p 'Pulsa Intro para cerrar…' || true
fi
exit "$RESULT"
