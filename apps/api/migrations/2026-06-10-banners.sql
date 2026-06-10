-- 홈/카테고리 프로모 배너 테이블. 어드민(배너 관리)에서 사진·태그·제목·서브내용 입력,
-- 활성/비활성 토글. 모바일 PromoCarousel 이 그대로 렌더.
-- prod 는 synchronize=off 이므로 수동 적용 필요.

CREATE TABLE IF NOT EXISTS banners (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement   varchar     NOT NULL DEFAULT 'home',   -- 'home' | 'category'
  "imageUrl"  text,                                   -- data URI(base64) 또는 외부 URL
  badge       varchar,                                -- 태그(배지)
  title       varchar     NOT NULL,
  subtitle    varchar,
  align       varchar     NOT NULL DEFAULT 'left',    -- 'left' | 'right'
  "isActive"  boolean     NOT NULL DEFAULT true,
  "sortOrder" integer     NOT NULL DEFAULT 0,
  "createdAt" timestamp   NOT NULL DEFAULT now(),
  "updatedAt" timestamp   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_placement_active
  ON banners (placement, "isActive", "sortOrder");
