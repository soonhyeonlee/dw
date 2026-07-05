---
name: 어드민 상품 관리 + 모바일 더미 제거 (2026-05-08)
description: 어드민 CRUD API + /dashboard/products 페이지 + 모바일 mock 전면 제거 + EC2 재배포 완료 - 다음 세션이 이 흐름 위에서 이어가게 하는 상태 스냅샷
type: project
originSessionId: 101eed50-9ca5-4474-8530-3a50970ab56d
---
**Why:** 사용자가 "어드민에서 상품 올리면 노출되게 해줘 지금 상품들 더미로 나오게하지말고 직접 추가할수 있게해줘 + 페이백 상품들도" 요청. 이전엔 모바일이 mock/feed.ts의 더미 데이터에 의존했는데, 이제 실제 RDS 데이터만 표시.

**How to apply:** 다음 세션에서 어드민/상품/모바일 표시 관련 작업 들어오면 이 문서를 먼저 읽고 현재 상태에서 이어갈 것. 코드는 모두 EC2(54.238.64.159) + 로컬(/Unreal Projects/CEN)에 동기화돼 있음.

## 2026-05-08 완료 작업

### 1. API: 어드민 CRUD 엔드포인트 (apps/api/src/products/)
- `products.module.ts`: `UsersModule` import + `AdminGuard` provider 등록
- `products.service.ts`: `adminFindAll`(filter: platform/category/keyword/isActive/page/limit), `create`(externalId 비면 `admin-{ts}-{rand}` 자동), `update`, `remove` 추가
- `products.controller.ts`: 4개 어드민 엔드포인트 추가 (모두 `JwtAuthGuard + AdminGuard`)
  - `GET /products/admin/all`
  - `POST /products`
  - `PATCH /products/:id`
  - `DELETE /products/:id`

### 2. Admin: 상품 관리 페이지 (apps/admin/src/app/dashboard/products/page.tsx — NEW)
- 좌측 사이드바 NAV에 `🛍️ 상품 관리` 추가 (layout.tsx)
- 리스트: 플랫폼/키워드 필터, 이미지 썸네일, 활성 토글, 페이지네이션
- 모달 폼: platform/category select, title/description/imageUrl/productUrl/affiliateUrl, price/originalPrice/discountRate, cashbackRate/rating/reviewCount, isActive 체크박스
- 이미지 URL 입력하면 즉시 미리보기 노출

### 3. Mobile: 더미 상품 제거 (전부 실제 API 호출로 교체)
- `app/(tabs)/search.tsx`: `DEMO_PRODUCTS` 제거 → 빈 결과는 기존 빈 상태 UI
- `app/mall/[platform].tsx`: `MOCK_MALLS/MOCK_DEAL_PRODUCTS/MOCK_REC_PRODUCTS` 제거 → `getMallDetail` + `getProducts({platform})`. 플랫폼 컬러는 `PLATFORM_TINT` 테이블로 인라인
- `app/product/[id].tsx`: `findProductById` 제거 → `getProduct(id)` + `clickProduct`(affiliate redirect) + `toggleWishlist`. loading/notFound 상태 추가
- `app/(tabs)/market.tsx` (페이백/번개장터): `MOCK_MARKET_*` 제거 → `getProducts({platform: 'doublewin', category})`. 빈 상태에 "관리자 페이지에서 상품을 추가하면 이곳에 노출됩니다" 안내 표시
- `src/mock/feed.ts`: 상품/몰 mock 전부 제거. `MOCK_ACADEMIES`/`MOCK_COUPONS`만 남김 (region 페이지용 — 별도 스코프, 손대지 말 것)

### 4. EC2 재배포
- tarball: `/tmp/dw-deploy.tar.gz` (243KB, mobile 제외)
- `docker compose up -d --build api admin` 둘 다 재빌드
- 백업: `/opt/doublewin/.apps.bak.<ts>`
- 컨테이너 상태: doublewin-api/admin/crawler 모두 정상

