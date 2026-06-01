-- 번개장터(아이홈마켓) 전용 포인트 지갑. 인출 불가, 번개장터에서만 사용.
-- prod RDS(PostgreSQL, synchronize:false) 에 배포 전 수동 적용. 2026-06-01 적용 완료.
ALTER TABLE users ADD COLUMN IF NOT EXISTS "marketPointBalance" numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE market_orders ADD COLUMN IF NOT EXISTS "usedPoint" numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE market_orders ADD COLUMN IF NOT EXISTS "pointEarned" numeric(12,2) NOT NULL DEFAULT 0;
