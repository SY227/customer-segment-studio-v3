#!/usr/bin/env bash
set -euo pipefail
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PORT="${PORT:-3021}"
for cmd in node npm; do
  command -v "$cmd" >/dev/null || { echo "Missing $cmd. Install Node.js 22 LTS and rerun."; exit 1; }
done
node -e 'const [a,b]=process.versions.node.split(".").map(Number);if(a<20||(a===20&&b<9)){console.error("Use Node.js 20.9 or newer; Node.js 22 LTS is recommended.");process.exit(1)}'
PORT="$PORT" node <<'JS'
const net=require('node:net');const port=Number(process.env.PORT);
if(!Number.isInteger(port)||port<1024||port>65535){console.error('Use an available local port from 1024 to 65535.');process.exit(1)}
const server=net.createServer();server.once('error',()=>{console.error('Port '+port+' is unavailable. Rerun with PORT=3022 bash start-local.sh. No process was stopped.');process.exit(1)});server.listen(port,'127.0.0.1',()=>server.close());
JS
if [ ! -e .env.local ]; then
  if [ -n "${ENV_SOURCE:-}" ]; then
    [ -f "$ENV_SOURCE" ] || { echo "ENV_SOURCE does not name a file."; exit 1; }
    (umask 077; cp "$ENV_SOURCE" .env.local)
    echo "Copied your explicitly selected environment file; values are not printed."
  else
    (umask 077; cp .env.example .env.local)
    echo "Created .env.local with an empty optional key."
  fi
else
  echo "Preserved existing .env.local."
fi
printf '\nOptional AI key: edit GEMINI_API_KEY in this folder\x27s .env.local.\nAI is off until requested in the UI. No key is needed to review the sample or files.\n\n'
# A full local launch must never silently skip the real parser tests.
unset STUDIO_ALLOW_MISSING_DEPENDENCIES STUDIO_TYPESCRIPT_PATH
export NEXT_TELEMETRY_DISABLED=1
npm ci
npm run qa
printf '\nLocal review: http://localhost:%s\nPress Control+C to stop. No GitHub or Vercel changes are made.\n\n' "$PORT"
exec npm run start -- --hostname 127.0.0.1 --port "$PORT"
