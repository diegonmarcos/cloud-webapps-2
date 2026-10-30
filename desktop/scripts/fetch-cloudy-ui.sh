#!/bin/sh
# fetch-cloudy-ui.sh (#1321) — check out diegonmarcos/cloudy-h-webapps-mob at the commit in cloudy-ui.pin into
# .vendor/cloudy-h-webapps-mob (its committed cloudy-webapps dist is what the desktop embeds in tests) and copy its
# packages/cloudy-ui to .vendor/cloudy-ui, the workspace package the desktop site builds on. CI only.
set -eu
cd "$(dirname "$0")/.."
pin=$(tr -d ' \n' < cloudy-ui.pin)
case "$pin" in *[!0-9a-f]*|'') echo "cloudy-ui.pin is not a commit sha" >&2; exit 1;; esac
src=.vendor/cloudy-h-webapps-mob
if [ ! -d "$src/.git" ]; then
  mkdir -p "$src"
  git -C "$src" init -q
  git -C "$src" remote add origin https://github.com/diegonmarcos/cloudy-h-webapps-mob.git
fi
git -C "$src" fetch -q --depth 1 origin "$pin"
git -C "$src" checkout -q --detach FETCH_HEAD
rm -rf .vendor/cloudy-ui
cp -R "$src/packages/cloudy-ui" .vendor/cloudy-ui
echo "@cloudy/ui at ${pin%"${pin#?????????}"} -> .vendor/cloudy-ui"
