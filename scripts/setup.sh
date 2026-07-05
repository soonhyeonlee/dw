#!/usr/bin/env bash
# DoubleWin(CEN) 첫 PC 셋업 스크립트 (macOS / Linux / Git-Bash)
# 멱등: 여러 번 실행해도 안전.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ 1/6  필수 도구 확인"
for c in git node npm docker; do
  if ! command -v "$c" >/dev/null 2>&1; then
    echo "  ✗ '$c' 없음 — 먼저 설치하세요"; MISSING=1
  else echo "  ✓ $c $(command -v $c)"; fi
done
[ "${MISSING:-0}" = "1" ] && { echo "필수 도구 설치 후 다시 실행"; exit 1; }

echo "▶ 2/6  .env 준비"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  → .env 생성됨. ⚠️ DB비번/JWT_SECRET/COUPANG·NAVER·LLM 키를 직접 채워야 함"
else echo "  ✓ .env 이미 존재 (유지)"; fi

echo "▶ 3/6  DB/Redis 컨테이너 기동"
docker compose up -d postgres redis

echo "▶ 4/6  의존성 설치 (npm workspaces)"
npm install

echo "▶ 5/6  DB 마이그레이션 + 관리자 시드"
npm run db:migrate || echo "  (마이그레이션 스킵/실패 — DB 준비 후 재시도 가능)"
npm run seed       || echo "  (시드 스킵/실패 — 이미 있거나 DB 미준비)"

echo "▶ 6/6  완료. 실행 명령:"
echo "  npm run api      # 백엔드  http://localhost:3000"
echo "  npm run admin    # 관리자  http://localhost:3001"
echo "  npm run mobile   # 모바일 (Expo)"
echo "  npm run crawler  # 크롤러 (Python 필요, 1회)"
echo "✅ setup.sh 종료"
