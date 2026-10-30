#!/usr/bin/env bash
# fetch-wasm.sh — bring the fleet's Kotlin/Wasm pages into the portal (#876).
#
#   fetch-wasm.sh data   refresh src/data/constellation-fleet.json from cloud-u-android
#                        (run BEFORE `build.sh build`: data_wrap bakes it into the page)
#   fetch-wasm.sh apps   for every fleet row with assets.wasm, download that zip from the
#                        rolling release and unzip it into dist/apps/<row label>/
#                        (run AFTER `build.sh build`: the build leaves dist/apps alone)
#   fetch-wasm.sh        both, in that order
#
# Every value (repo, release tag, manifest path) is build.json::wasm. A row whose asset
# cannot be downloaded is left out (a warning, and absent from apps/available.json, which is
# what the grid shows) rather than failing the portal's whole deploy; a zip with no
# index.html FAILS the run. `data` alone degrades to the committed copy when the network is
# unavailable, so an offline local build still works.
#
# Needs: curl, jq, unzip. GH_TOKEN (optional) is the fallback when an anonymous fetch fails.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BJ="$HERE/build.json"
DATA="$HERE/src/data/constellation-fleet.json"
APPS="$HERE/dist/apps"

for t in curl jq unzip; do
  command -v "$t" >/dev/null 2>&1 || { echo "fetch-wasm: $t is required" >&2; exit 2; }
done

REPO="$(jq -r '.wasm.repo' "$BJ")"
TAG="$(jq -r '.wasm.release_tag' "$BJ")"
MANIFEST="$(jq -r '.wasm.fleet_manifest' "$BJ")"
for v in "$REPO" "$TAG" "$MANIFEST"; do
  [ -n "$v" ] && [ "$v" != null ] || { echo "fetch-wasm: build.json::wasm lacks repo, release_tag or fleet_manifest" >&2; exit 2; }
done

# Public repo: try anonymously first (a token of the wrong scope can turn a public 200 into a
# 404), and only then with GH_TOKEN, which raises the rate limit and reaches a private repo.
fetch() {  # fetch <url> <out>
  curl -fsSL "$1" -o "$2" 2>/dev/null && return 0
  [ -n "${GH_TOKEN:-}" ] && curl -fsSL -H "Authorization: Bearer $GH_TOKEN" "$1" -o "$2"
}

fetch_data() {
  local tmp
  tmp="$(mktemp)"
  if fetch "https://raw.githubusercontent.com/$REPO/main/$MANIFEST" "$tmp" && jq -e '.apps | type == "array"' "$tmp" >/dev/null 2>&1; then
    mv "$tmp" "$DATA"
    echo "fetch-wasm: refreshed $(basename "$DATA") ($(jq '[.apps[] | select(.assets.wasm)] | length' "$DATA") web app(s))"
  else
    rm -f "$tmp"
    echo "fetch-wasm: could not refresh $(basename "$DATA"); keeping the committed copy" >&2
  fi
}

fetch_apps() {
  [ -f "$DATA" ] || { echo "fetch-wasm: $DATA missing" >&2; exit 1; }
  mkdir -p "$APPS"
  local n=0 slug asset zip have=()
  while IFS=$'\t' read -r slug asset; do
    [ -n "$slug" ] || continue
    zip="$(mktemp)"
    echo "fetch-wasm: $asset -> apps/$slug/"
    if ! fetch "https://github.com/$REPO/releases/download/$TAG/$asset" "$zip"; then
      # A row can carry assets.wasm before its first ship-<app>-wasm run has put the zip on the
      # release. That must not stop the portal's whole Pages deploy: the page is left out and
      # apps/available.json (what the grid shows) says so.
      rm -f "$zip"
      echo "::warning::fetch-wasm: $asset is not on $REPO@$TAG yet; $slug is left out of the grid" >&2
      continue
    fi
    rm -rf "${APPS:?}/$slug"
    mkdir -p "$APPS/$slug"
    unzip -q -o "$zip" -d "$APPS/$slug"
    rm -f "$zip"
    [ -f "$APPS/$slug/index.html" ] || { echo "fetch-wasm: $asset has no index.html" >&2; exit 1; }
    have+=("$slug")
    n=$((n + 1))
  done < <(jq -r '.apps[] | select((.assets.wasm // "") != "") | [(.label // .id), .assets.wasm] | @tsv' "$DATA")
  printf '%s\n' "${have[@]:-}" | jq -R . | jq -s 'map(select(. != ""))' > "$APPS/available.json"
  echo "fetch-wasm: $n page(s) in dist/apps/ (apps/available.json lists them)"
}

case "${1:-all}" in
  data) fetch_data ;;
  apps) fetch_apps ;;
  all)  fetch_data; fetch_apps ;;
  *)    echo "usage: fetch-wasm.sh [data|apps]" >&2; exit 2 ;;
esac
