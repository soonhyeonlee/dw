---
name: project-ihome-doublewin-sync
description: 아이홈마켓 영카트 → DoubleWin RDS 단방향 sync. 카페24 DB 외부접속 차단 우회 (HMAC+IP whitelist PHP 엔드포인트). 2026-05-28 461개 상품 1차 동기화 검증 완료
metadata: 
  node_type: memory
  type: project
  originSessionId: 50b3afbe-31cc-499b-94c1-e7233c56af38
---

**Why:** 사용자가 "DB를 동일하게 사용"을 요청. 카페24 MariaDB 외부접속은 IP 화이트리스트 등록 필요(=사용자 액션)인데 "너가 직접 다 할수 있는 방향으로"라 함. 그래서 EC2가 사용자 액션 없이 끝낼 수 있는 read-only sync로 진행.

**How to apply:** 영카트 상품/회원/주문 데이터를 DoubleWin이 읽어야 할 때 직접 DB 접속 대신 이 sync 채널 활용. 데이터 추가가 필요하면 [[reference-cafe24-workflow]]의 PHP 우회 패턴 그대로 확장.

## 아키텍처

```
i-homemarket.co.kr (cafe24, MariaDB 10.1.13)
        │
        │  PHP endpoint:
        │  /www/api_sync/udza6nvy0s1w/sync.php
        │  ─ HMAC SHA256 + 5min timestamp window
        │  ─ IP whitelist (54.238.64.159 EC2 + 106.246.230.74 워크스테이션)
        │  ─ read-only SELECT against g5_shop_item / g5_shop_category
        │  ─ actions: ping | categories | items (paginated, incremental via it_update_time)
        │
   HTTPS (outbound from EC2)
        │
        ▼
DoubleWin API (NestJS, EC2 54.238.64.159)
   apps/api/src/sync/
   ─ IhomeSyncService: OnApplicationBootstrap + setInterval(IHOME_SYNC_INTERVAL_MS, default 600s)
   ─ pulls items page by page, upserts into products with platform='ihomemarket'
   ─ cursor (last it_update_time) persisted in ihome_sync_state table (id=1)
   ─ /sync/ihome/{status,run} behind AdminGuard for manual ops
        │
        ▼
DoubleWin RDS (PostgreSQL, ap-northeast-1)
   products WHERE platform='ihomemarket'  (1차 동기화: 461 rows)
```

## 핵심 파일

- 로컬 PHP 소스: `.work-ihomemarket/sync/sync.php` (gitignored, secret placeholder `__SECRET__`)
- 배포 스크립트: `.work-ihomemarket/sync/deploy_sync.py` — FTP 업로드 + ping 검증, 검증된 시크릿/URL은 `.work-ihomemarket/sync/.secret.local.json`에 영구 저장
- NestJS 모듈: `apps/api/src/sync/` (commit e81c903)
- RDS 마이그레이션: `ihome_sync_state` 테이블 (SERIAL id + cursor/timestamps/totals)

## 컬럼 매핑

| 영카트 g5_shop_item | DoubleWin products |
|---|---|
| `it_id` | `externalId` (+ platform='ihomemarket' unique) |
| `it_name` | `title` |
| `it_basic` (HTML 포함) | `description` |
| `it_price` | `price` |
| `it_cust_price` (시중가) | `originalPrice` (단, price와 같으면 null) |
| 계산식 | `discountRate` = (cust-price)/cust × 100 |
| `https://i-homemarket.co.kr/data/item/${it_img1}` | `imageUrl` |
| `https://i-homemarket.co.kr/shop/item.php?it_id=${it_id}` | `productUrl` / `affiliateUrl` (어필리에이트 없음 → 동일) |
| `g5_shop_category.ca_name` (LEFT JOIN) | `category` |
| `it_use='1' && it_soldout!='1'` | `isActive` |
| `it_use_avg` (>0이면) | `rating` |
| `it_use_cnt` | `reviewCount` |
| (영카트엔 없음) | `cashbackRate`/`cashbackAmount` = 0 (어드민에서 수동 설정, 기존값 보존) |

