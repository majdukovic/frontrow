#!/usr/bin/env bash
# Smoke suite — five critical user paths, run on a single device.
# This is the gate for "the app boots and the headline flows work" before
# we ship a build. Anything else lives in the full Maestro suite.
#
# Usage:
#   scripts/smoke.sh android
#   scripts/smoke.sh ios
#
# Inherits everything from scripts/maestro.sh — same device autodetect,
# same retry behavior — but limits the run to a five-flow allowlist.
set -euo pipefail

PLATFORM="${1:-}"

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" ]]; then
  echo "Usage: scripts/smoke.sh [android|ios]" >&2
  exit 2
fi

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# The five flows that gate every release. Order matters:
#   1. launch          — app boots to Events list at all
#   2. browse          — events render, search filters, detail opens
#   3. login           — auth round-trip works
#   4. buy             — full ticket purchase flow
#   5. detail-cancel   — open ticket detail, see QR, refund flow works
SMOKE_FLOWS=(
  "tests/maestro/smoke/launch.yaml"
  "tests/maestro/events/browse.yaml"
  "tests/maestro/auth/login.yaml"
  "tests/maestro/tickets/buy.yaml"
  "tests/maestro/tickets/detail-cancel.yaml"
)

# Verify each flow exists before kicking off — fail loudly if the
# allowlist drifts away from the file system.
for f in "${SMOKE_FLOWS[@]}"; do
  if [[ ! -f "$REPO_DIR/$f" ]]; then
    echo "✗ smoke flow missing: $f" >&2
    exit 1
  fi
done

echo "→ smoke suite (${#SMOKE_FLOWS[@]} flows, $PLATFORM):"
printf '    %s\n' "${SMOKE_FLOWS[@]}"
echo

FAILED=()
for flow in "${SMOKE_FLOWS[@]}"; do
  echo "─── $flow ───"
  if ! "$REPO_DIR/scripts/maestro.sh" "$PLATFORM" "$flow"; then
    FAILED+=("$flow")
  fi
  echo
done

if [[ ${#FAILED[@]} -eq 0 ]]; then
  echo "✓ smoke passed (${#SMOKE_FLOWS[@]}/${#SMOKE_FLOWS[@]})"
  exit 0
fi

echo "✗ smoke failed (${#FAILED[@]}/${#SMOKE_FLOWS[@]}):"
printf '    %s\n' "${FAILED[@]}"
exit 1
