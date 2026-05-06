#!/usr/bin/env bash
# Reliable Maestro runner. Cleans up stale daemon processes from previous runs,
# sets the iOS XCTest startup timeout, picks the right device, and retries any
# flows that failed in the first pass once with a fresh daemon.
#
# Usage:
#   scripts/maestro.sh android [<flow|dir>]   # default: tests/maestro/
#   scripts/maestro.sh ios     [<flow|dir>]
#
# Env:
#   DEVICE                          — override the auto-detected device id
#   MAESTRO_DRIVER_STARTUP_TIMEOUT  — XCTest agent install timeout (iOS, default 300000)
#   NO_RETRY=1                       — disable the auto-retry of failed flows
set -euo pipefail

PLATFORM="${1:-}"
TARGET="${2:-tests/maestro/}"

if [[ "$PLATFORM" != "android" && "$PLATFORM" != "ios" ]]; then
  echo "Usage: scripts/maestro.sh [android|ios] [flow-or-dir]" >&2
  exit 2
fi

cleanup_daemon() {
  pkill -9 -f maestro 2>/dev/null || true
  sleep 2
}

echo "→ cleaning up stale Maestro processes…"
cleanup_daemon

if [[ "$PLATFORM" == "android" ]]; then
  DEVICE="${DEVICE:-$(adb devices | awk 'NR==2 {print $1}')}"
  if [[ -z "$DEVICE" ]]; then
    echo "no Android device connected (check 'adb devices')" >&2
    exit 1
  fi
  echo "→ Android device: $DEVICE"
else
  DEVICE="${DEVICE:-$(xcrun simctl list devices booted | awk -F'[()]' '/Booted/{gsub(/^[ \t]+/, "", $2); print $2; exit}')}"
  if [[ -z "$DEVICE" ]]; then
    echo "no iOS simulator booted (use Xcode or 'xcrun simctl boot <udid>')" >&2
    exit 1
  fi
  echo "→ iOS simulator: $DEVICE"
  # XCTest agent install can take 60-90s the first time; bump from the default.
  export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000}"
fi

# First pass: run the suite, capture output for retry parsing.
LOG="$(mktemp -t maestro.XXXXXX.log)"
trap 'rm -f "$LOG"' EXIT

set +e
maestro --device "$DEVICE" test "$TARGET" 2>&1 | tee "$LOG"
RC=${PIPESTATUS[0]}
set -e

if [[ $RC -eq 0 ]]; then
  exit 0
fi

if [[ "${NO_RETRY:-0}" == "1" ]]; then
  exit "$RC"
fi

# Parse failed flow names from the suite output. A line looks like:
#   [Failed] login (6s) (Element not found: ...)
FAILED_NAMES=$(grep '^\[Failed\] ' "$LOG" | awk '{print $2}' | sort -u)
if [[ -z "$FAILED_NAMES" ]]; then
  exit "$RC"
fi

echo
echo "→ first pass failed; retrying these flows once with a fresh daemon:"
echo "$FAILED_NAMES" | sed 's/^/    /'
cleanup_daemon

RETRY_FAIL=0
while IFS= read -r NAME; do
  [[ -z "$NAME" ]] && continue
  FLOW_FILE=$(find "$TARGET" -name "${NAME}.yaml" -type f | head -1)
  if [[ -z "$FLOW_FILE" ]]; then
    echo "  ! could not locate ${NAME}.yaml under ${TARGET}"
    RETRY_FAIL=$((RETRY_FAIL + 1))
    continue
  fi
  echo
  echo "→ retry: $FLOW_FILE"
  if ! maestro --device "$DEVICE" test "$FLOW_FILE"; then
    RETRY_FAIL=$((RETRY_FAIL + 1))
  fi
done <<< "$FAILED_NAMES"

if [[ $RETRY_FAIL -eq 0 ]]; then
  echo
  echo "✓ all retries passed"
  exit 0
fi

echo
echo "✗ ${RETRY_FAIL} flow(s) still failing after retry"
exit 1