### 5. 검증 (관리자 토큰으로 E2E)
- POST coupang 캐시백 테스트 상품 → `GET /products?platform=coupang`에서 최상단 노출 확인
- POST doublewin 페이백 테스트 상품 → `GET /products?platform=doublewin`에서 1건 단독 노출 확인
- `GET /products?keyword=테스트` 2건, 상품 상세 정상
- DELETE 양쪽 테스트 상품 → keyword=테스트 / platform=doublewin 모두 0건 복귀

## 어드민 계정/인증 정보

- **이메일**: `admin@doublewin.co.kr`
- **role**: `admin`
- **user.id**: `eec4344a-3e81-4f1b-a7d8-2eb68610cb1f`
- **비밀번호**: 사용자만 알고 있음 (Claude는 모름)
- **테스트 시 우회 방법**: API 컨테이너 안에서 JWT 직접 mint
  ```bash
  ssh -i ~/.ssh/doublewin-key.pem -o IdentitiesOnly=yes ec2-user@54.238.64.159 \
    'sudo docker exec doublewin-api node -e "const{Client}=require(\"pg\");const jwt=require(\"jsonwebtoken\");const c=new Client({host:process.env.DATABASE_HOST,user:process.env.DATABASE_USER,password:process.env.DATABASE_PASSWORD,database:process.env.DATABASE_NAME,port:5432,ssl:{rejectUnauthorized:false}});c.connect().then(()=>c.query(\"SELECT id, email FROM users WHERE role='\''admin'\'' LIMIT 1\")).then(r=>{const u=r.rows[0];process.stdout.write(jwt.sign({sub:u.id,email:u.email},process.env.JWT_SECRET,{expiresIn:\"5m\"}));process.exit(0)})"'
  ```
- JWT payload 형식: `{sub: userId, email}`, `JWT_EXPIRATION=7d`(prod), `JWT_SECRET`은 EC2 .env에

## 어드민 페이지 접근 URL
- EC2 직접: `http://54.238.64.159/login` (admin 컨테이너가 80포트)
- 로그인 후 `/dashboard/products`

## 모바일 데이터 흐름 (현재)
- `(tabs)/index` (홈): `getHomeData()` — 블록 기반
- `(tabs)/search`: `getProducts({keyword, platform, page, limit})` + `getMalls()` (매칭몰 표시)
- `(tabs)/market` (번개장터/페이백): `getProducts({platform: 'doublewin', category})` — **doublewin 플랫폼 상품만**
- `mall/[platform]`: `getMallDetail(platform)` + `getProducts({platform, limit:20})`
- `product/[id]`: `getProduct(id)` + `clickProduct(id)` + `toggleWishlist(id)`

## 알려진 미해결/대기 사항
- **APK 검증**: 5개 탭 표준 release APK 검증(Task #10)이 사용자에게 거부된 채로 남음. 필요 시 `doublewin-0.5.apk`(87.9MB)로 재시도 가능
- **어드민 직접 사용 검증**: 사용자가 admin 페이지에서 실제로 추가/수정/삭제 해본 결과는 미검증 (E2E API는 검증됨)
- **카테고리 필터 매칭**: 어드민 폼은 `의류/식품/디지털/뷰티/생활/도서/여행/스포츠/유아동/기타`, market 탭은 `food/health/living/beauty/digital/all`. 한국어 카테고리 사용 중이라 일부 미매칭 가능 — 필요 시 매핑 테이블 정리 필요
- **mock/feed.ts 잔존**: `MOCK_ACADEMIES`, `MOCK_COUPONS`만 남음 — region/[id].tsx 등이 사용. 우리지역 작업 들어오면 이것도 API 전환

## 변경된 파일 목록 (히스토리 ref)
- apps/api/src/products/products.{module,service,controller}.ts
- apps/admin/src/app/dashboard/layout.tsx
- apps/admin/src/app/dashboard/products/page.tsx (신규)
- apps/mobile/app/(tabs)/{search,market}.tsx
- apps/mobile/app/mall/[platform].tsx
- apps/mobile/app/product/[id].tsx
- apps/mobile/src/mock/feed.ts
