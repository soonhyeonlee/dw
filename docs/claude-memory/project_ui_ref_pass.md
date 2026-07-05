---
name: doublewin
description: 05.08~05.11 노션 스펙 기반 전면 리디자인. Phase별 작업 분해 + 완료/블로커 추적. 다음 세션이 이걸로 이어감
metadata: 
  node_type: memory
  type: project
  originSessionId: 3985b3ec-8ba6-4a06-a74e-dab81ef8093c
---

2026-05 사용자가 노션 스펙(05.08~05.11 미팅)을 전달. ShopBack 홈 + 캐치테이블 우리지역 캡처 2장이 디자인 레퍼런스.
**How to apply:** 다음 세션은 이 문서의 Phase 상태부터 확인하고 미완 Phase 이어서. **2026-05-28 미커밋 정리 완료** — 4 commits: da4ccb1(gitignore), 49ccb06(자산+스크립트), d1d4be7(Phase 1/4/5 UI), 7e4ec8d(학원/쿠폰 어드민화). GitHub push만 사용자 행동 대기.

## Phase 1 — 홈 + 하단 네비 (✅ 완료 + 에뮬 검증)
- 하단 네비: `홈/카테고리/관심목록/쿠폰/마이` — `(tabs)/_layout.tsx`. 캐시백/번개장터/우리지역 탭은 `href:null`로 숨김(라우트 유지)
- `app/categories.tsx` → `app/(tabs)/categories.tsx`로 이동(탭화, back버튼 제거)
- `(tabs)/wishlist.tsx` = `../mypage/wishlist` 재export, `(tabs)/coupons.tsx` = 신규 placeholder
- 홈 헤더 컴팩트화 + 로그인 시 "내 캐시백" 카드/통계 삭제
- 홈 폴더탭 `쇼핑/번개장터/우리지역/여행`: shop/travel은 홈 내부 콘텐츠 교체, market/region은 해당 화면으로 router.push(B안), 여행은 "준비 중" placeholder
- 쇼핑 탭 = `실시간 인기 쇼핑몰`(랭킹 리스트, RankRow) + `인기 상향 캐시백`(day탭) + 오늘의 딜 + 이번주 추천. 4열 몰 그리드(쇼핑몰 바로가기) 삭제, MallCard import 제거
- ⚠️ 오늘의 딜·이번주 추천은 스펙에 없지만 비파괴 차원에서 보존함 — 사용자가 빼라면 제거

## Phase 2 — 우리지역 (✅ 완료 + 에뮬 검증)
- `feed.ts` MockAcademy에 photos[]·phone·curriculum·notice·parking·sns 필드 추가
- `region/[id].tsx`: 히어로 사진 다중 paged 캐러셀+dots, 전화 DetailRow(tel: 링크), 학원정보 탭에 수업내용·안내및유의사항(주황 박스)·주차안내·문의및채널(카톡/인스타/페북/밴드 Linking) 추가
- ⚠️ 전국학원 구글맵은 미구현 — **블로커: Google Maps API key**. 위치는 placeholder 유지

## Phase 3 — 번개장터 (미착수, 일부 블로커)
- 가로 와이드 썸네일 리스트, 상세에 유튜브 영상
- 위탁판매 = 아이홈마켓 상품 연동 — **블로커: 아이홈마켓 AWS링크 + apikey (이순현 교수)**. 키 없으면 레이아웃만

## Phase 4 — 카테고리 (✅ 완료 + 에뮬 검증)
- `(tabs)/categories.tsx`에 샵백식 "전체 카테고리" 타일 그리드 10개(오픈마켓/패션/뷰티/가전/여행/홈라이프/식품/보험/도서/유아동) 추가
- 타일 탭 → 해당 분류만 필터(wrapGrid), 데이터 없으면 "준비 중". 미선택 시 카테고리별 미리보기(3개씩)
- 보험 등 mall 데이터 없는 분류는 "준비 중" 표시

## Phase 5 — 캐시백 화면 (✅ 완료, 타입체크 — 시각검증은 로그인 필요)
- `(tabs)/cashback.tsx` miniRow 재정렬+재명명: 환급 가능 캐쉬(=총적립) / 적립캐쉬(확인 대기중)(=처리중) / 환급 완료 캐쉬(=총환급)
- ⚠️ miniRow는 로그인 상태에서만 노출 — 에뮬 시각검증 미실시(테스트 계정 없음)

