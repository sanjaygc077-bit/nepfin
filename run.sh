#!/usr/bin/env bash
# Launch NEP Cali Manager locally and open the Dashboard tab in the browser.
#
# Usage:
#   ./run.sh           # serve on port 8000, open the Dash tab
#   PORT=9000 ./run.sh # use a different port
set -euo pipefail

PORT="${PORT:-8000}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URL="http://localhost:${PORT}/#dash"

cd "$DIR"

# Reuse an existing server if the port is already serving; otherwise start one.
if lsof -i ":${PORT}" >/dev/null 2>&1; then
  echo "Port ${PORT} already in use — reusing the running server."
else
  echo "Starting static server on http://localhost:${PORT} ..."
  python3 -m http.server "${PORT}" >/dev/null 2>&1 &
  SERVER_PID=$!
  sleep 1
  echo "Server started (PID ${SERVER_PID}). Stop it later with: kill ${SERVER_PID}"
fi

echo "Opening ${URL}"
if command -v open >/dev/null 2>&1; then
  open "${URL}"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${URL}"
else
  echo "Open this URL in your browser: ${URL}"
fi
