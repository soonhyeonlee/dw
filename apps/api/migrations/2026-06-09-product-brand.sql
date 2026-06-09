-- 상품 brand(제조사/브랜드) 컬럼 추가. 영카트 it_maker 로 채움(ihome-sync).
-- 카테고리 화면에서 (경유사 · 회사) 그룹핑에 사용.
-- prod 는 synchronize=off 이므로 수동 적용 필요.

ALTER TABLE products ADD COLUMN IF NOT EXISTS brand varchar(120);

-- 적용 후: ihome_sync_state 커서를 초기화해 전체 재동기화로 기존 상품의 brand 백필.
--   UPDATE ihome_sync_state SET "lastSinceCursor" = '' WHERE id = 1;
-- 그리고 API 컨테이너 재시작(부팅 시 sync) 또는 sync 트리거.
