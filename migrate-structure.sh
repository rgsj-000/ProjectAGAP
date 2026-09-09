#!/usr/bin/env bash
# Project AGAP — folder restructure migration script
# Run this from the ROOT of your project-agap repo.
# Uses `git mv` so history is preserved. Falls back to `mv` if the file
# isn't tracked by git yet.
#
# Review the "DECISIONS NEEDED" section before running — a couple of
# moves depend on choices you haven't made yet (see bottom of script).

set -e

gmv() {
  local src="$1"
  local dest="$2"
  if [ ! -e "$src" ]; then
    echo "  ⚠️  skip (not found): $src"
    return
  fi
  mkdir -p "$(dirname "$dest")"
  if git ls-files --error-unmatch "$src" > /dev/null 2>&1; then
    git mv "$src" "$dest"
  else
    mv "$src" "$dest"
  fi
  echo "  ✅ $src -> $dest"
}

echo "== Moving shell/layout components =="
gmv src/components/modules/shell/AppShell.tsx          src/components/layout/AppShell.tsx
gmv src/components/modules/shell/DesktopSidebar.tsx     src/components/layout/AppSidebar.tsx
gmv src/components/modules/shell/TopHeader.tsx           src/components/layout/AppHeader.tsx
gmv src/components/modules/shell/MobileBottomNav.tsx     src/components/layout/MobileNavigation.tsx
gmv src/components/modules/shell/HelpDialog.tsx          src/components/layout/HelpDialog.tsx
gmv src/components/modules/shell/LanguageSelector.tsx    src/components/layout/LanguageSelector.tsx
gmv src/components/modules/shell/NavIcon.tsx             src/components/layout/NavIcon.tsx
gmv src/components/modules/shell/UserProfileArea.tsx     src/components/layout/UserProfileArea.tsx
gmv src/components/modules/shell/MobileMoreDrawer.tsx    src/components/layout/MobileMoreDrawer.tsx

echo "== Moving advisory components =="
gmv src/components/modules/shell/AdvisoryModal.tsx       src/components/advisory/AdvisoryModal.tsx

echo "== Moving mock data =="
gmv src/components/modules/shell/mockData.ts             src/lib/mock-data.ts

echo "== lib/utils.ts already correct, no move needed =="

echo "== Scaffolding new empty folders (app routes) =="
for dir in \
  src/app/login \
  src/app/dashboard \
  src/app/advisory \
  src/app/risk-assessment \
  "src/app/barangays/[barangayId]" \
  src/app/preparedness-brief \
  "src/app/preparedness-brief/[barangayId]" \
  src/app/household-action-card \
  src/app/damage-report \
  src/app/needs-report \
  src/app/recovery-priorities \
; do
  mkdir -p "$dir"
  echo "  📁 $dir"
done

echo "== Scaffolding new empty component folders =="
for dir in \
  src/components/ui \
  src/components/dashboard \
  src/components/maps \
  src/components/barangay \
  src/components/assessment \
  src/components/preparedness \
  src/components/household \
  src/components/recovery \
  src/components/reports \
  src/components/feedback \
  src/hooks \
  src/types \
  src/i18n \
  src/styles \
; do
  mkdir -p "$dir"
  echo "  📁 $dir"
done

echo "== Cleaning up now-empty old folders =="
find src/components/modules -type d -empty -delete 2>/dev/null || true

echo ""
echo "Done. Remember to update all import paths that referenced:"
echo "  - src/components/modules/shell/*  ->  src/components/layout/* (mostly)"
echo "  - src/components/modules/shell/mockData.ts -> src/lib/mock-data.ts"
echo ""
echo "Run a project-wide search for these old paths, e.g.:"
echo "  grep -rl 'components/modules/shell' src/"

# ---------------------------------------------------------------------------
# DECISIONS NEEDED (not automated — left as-is by this script)
# ---------------------------------------------------------------------------
# 1. src/context/LanguageContext.tsx and NavigationContext.tsx are left in
#    place at src/context/. The target tree you pasted doesn't show a
#    context/ folder, but there's no listed alternative either. Safe to
#    leave them where they are — nothing above touches src/context/.
#
# 2. MobileMoreDrawer.tsx was moved into layout/ as its own file rather than
#    merged into MobileNavigation.tsx. If you'd rather merge the two, do
#    that manually after this script runs (it's a content edit, not a move).
#
# 3. mockData.ts moved to lib/mock-data.ts. Once you add typed models under
#    src/types/, you'll likely want to split this file so its shapes match
#    those types.
# ---------------------------------------------------------------------------
