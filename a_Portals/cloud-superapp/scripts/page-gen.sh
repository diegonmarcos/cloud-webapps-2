#!/usr/bin/env bash
# Thin wrapper matching the qrcode-gen.sh delegation convention consumed by
# mod_page_gen in _engine.sh: ($1=PROJECT_DIR $2=DIST_DIR $3=manifest path).
# All real logic lives in generate-pages.mjs (plain ESM, no build step).
set -e
PROJECT_DIR="$1"
DIST_DIR="$2"
MANIFEST="$3"
node "$PROJECT_DIR/scripts/generate-pages.mjs" "$PROJECT_DIR" "$DIST_DIR" "$MANIFEST"
