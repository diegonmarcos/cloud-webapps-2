#!/bin/sh
# legal-guard.sh — no unlicensed streaming embed or public piracy index
# anywhere in this repo's tracked files.
#
# The denylist is src/data/legal-denylist.json (shared: cloud-u-android runs the
# same guard over its tree against its pinned copy). Skipped: that file (it must
# name what it forbids) and this guard.
# Users' own runtime entries are not in git and are not checked.
#
#   sh tests/legal-guard.sh          the guard over the whole repo, then a planted
#                                    file must turn it red
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/.." && pwd)"
ROOT="$(git -C "$APP" rev-parse --show-toplevel)"
SOURCES="$APP/src/data/legal-denylist.json"
REL_SOURCES="${SOURCES#"$ROOT"/}"
REL_SELF="${HERE#"$ROOT"/}/legal-guard.sh"

guard() {  # $1 = repo root
  python3 - "$1" "$SOURCES" "$REL_SOURCES" "$REL_SELF" <<'PY'
import json, subprocess, sys
root, sources, skip1, skip2 = sys.argv[1:5]
deny = json.load(open(sources))["denylist"]
assert len(deny) >= 10, "denylist is suspiciously short"
args = ["git", "-C", root, "grep", "-I", "-i", "-n", "-F"]
for d in deny: args += ["-e", d]
args += ["--", ".", ":(exclude)" + skip1, ":(exclude)" + skip2, ":(exclude,glob)**/package-lock.md"]
r = subprocess.run(args, capture_output=True, text=True)
hits = [l for l in r.stdout.splitlines() if l.strip()]
for l in hits[:40]: print("  DENIED " + l[:200])
print(("  FAIL %d line(s) name an unlicensed embed / piracy index" % len(hits)) if hits else "  ok   no denied domain in %s" % root)
sys.exit(1 if hits else 0)
PY
}

echo "== legal guard =="
guard "$ROOT"
echo "== mutation: a planted embed must turn it red =="
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
git -C "$WORK" init -q && mkdir -p "$WORK/x"
printf '<iframe src="https://vid%s.cc/embed/movie/tt1"></iframe>\n' src > "$WORK/x/planted.html"
git -C "$WORK" add -A
if guard "$WORK" >/dev/null 2>&1; then echo "  FAIL mutation stayed green"; exit 1; fi
echo "  ok   mutation: red"
