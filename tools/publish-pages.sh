#!/usr/bin/env bash
# Veröffentlicht dist/index.html auf dem Branch gh-pages (GitHub Pages). Vorher: node build.mjs
# Danach (einmalig): GitHub > Settings > Pages > Source "Deploy from a branch" > Branch gh-pages, Ordner / (root).
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f dist/index.html ] || { echo "dist/index.html fehlt: erst 'node build.mjs' ausführen"; exit 1; }
TMP=$(mktemp -d); trap 'git worktree remove --force "$TMP/wt" >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT
git fetch origin gh-pages >/dev/null 2>&1 || true
if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
  git worktree add -B gh-pages "$TMP/wt" origin/gh-pages >/dev/null
else
  git worktree add --detach "$TMP/wt" HEAD >/dev/null
  (cd "$TMP/wt" && git checkout -q --orphan gh-pages && git rm -rfq . )
fi
cp dist/index.html "$TMP/wt/index.html"; touch "$TMP/wt/.nojekyll"
cd "$TMP/wt"
git add -A
git -c user.name="${GIT_AUTHOR_NAME:-Claude}" -c user.email="${GIT_AUTHOR_EMAIL:-noreply@anthropic.com}" commit -qm "Veröffentlichung: Die große Bibliothek" || { echo "Keine Änderung"; exit 0; }
git push origin gh-pages
echo "Fertig. Adresse nach dem Einschalten von Pages: https://$(git remote get-url origin | sed -E 's#.*github.com[:/]([^/]+)/([^/.]+).*#\1.github.io/\2#' | tr 'A-Z' 'a-z')/"
