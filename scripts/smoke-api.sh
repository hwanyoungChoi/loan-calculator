#!/usr/bin/env bash
# /api/apt-trades 연기 테스트(AC-6(d), 태스크 2-3(a)·AC-8 T1). Worker(wrangler dev 또는 배포 URL) 대상.
#
# 사용: bash scripts/smoke-api.sh [BASE_URL] [nokey|key]
#   nokey(기본, CI): 400 invalidParams · 503 notConfigured · 405 methodNotAllowed. 키·네트워크를 쓰지 않는다.
#   key: 400 · 405 + lawdCd=11110&months=1 → 200. 응답 본문·헤더에 서비스키가 없는지도 본다
#        (키는 환경변수 MOLIT_SERVICE_KEY 또는 .dev.vars에서 읽고 출력하지 않는다).
# BASE_URL 기본값은 wrangler dev(pnpm dev:api, http://localhost:8788). 배포된 Worker URL(*.workers.dev)을 주면 Cloudflare IP 경로(A13)를 본다.
set -euo pipefail

BASE_URL="${1:-http://localhost:8788}"
MODE="${2:-nokey}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 서버가 뜰 때까지 기다린다(wrangler dev는 build.command로 pnpm build를 먼저 돈다). 400은 curl 재시도 대상이 아니라 바로 끝난다.
curl -s -o /dev/null --retry-connrefused --retry 90 --retry-delay 1 "$BASE_URL/api/apt-trades"

failed=0
check() {
  local method="$1" path="$2" want_status="$3" want_error="$4" status
  status="$(curl -s -D "$TMP/headers" -o "$TMP/body" -w '%{http_code}' -X "$method" "$BASE_URL$path")"
  if [[ "$status" != "$want_status" ]] || ! grep -q "\"error\":\"$want_error\"" "$TMP/body"; then
    echo "FAIL $method $path → $status (기대 $want_status $want_error)"
    failed=1
    return
  fi
  echo "ok   $method $path → $status $want_error"
}

check GET "/api/apt-trades" 400 invalidParams
check POST "/api/apt-trades?lawdCd=11680" 405 methodNotAllowed

if [[ "$MODE" == "nokey" ]]; then
  check GET "/api/apt-trades?lawdCd=11680" 503 notConfigured
else
  key="${MOLIT_SERVICE_KEY:-}"
  if [[ -z "$key" && -f .dev.vars ]]; then
    key="$(sed -n 's/^MOLIT_SERVICE_KEY=//p' .dev.vars | tr -d '\r\n')"
  fi
  status="$(curl -s -D "$TMP/headers" -o "$TMP/body" -w '%{http_code}' "$BASE_URL/api/apt-trades?lawdCd=11110&months=1")"
  if [[ "$status" == "200" ]]; then
    echo "ok   GET /api/apt-trades?lawdCd=11110&months=1 → 200, items $(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).items.length)' "$TMP/body")"
  else
    echo "FAIL GET /api/apt-trades?lawdCd=11110&months=1 → $status $(cat "$TMP/body")"
    failed=1
  fi
  if [[ -n "$key" ]]; then
    encoded="$(KEY="$key" node -e 'process.stdout.write(encodeURIComponent(process.env.KEY))')"
    if grep -qF -e "$key" -e "$encoded" "$TMP/body" "$TMP/headers"; then
      echo "FAIL 응답에 서비스키가 있다"
      failed=1
    else
      echo "ok   응답 본문·헤더에 서비스키 없음"
    fi
  else
    echo "skip 키를 몰라 키 비노출 확인을 건너뜀"
  fi
fi

exit "$failed"