## AI 배너 이미지 (✅ 완료 + 에뮬 검증)
- `scripts/gen-banner-images.mjs` — 루트 .env의 OPENAI_API_KEY로 OpenAI 이미지 API(gpt-image-1) 호출, 재생성 가능
- 배너 5종 생성 → sharp로 1000px 리사이즈 + JPEG 변환 → `apps/mobile/assets/images/banner-{guide,signup,tier,travel,fashion}.jpg` (총 164KB)
- `PromoCarousel.tsx`에 풀블리드 이미지 모드 추가(`image` prop = require 에셋, 좌측 다크 스크림 + 흰 텍스트 + textShadow). 홈 캐러셀 3 + 카테고리 캐러셀 2에 적용
- UI 아이콘은 벡터(Ionicons) 유지 — AI 래스터 아이콘 비권장. 몰 로고도 AI 대상 아님
- 배너는 2회 재생성함. 최종: gpt-image-1 'high', 프롬프트="오브젝트를 우측에 그룹·가장자리 여백·잘림 없음", 스크립트가 **2:1 중앙 크롭**, `PromoCarousel` 슬라이드 height=`SLIDE_W/2`(정확히 2:1). 부드러운 3D 일러스트. 에뮬 검증 완료
- 홈 "오늘의 딜" 고정 타이머(23:14:02) → 자정까지 실시간 카운트다운으로 교체

## 몰 로고 (✅ 완료 + 에뮬 검증)
- 런타임 파비콘이 불안정(네이버/위메프 누락) → **실제 로고를 다운로드해 앱에 번들**
- `scripts/fetch-mall-logos.mjs` — clearbit/Google 파비콘에서 8몰 로고 받아 `assets/images/malls/{platform}.png`. 7/8 성공(쿠팡·네이버·11st·gmarket·ssg·lotteon·tmon). **위메프는 사이트 defunct(2024 경영위기)로 확보 불가** → 모노그램 폴백
- `src/lib/mallLogo.ts` — `mallLogoSource(mall)`: 어드민 logoUrl/iconUrl → 번들 로고(정적 require 맵) → 도메인 파비콘. `src/components/MallLogo.tsx` 폴백=컬러+첫글자
- 홈 RankRow·일자별 BigCard·MallCard 전부 `mallLogoSource`/`MallLogo` 사용
- 위메프 실제 로고는 어드민 logoUrl로 지정 필요. 쇼핑몰 로고는 실제 상표라 AI 생성 안 함
- 배너 3차 재생성: 강한 고대비(채도 높은 단색 배경 + 글로시 오브젝트) — "그라데이션처럼 보임" 해결. 에뮬 검증

## 어드민화 작업 (✅ 완료 + EC2 배포 + 검증)
사용자: 학원·번개장터·쿠폰·몰로고 전부 어드민 관리. AWS 직접배포 워크플로우 사용([[reference_aws_deploy_workflow]]).
- ✅ region API: Academy 엔티티 +5컬럼(tags/curriculum/notice/parking/sns). region 컨트롤러/서비스에 학원·쿠폰 어드민 CRUD 8엔드포인트, region.module AdminGuard 등록
- ✅ 어드민 페이지: `dashboard/academies`, `dashboard/coupons` 신규 + layout.tsx NAV
- ✅ 번개장터: 별도 market 어드민 불필요 — 모바일 market.tsx는 products(platform=doublewin)를 씀 → 어드민 products PLATFORMS에 'doublewin' 추가로 해결
- ✅ 모바일 region.tsx·region/[id].tsx mock→API 전환, `src/mock/feed.ts` 삭제. region.ts Academy 인터페이스 확장
- ✅ EC2 배포: RDS ALTER(academies +5컬럼) → tarball deploy → docker rebuild api+admin. **배포 중 디스크 부족(빌드캐시 14GB) → `docker builder prune -af`로 해결** (다음 배포 때도 주의)
- ✅ 검증: `/region/admin/*` 401(인증필요=정상 등록), 모바일 우리지역 화면이 라이브 API에서 학원 5건 로드 확인
- ⬜ 몰 어드민 logoUrl 필드 — 미구현. 번들 로고(7/8)로 이미 동작하므로 우선순위 낮음. 위메프 실로고만 미해결(어드민 logoUrl 지원은 mallLogoSource에 이미 있음, Mall 엔티티+어드민 페이지만 추가하면 됨)
- 모바일 최신 빌드: `doublewin-05.20.apk` (배너+로고+우리지역 API연동 반영)

## 보류/미결정
- 쿠폰 화면 스펙 "대기" — 현재 placeholder만
- 카카오 로그인 미결정 / iOS 동시 빌드 예정

## 이전 작업 (2026-05-20, Phase 이전)
- ShopBack 홈/캐치테이블 우리지역상세 1차 시각 정합 (index/region[id]/MallCard/PromoCarousel/_layout) → `doublewin-05.20.apk` 빌드+에뮬 검증 완료. Phase 1이 그 위에 다시 홈을 크게 바꿈

[[reference_emulator_workflow]] [[project_doublewin_redesign]] [[project_admin_product_mgmt]]
