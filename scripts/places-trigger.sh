#!/usr/bin/env bash
#
# Google Places 학원/어린이집 1회 수집 트리거.
#
# 사용법 (EC2 외부에서):
#   GOOGLE_PLACES_API_KEY=AIza... ./scripts/places-trigger.sh
#
# 이 스크립트가 하는 일:
#   1. EC2 .env 에 GOOGLE_PLACES_API_KEY 등록 (ASCII safe, BOM 없음)
#   2. 크롤러 컨테이너에 env 반영 (재시작)
#   3. CRAWLER_MODE=places_once 로 1회 수집 트리거
#   4. RDS 에 저장된 행 수 확인
#
# 비용 안전장치: places_once 는 일회성 수동 트리거. schedule 모드의 주간
# 자동 실행은 별개. 이걸 여러 번 돌리면 API 비용이 비례 증가.

set -e

KEY="${GOOGLE_PLACES_API_KEY:-}"
if [ -z "$KEY" ]; then
  echo "ERROR: GOOGLE_PLACES_API_KEY 환경변수 비어있음."
  echo "사용법: GOOGLE_PLACES_API_KEY=AIza... ./scripts/places-trigger.sh"
  exit 1
fi

if [[ ! "$KEY" =~ ^AIza[0-9A-Za-z_-]{30,}$ ]]; then
  echo "WARN: 키 형식이 일반적인 Google API 키와 달라 보입니다 ($KEY 의 앞부분). 계속할까요? (Ctrl+C 로 중단)"
  sleep 3
fi

SSH="ssh -i $HOME/.ssh/doublewin-key.pem -o IdentitiesOnly=yes ec2-user@54.238.64.159"

echo "[1/4] EC2 .env 에 API 키 등록"
$SSH "cd /opt/doublewin && \
  sudo sed -i '/^GOOGLE_PLACES_API_KEY=/d' .env && \
  echo 'GOOGLE_PLACES_API_KEY=$KEY' | sudo tee -a .env >/dev/null && \
  grep -c '^GOOGLE_PLACES_API_KEY=' .env"

echo "[2/4] crawler 컨테이너에 env 반영"
$SSH "cd /opt/doublewin && sudo docker compose -f docker-compose.prod.yml up -d crawler"

echo "[3/4] Google Places 1회 수집 (몇 분 걸림)"
$SSH "cd /opt/doublewin && sudo docker compose -f docker-compose.prod.yml run --rm -e CRAWLER_MODE=places_once crawler 2>&1 | tail -40"

echo "[4/4] RDS 결과 확인"
$SSH "sudo docker exec -w /app doublewin-api node -e \"
const {Client} = require('pg');
const c = new Client({ host: process.env.DATABASE_HOST, user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD, database: process.env.DATABASE_NAME,
  ssl: { rejectUnauthorized: false } });
(async () => {
  await c.connect();
  const r = await c.query(\\\"SELECT region, category, COUNT(*) AS n FROM academies WHERE source='google_maps' GROUP BY region, category ORDER BY region, category\\\");
  console.log('=== 지역/카테고리별 수집량 ===');
  r.rows.forEach(x => console.log(x.region.padEnd(20), x.category.padEnd(10), x.n));
  const tot = await c.query(\\\"SELECT COUNT(*) AS total FROM academies WHERE source='google_maps'\\\");
  console.log('총', tot.rows[0].total, '건');
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
\""

echo "완료. 모바일 우리지역 탭 → 전체/내 주변 토글에서 결과 확인하세요."