## 운영 메모

- EC2 .env에 `IHOME_SYNC_ENABLED=true`, `IHOME_SYNC_URL`, `IHOME_SYNC_SECRET`, `IHOME_SYNC_INTERVAL_MS=600000` 등록 완료
- 첫 배포 시 두 가지 실수 메모:
  1. PowerShell `tee -a`로 .env 수정 → UTF-16 BOM 들어가 docker compose 파싱 실패. **EC2에서 직접 추가하거나 ASCII로 인코딩된 임시 파일 scp 후 cat tee** 패턴 사용할 것
  2. docker-compose.prod.yml `environment:` 블록은 명시된 키만 컨테이너로 전달. 새 env 변수 추가 시 compose 파일에도 매핑 추가 필요 (env_file 자동 흡수 X)
- 영카트 PHP 엔드포인트 인코딩 표준: `http_build_query` 기본 = RFC 1738(space=+). Node에서 sign할 때 `encodeURIComponent`(=%20)는 mismatch → `URLSearchParams` 사용해야 양쪽 정합
- cursor가 `>=` 비교라 매 동기화마다 last update_time row 1건은 다시 fetch됨. 데이터 늘어나면 `>` + 적절한 cursor 진입점으로 개선 여지

## 미해결/확장 후보

- 회원(g5_member) 동기화 — 영카트 mb_id 형식과 DoubleWin users UUID PK 충돌. 필요할 때 별도 결정
- 주문(g5_shop_order), 위시리스트(g5_shop_wish) 양방향 sync — 현재는 read-only
- 모바일 시각 검증 미실시 — 새 mobile 코드(market.tsx platform='doublewin,ihomemarket')는 EC2에 함께 deploy됐으나 모바일 빌드/설치는 별개. 다음 apk 빌드 시 자연스럽게 반영됨
- 카페24 호스팅 매니저에서 EC2 IP를 화이트리스트 등록하면 (B) 데이터 통합 또는 (A) DB 직접 연결로 업그레이드 가능. 그 시점에 이 sync 채널은 폐기 가능

## 후속 작업 (2026-05-28 추가)

- products.service findAll에 platform CSV 지원 추가 (`doublewin,ihomemarket` → SQL IN). 단일 값은 equality 그대로 — 향후 다른 곳에서 재활용 가능하니 유지
- 모바일 market.tsx 최종: **platform='ihomemarket' 단일** (사용자 지시 — 중고/번개장터에는 아이홈마켓 sync 상품만 노출). CATS chips도 영카트 분류(기획전/건강기능식품/식품/과일/주방용품/특산품)로 재정렬 — 영카트 카테고리 추가 시 mobile CATS도 같이 업데이트 필요
- 카테고리별 endpoint 검증 완료: 전체=455 / 기획전=309 / 건강기능식품=55 / 식품=47 / 과일=20 / 주방용품=19 / 특산품=5 (합=455, 일치)
- 빈 상태 카피 "관리자 페이지에서 추가하면 노출" → "이 분류에는 아직 상품이 없어요"로 자연스럽게 변경 (이제 cron sync 자동 유입)
- **mobile apk 빌드는 별도** — 기존 doublewin-05.20.apk는 platform='doublewin' 단일로 컴파일됨. 새 빌드부터 ihomemarket 노출
- admin sync endpoint(/sync/ihome/status,run)를 JWT mint 후 HTTP 호출로 검증 완료 — status에 cursor/totalSynced/lastRunAt 정상, manual run 작동
- cursor가 `>=` 비교라 manual run마다 마지막 timestamp의 1건이 반복 fetch됨 (totalSynced 461→465). 데이터 무결성은 정상, 트래픽만 약간 낭비. 향후 cursor를 `>` + tiebreaker로 개선 여지

[[project-ihomemarket]] [[reference-cafe24-workflow]] [[project-doublewin-redesign]]
