#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: ./scripts/install.sh <claude|codex>" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd "${script_dir}/.." && pwd)"
source_file="${repo_dir}/SKILL.md"

case "$1" in
  claude)
    config_dir="${CLAUDE_CONFIG_DIR:-${HOME}/.claude}"
    destination="${config_dir}/skills/My_mailmarketing_makes_Neil_Patel_proud"
    ;;
  codex)
    config_dir="${CODEX_HOME:-${HOME}/.codex}"
    destination="${config_dir}/skills/My_mailmarketing_makes_Neil_Patel_proud"
    ;;
  *)
    echo "Unknown target: $1. Use claude or codex." >&2
    exit 1
    ;;
esac

if [[ -e "${destination}/SKILL.md" ]]; then
  echo "Refusing to overwrite existing skill: ${destination}/SKILL.md" >&2
  exit 2
fi

mkdir -p "${destination}"
cp "${source_file}" "${destination}/SKILL.md"
echo "Installed Motor Empiricus at ${destination}/SKILL.md"
