-- 학원 엔티티에 Google Places 기반 위치/메타데이터 컬럼 추가.
-- 프로덕션(NODE_ENV=production)에선 synchronize 비활성이므로 EC2 RDS 에 수동 적용 필요.
--
-- 적용 방법 (EC2 ec2-user@54.238.64.159):
--   docker exec -i doublewin-postgres psql -U doublewin doublewin < 이 파일
-- 또는 사용자 RDS 인 경우 RDS 엔드포인트로 psql 직접 접속.

ALTER TABLE academies
  ADD COLUMN IF NOT EXISTS latitude       NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude      NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS "googlePlaceId" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS source         VARCHAR(20) NOT NULL DEFAULT 'manual';

-- googlePlaceId 는 upsert dedup 키 — 유니크 제약. NULL 다중 허용.
CREATE UNIQUE INDEX IF NOT EXISTS academies_google_place_id_uq
  ON academies ("googlePlaceId")
  WHERE "googlePlaceId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS academies_source_idx ON academies (source);
