#!/bin/sh
# check-pin.sh (#1321) — the shared @cloudy/ui version pin: the package at cloudy-ui.pin must equal the package on
# cloudy-h-webapps-mob main (same git tree for packages/cloudy-ui), so the desktop never drifts from the mobile mimic's tokens,
# icons and nav. Fails with the bump command. Run after fetch-cloudy-ui.sh.
set -eu
cd "$(dirname "$0")/.."
src=.vendor/cloudy-h-webapps-mob
pin=$(tr -d ' \n' < cloudy-ui.pin)
git -C "$src" fetch -q --depth 1 origin main
want=$(git -C "$src" rev-parse "FETCH_HEAD:packages/cloudy-ui")
have=$(git -C "$src" rev-parse "$pin:packages/cloudy-ui")
if [ "$want" != "$have" ]; then
  echo "FAIL @cloudy/ui pin ${pin%"${pin#?????????}"} is behind cloudy-h-webapps-mob main (packages/cloudy-ui $have != $want)." >&2
  echo "Bump: git -C $src rev-parse FETCH_HEAD > cloudy-ui.pin (or the sha of cloudy-h-webapps-mob main), commit, push." >&2
  exit 1
fi
echo "ok: @cloudy/ui pin == cloudy-h-webapps-mob main (packages/cloudy-ui $have)"
