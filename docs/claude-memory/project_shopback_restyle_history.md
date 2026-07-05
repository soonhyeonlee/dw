---
name: 샵백 리디자인 작업 상세 히스토리
description: 2026-05-05~05-06 진행한 샵백 #1~#15 작업의 화면별 결정·근거·코드 변경 상세 (commit 메시지 작성용 참고)
type: project
originSessionId: b07bfdb0-c89b-4665-acae-aef0ba33e817
---
DoubleWin 모바일 앱(`apps/mobile`)을 ShopBack(샵백) UX 패턴에 맞춰 15개 화면 재구성한 작업의 상세 히스토리.

**Why:** 사용자가 샵백을 직접 사용해보고 "샵백 스타일로 가자"고 결정. ADB 캡처 → 분석 → DoubleWin 적용 → typecheck → 다음 화면 워크플로우로 진행.

**How to apply:** 향후 commit 메시지/PR 설명 작성, 회귀 발생 시 의도 추적, 후속 작업의 컨텍스트 참고에 사용.

---

## 작업 환경
- AVD: `Pixel_7_Pro_API_30` (1440x3120, density 560)
- 샵백 패키지: `com.shopback.app`
- 캡처 위치: `design-mockup/shopback/{01-home..15...}/`
- 진행 도중 chat compaction 1회 발생 (#6 진입 직전)
- 진행 도중 #6 작업 시 샵백 Earn More 탭이 서버 에러("페이지 오류 안내", "Uh oh, something went wrong / Reload")로 캡처 불가 → 패턴만 차용
- 모든 task 완료 후 `npx tsc --noEmit` exit 0 확인

## 신규 컴포넌트
- `apps/mobile/src/components/EmptyState.tsx` — ShopBack 에러 페이지 패턴(아이콘 원형 배경 + 타이틀 + 서브 + 검정 pill 액션 버튼) 차용. compact 옵션 지원. #7~#14 광범위 사용

## 태스크별 상세

### #1 홈 화면 — `app/(tabs)/index.tsx`
**근거:** 샵백 홈은 시간 기반 promo("Time Deal", "Rate Up")와 환영 가이드가 두드러짐.
**적용:**
- `PROMO_BADGE_LABEL` 맵 추가 (time_deal/rate_up/welcome 각 bg/fg 컬러)
- `formatPromoCountdown` — "N시간 후 종료" / "N일 후 종료"
- `MallCell` 강화: logoWrap + badge overlay + rateRow + prevRateText(취소선) + countdownText
- 캐시백 카드 위 welcome 가이드 배너 (book 아이콘 → 이후 #13에서 `/guide`로 직결)
- "전체" 버튼 → `/categories` 라우트
- 헤더 종 아이콘 → 이후 #14에서 `/notifications` 연결

### #2 카테고리 탭 — 신규 `app/categories.tsx`
**근거:** 샵백은 Categories를 두 번째 탭으로 두고 9~10개 분류로 쇼핑몰 그룹화. DoubleWin은 5탭 구조 유지 결정 → categories를 일반 라우트로 신설.
**적용:**
- `CATEGORY_ORDER` 9종 (종합쇼핑/패션/뷰티/식품·생필품/가전·디지털/여행·예약/도서/홈·인테리어/유아동)
- 카드사 혜택 placeholder hero
- `useMemo`로 mall들을 카테고리별 그룹
- 3-tile-per-row 레이아웃, 4개 이상 시 "더보기"
- 자체 헤더 (뒤로가기 + 북마크)

### #3 검색 화면 — `app/(tabs)/search.tsx`
**근거:** 샵백은 검색 입력 시 즉시 매칭되는 stores를 상단에 칩으로 노출.
**적용:**
- `getMalls` fetch + state
- `matchingMalls` useMemo — 입력어로 name/platform 필터
- `MallChip` 컴포넌트 (logo + name + rate)
- "쇼핑몰 바로가기" 섹션 추가 (PlatformFilter 위)
- 빈 상태에서 "추천 쇼핑몰" horizontal scroll (top 8)

### #4 쇼핑몰 상세 — `app/mall/[platform].tsx`
**근거:** 샵백 mall 상세는 큰 적립률 + 단계별 적립 타임라인 + 쿠폰 카드.
**적용:**
- `getMallDetail` fetch + apiMall state
- 찜 하트 토글 (apiMall.id 기반, 미로드 시 alert)
- 카테고리 칩 (로고 아래)
- 프로모 배지 (이름 아래)
- 큰 "최대 N% 캐시백" heroRateBig
- **3단계 적립 타임라인**: 구매(active) → 적립(2일 이내, active) → 승인 완료 + cashbackNote
- `handleGo` → `/activate-cashback`로 mall/rate/url 전달

### #5 상품 상세 — `app/product/[id].tsx`
**근거:** 샵백은 외부 쇼핑몰 이동 직전 별도 interstitial(Activate Cashback) 화면을 보여줌.
**적용:**
- `handlePurchase`에서 직접 외부 브라우저 열지 않고 `/activate-cashback` 라우트로 mall/rate/url 전달
- 신규 `app/activate-cashback.tsx` — 회전 로고 1.5초 → `WebBrowser.openBrowserAsync` → `router.back()`. error fallback "돌아가기" 버튼

### #6 번개장터 — `app/(tabs)/market.tsx` (디자인 유지 결정)
**근거:** 샵백 Earn More 탭이 에뮬 환경에서 "페이지 오류" 응답으로 캡처 실패. + DoubleWin "번개장터"는 *산지직송 위탁판매*고 샵백 "Earn More"는 *추가 적립 채널*이라 1:1 매핑 부적절.
**적용:** 현재 market.tsx가 이미 ShopBack 톤(검정 pill 칩/오렌지 강조/카드 그리드)을 따라 충분 → **변경 없음**, 후속 작업으로 미룸.

### #7 우리지역 — `app/(tabs)/region.tsx`
**근거:** 사용자 "다시진행해 제대로" 요청. 샵백 캡처 불가하지만 패턴은 명확 — 빈 상태/액션시트가 부족했음.
**적용:**
- `EmptyState` 컴포넌트 신설 (재사용 가능)
- 학원 검색 결과 0건 → "검색 결과가 없어요" + "조건 초기화" 버튼
- 쿠폰 0건 → "받을 수 있는 쿠폰이 없어요"
- 위치 선택 액션시트 (iOS ActionSheetIOS / Android Alert) — 5개 서울 지역
- 정렬 시트 (인기/평점/리뷰많은/가까운순)
- 헤더 검색 아이콘 추가
- 쿠폰북 인트로 → 그라데이션 hero 카드 (gift 아이콘 + 카운트 배지)

### #8 캐시백 내역 — `app/(tabs)/cashback.tsx`
**근거:** 샵백은 기간 필터와 거래 클릭 시 상세 시트 제공.
**적용:**
- 기간 필터 칩 4종 (이번달/지난달/최근 3개월/전체) — `isInPeriod` 클라이언트 측 필터
- 거래 클릭 → 바텀시트 모달 (제목/상태배지/금액/키-값 테이블/이 거래에 문의하기 버튼/확인)
- 빈/게스트 EmptyState 통합
- "기간엔 없지만 다른 기간엔 있을 때" → "전체 보기" 액션으로 자동 전환
- 거래 행 → `TouchableOpacity` 시각 피드백

### #9 출금·환급 — 신규 `app/cashback/withdraw.tsx`
**근거:** 기존엔 `Alert.prompt`(iOS-only)로 금액 입력, 안드는 "전액"만 가능 → 안드 사용자 기능 차별. + 계좌 정보 미표시 + 빠른 금액 버튼 부재.
**적용:**
- 풀스크린 라우트 신설
- 어두운 잔액 카드
- 큰 금액 입력 박스 (idle/focus/error 3-state) + 천 단위 콤마 자동
- 빠른 금액 칩 (+1만/+3만/+5만/+10만, 잔액 미만 자동 비활성) + 오렌지 "전액" pill
- 계좌 카드: 미등록 시 dashed 빈 카드 + 등록 안내, 등록 시 마스킹된 계좌
- 안내(수수료 무료/1~3일 입금/예금주 매칭)
- 하단 고정 CTA (잔액·금액·계좌 상태에 따라 동적 라벨)
- `cashback.tsx` `handleWithdraw`는 5천원 가드만 두고 라우트로 위임 (`requestWithdrawal` import 제거)
- `bank-account.tsx` prefill 추가, "계좌 등록"↔"계좌 변경" 라벨 토글

### #10 마이페이지 — `app/(tabs)/mypage.tsx`
**근거:** 샵백 Account는 큰 프로필 + 티어/멤버십 + 친구 초대 메뉴가 핵심.
**적용:**
- **티어 시스템** SEED/BRONZE/SILVER/GOLD (임계값 0/10만/30만/100만원, 컬러 + 이모지)
- `getTier()` 함수 — 진행도 + remain 계산
- 프로필 행 아래 티어 카드 (이모지 + 라벨 + "BRONZE까지 N원 남음" + 컬러 진행 바)
- 환급 버튼 → `/cashback/withdraw` 직결 (이전엔 `/(tabs)/cashback`로 한 번 더 눌러야 했음) + 5천원 가드
- 친구 초대 메뉴 신규 (HOT 배지)
- 로그아웃 버튼: 단순 텍스트 → ink200 테두리 + 아이콘
- 편집 chevron → pencil 아이콘

### #11 관심목록 — `app/mypage/wishlist.tsx`
**근거:** 샵백 Watchlist는 stores/products 두 갈래 + 강력한 빈 상태.
**적용:**
- 세그먼트 탭 (상품/쇼핑몰) + 카운트
- 쇼핑몰 wishlist 통합 — `getMallWishlist` API 사용 (#1에서 추가됐지만 화면 미연결)
- `MallRow` 컴포넌트 (컬러 로고 + 이름 + "최대 N% 캐시백" + chevron, 탭 → mall detail)
- EmptyState 통일 — 상품 0건 → `/(tabs)/market`, 쇼핑몰 0건 → `/categories`
- Pull-to-refresh

### #12 도움말·누락 캐시 — 신규 `app/help/index.tsx` + `app/help/missing-cashback.tsx`
**근거:** 마이페이지·캐시백에서 "준비 중" Alert로 막혀있던 메뉴들이 다수.
**적용 (`/help`):**
- Hero (제목 + 검색바, FAQ 키워드 검색)
- 빠른 액션 카드 2장 (누락 캐시 / 1:1 문의)
- 카테고리 그리드 7개 + 활성 필터
- FAQ 9개 항목 (Q.+ 펼침 시 A.)
- 빈 상태 인라인 표시
- 검은 컨택트 박스 + 오렌지 pill
**적용 (`/help/missing-cashback`):**
- 안내 박스 (오렌지 톤, 4일 경과/주문번호 위치/경유 필수)
- 입력 필드: 쇼핑몰(7개 프리셋 + 직접 입력) · 주문일(YYYY.MM.DD) · 주문번호 · 주문금액(콤마 자동) · 사유(라디오 4개) · 상세설명(500자 카운터)
- 실시간 valid 검증 + 시뮬 600ms 후 success Alert
**연결:** `mypage.tsx` supportItems · `cashback.tsx` 헤더 helpBtn · 거래 시트 "이 거래에 문의하기" 모두 `/help/missing-cashback` 라우트로

### #13 이용가이드 — 신규 `app/guide.tsx`
**근거:** 샵백처럼 첫 사용자 온보딩용 시각화된 가이드 부재.
**적용:**
- Hero ("처음 사용하시나요?" 오렌지 배지 + "최대 30%" 컬러 강조 타이틀)
- **1. 캐시백 받는 방법** — 4단계 타임라인 (검정 원형 번호 + 세로 연결선)
- **2. 환급 받는 방법** — 회색 카드 3개 + "지금 환급 신청하러 가기" 오렌지 CTA
- **3. 적립이 안 되는 경우** — DO/DON'T 4개 (빨간 X 3개 + 초록 체크 1개)
- **4. 더 궁금하다면** — `/help`, `/help/missing-cashback` 링크 카드
**연결:** `mypage` 이용가이드 메뉴 + 홈의 welcome 가이드 배너 → `/guide`

### #14 알림 화면 — 신규 `app/notifications.tsx`
**근거:** 푸시 토큰 등록은 있지만 인앱 알림 화면 없음 (mypage·home 종 아이콘 무동작).
**적용:**
- Stack `headerRight` 동적 "모두 읽음" 버튼 (unread 0 시 숨김)
- 필터 칩 5종 (전체/캐시백/환급/이벤트/공지)
- 시간 그룹화 (오늘/어제/이번 주/이전)
- 타입별 아이콘 컬러: 캐시백(오렌지) / 환급(그린) / 이벤트(보라) / 공지(회색)
- 읽지 않음 행 강조 (옅은 오렌지 배경 + 좌측 dot + 굵은 제목)
- 클릭 시 read=true + 컨텍스트 라우팅
- 상대 시간 라벨 ("30분 전" / "5시간 전" / "3일 전" / "5.06")
- 7개 mock (캐시백 적립 2/환급 1/프로모 2/공지 1/주간초과 1)
**연결:** `mypage`·`home` 헤더 종 아이콘

### #15 설정/회원정보 — 신규 `app/settings/notifications.tsx` + `app/settings/legal/[type].tsx` + `app/settings/about.tsx`
**근거:** 마이페이지 settingItems의 알림 설정/이용약관/개인정보가 모두 `notReady` 상태였음.
**적용 (`/settings/notifications`):**
- 그룹 4개 (내 활동/혜택과 이벤트/서비스/방해 금지)
- 토글 9종 + 야간 알림 끄기
- 카드 묶음 + 각 행 아이콘·라벨·설명·Switch
**적용 (`/settings/legal/[type]`):**
- `type=terms` → 이용약관 9조항 (목적/정의/서비스/회원의무/적립취소/환급/개인정보/책임제한/약관변경)
- `type=privacy` → 개인정보 처리방침 8조항
- 시행일자 + 22px 타이틀 + 18라인 본문
**적용 (`/settings/about`):**
- 큰 오렌지 로고 + 앱명 + 버전(v0.4.0/40) + 웹사이트 링크
- 카드 3섹션: 앱(버전/업데이트/캐시삭제/오픈소스) · 약관·정책 · 계정(회원 탈퇴 destructive)
- 탈퇴 컨펌 모달 (3가지 손실 안내 + "탈퇴합니다" 정확 입력 검증) → logout + replace `/auth/login`

## 사용자 피드백·결정사항 누적
- "차례대로 모든페이지 진행해 나눠서" — 큰 분량 작업을 조각으로 나누되 끊김없이 이어가는 페이스 선호
- "너가 직접 스샷찍어서 진행해" — ADB 캡처를 사용자 대신 직접 수행
- "이미 앱을 실행해서 로그인 해놨어" — 샵백 로그인 상태 활용
- "다시진행해 제대로" (#7 시점) — 샵백 캡처 실패하더라도 *의미있는 변화*를 기대. 단순 placeholder가 아닌 재사용 컴포넌트 신설 + 빈상태 처리 등 적용
- "commit하고 재부팅할게 모든 히스토리도 상세하게 기억해줘" (2026-05-06) — 사용자가 직접 commit 수행 의지. 본 메모리는 그 commit 메시지 작성 참고용

## 백엔드 변경
- `apps/api/src/blocks/entities/mall.entity.ts` — 4개 컬럼 추가 (`previousCashbackRate` decimal, `promoEndsAt` timestamp, `promoBadge` string, `category` string + `@Index`). dev 환경 TypeORM `synchronize: true`라 마이그레이션 불필요

## API 시그니처 추가
- `apps/mobile/src/api/products.ts`:
  - `toggleMallWishlist(mallId)` → POST `/products/mall/:id/wishlist`
  - `getMallWishlist()` → GET `/products/user/mall-wishlist`
- `apps/mobile/src/api/home.ts`:
  - `Mall` 타입에 `affiliateBaseUrl?` `previousCashbackRate?` `promoEndsAt?` `promoBadge?` `category?` 추가
  - `MallPromoBadge` 타입 export

## _layout.tsx Stack 등록 (신규 라우트)
순서대로:
- `cashback/withdraw` (headerShown: false, 자체 헤더)
- `help/index`
- `help/missing-cashback`
- `guide`
- `notifications`
- `settings/notifications`
- `settings/legal/[type]`
- `settings/about`
- (기존: categories는 단순 일반 라우트)

## QA 단계 시도·중단
사용자 "에뮬 띄워서 골든패스 QA 해줘" 요청.
1. ADB 미연결 확인
2. AVD 락 파일 (`Pixel_7_Pro_API_30.avd/multiinstance.lock`) 발견 → 제거
3. PowerShell `Start-Process -PassThru -WindowStyle Normal` 로 detach 부팅 → PID 13972 ALIVE 확인
4. `getprop sys.boot_completed` 폴링 도중 사용자 재부팅 결정 → 중단

**중단 시점 expo dev server 경고:**
- "System resource exhausted" (다른 무거운 프로세스 영향 추정)
- 의존성 mismatch 11종 감지: expo@55.0.7→55.0.23, expo-auth-session, expo-constants, expo-crypto, expo-device, expo-linking, expo-notifications, expo-router, expo-secure-store, expo-splash-screen, expo-status-bar, expo-web-browser, react-native@0.83.2→0.83.6
- → 재시작 후 `npx expo install --check` 권장

## 검증
- 모든 task 완료 시 `npx tsc --noEmit` exit 0 (PowerShell 일시적 "Thread failed to start" 발생 시 Bash로 재시도 가능)
- 실제 런타임/UI 검증은 미완료 (QA 단계에서 중단)

## 권장 commit 분할 전략 (참고)
1개 commit으로 묶어도 무방하지만, 검토 편의성 위해 분할 시:
- `feat(mobile): add EmptyState component and ShopBack-style home/category/search` (#1~#3 + EmptyState)
- `feat(mobile): redesign mall detail and product activate-cashback flow` (#4~#5)
- `feat(mobile): redesign region/cashback history with filters and detail sheet` (#7~#8, #6 skipped)
- `feat(mobile): add withdraw flow and improve bank-account screen` (#9)
- `feat(mobile): add tier system and refine mypage menu structure` (#10)
- `feat(mobile): redesign wishlist with mall/product segments` (#11)
- `feat(mobile): add help center, guide, notifications and settings routes` (#12~#15)
- `feat(api): add mall promo metadata columns and mall wishlist endpoints`
