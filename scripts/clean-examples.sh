#!/usr/bin/env bash
# Stop any leftover example processes from previous smoke-test runs or
# manual dev sessions. The smoke test normally cleans up after itself,
# but Bun.serve can take a few seconds to release a port on some
# systems, and SSR-mode examples (29, 31) sometimes hang on the
# `await app.listen(...)` line past the 1.5s SIGKILL grace.
#
# Usage:
#   bun scripts/clean-examples.sh          # kill everything, including port 3000
#   bun scripts/clean-examples.sh --dry    # list what would be killed
#   bun scripts/clean-examples.sh --keep   # don't kill port 3000 (preserve manual dev)

set -uo pipefail

DRY_RUN=false
KEEP_3000=false

for arg in "$@"; do
	case "$arg" in
	--dry) DRY_RUN=true ;;
	--keep) KEEP_3000=true ;;
	-h | --help)
		sed -n '2,12p' "$0"
		exit 0
		;;
	esac
done

# 1) All `bun main.ts` children of the examples/ directory.
EXAMPLE_PIDS=$(pgrep -f "examples/.*/main\.ts" || true)

# 2) Anything holding port 3000 (skipped with --keep).
PORT_3000_PIDS=""
if [ "$KEEP_3000" = false ] && command -v lsof >/dev/null 2>&1; then
	PORT_3000_PIDS=$(lsof -ti :3000 2>/dev/null || true)
fi

# Merge + dedupe.
ALL_PIDS=$(printf "%s\n%s\n" "$EXAMPLE_PIDS" "$PORT_3000_PIDS" | sort -u | sed '/^$/d')

if [ -z "$ALL_PIDS" ]; then
	echo "No leftover example processes found."
	exit 0
fi

echo "Targets:"
for pid in $ALL_PIDS; do
	cmd=$(ps -p "$pid" -o command= 2>/dev/null || echo "<gone>")
	cwd=$(lsof -p "$pid" 2>/dev/null | awk '/cwd/ {print $NF}' | head -1)
	printf "  %6s  %s  (%s)\n" "$pid" "$cmd" "$cwd"
done

if [ "$DRY_RUN" = true ]; then
	echo
	echo "Dry run — nothing was killed."
	exit 0
fi

# 3) SIGTERM, then SIGKILL stragglers after 2 seconds.
echo
for pid in $ALL_PIDS; do
	kill "$pid" 2>/dev/null || true
done

sleep 2

for pid in $ALL_PIDS; do
	if kill -0 "$pid" 2>/dev/null; then
		echo "  force-killing $pid"
		kill -9 "$pid" 2>/dev/null || true
	fi
done

REMAINING=$(printf "%s\n" "$ALL_PIDS" | xargs -I{} sh -c 'kill -0 {} 2>/dev/null && echo {}' 2>/dev/null || true)
if [ -n "$REMAINING" ]; then
	echo
	echo "Still alive: $REMAINING"
	exit 1
fi

echo
echo "Done."
