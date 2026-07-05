---
name: 샵백 스타일 리디자인 #1~#15 완료
description: DoubleWin(더블윈) 모바일 앱 15개 화면을 샵백 UX 패턴으로 재구성한 작업 — 모두 완료, 에뮬 QA 직전 중단
type: project
originSessionId: b07bfdb0-c89b-4665-acae-aef0ba33e817
---
DoubleWin Korean 캐시백 앱(`apps/mobile`)의 15개 화면을 샵백(ShopBack) UX 패턴에 맞춰 재구성하는 작업을 2026-05-05 ~ 2026-05-06에 완료했습니다.

**Why:** 사용자가 샵백 앱을 직접 실행해 로그인해두고 화면별로 캡처·분석·DoubleWin에 적용하는 워크플로우를 합의했음. 사용자 요청: "차례대로 모든페이지 진행해 나눠서" "너가 직접 스샷찍어서 진행해" "다시진행해 제대로"

**How to apply:** 재시작 후 작업 이어가려면 아래 "재시작 시 사용자 멘트" 참고. 코드 변경은 모두 commit 안 된 상태로 working tree에 있음 — 사용자가 commit 시점을 결정.

## 완료된 15개 task

1. 홈 화면 — `app/(tabs)/index.tsx` (PROMO_BADGE/카운트다운/welcome 가이드 배너 + 카테고리 라우트)
2. 카테고리 탭 — 신규 `app/categories.tsx` (9개 카테고리, 카드사 혜택, 3-tile 그리드)
3. 검색 화면 — `app/(tabs)/search.tsx` (쇼핑몰 매칭 칩, 추천 쇼핑몰 horizontal)
4. 쇼핑몰 상세 — `app/mall/[platform].tsx` (찜 토글, 카테고리/프로모 배지, 적립 타임라인 3단계)
5. 상품 상세 — `app/product/[id].tsx` (`/activate-cashback` 라우팅)
6. 번개장터 — `app/(tabs)/market.tsx` (현 디자인 유지, 샵백 Earn More 매핑 부적절 결론)
7. 우리지역 — `app/(tabs)/region.tsx` (EmptyState/위치 선택/정렬 시트/쿠폰 hero)
8. 캐시백 내역 — `app/(tabs)/cashback.tsx` (기간 필터 칩 4종, 거래 상세 바텀시트)
9. 출금·환급 — 신규 `app/cashback/withdraw.tsx` (잔액 카드/금액 입력/빠른 칩/계좌 카드/안내)
10. 마이페이지 — `app/(tabs)/mypage.tsx` (티어 SEED/BRONZE/SILVER/GOLD, 친구 초대, 환급 직결)
11. 관심목록 — `app/mypage/wishlist.tsx` (상품/쇼핑몰 세그먼트, MallRow, EmptyState)
12. 도움말 — 신규 `app/help/index.tsx` + `app/help/missing-cashback.tsx`
13. 이용가이드 — 신규 `app/guide.tsx` (4단계 타임라인 + 환급 3단계 + DO/DONT)
14. 알림 화면 — 신규 `app/notifications.tsx` (그룹·필터·읽음 처리, 7개 mock)
15. 설정/회원정보 — 신규 `app/settings/notifications.tsx` + `app/settings/legal/[type].tsx` + `app/settings/about.tsx`

## 재사용 컴포넌트 신설
- `apps/mobile/src/components/EmptyState.tsx` — 샵백 에러페이지 패턴(아이콘 원형 배경 + 타이틀 + 서브 + 검정 pill 액션) #7~#14에서 광범위 사용

## API 시그니처 추가
- `apps/mobile/src/api/products.ts` — `toggleMallWishlist`, `getMallWishlist`
- `apps/mobile/src/api/home.ts` — `Mall` 타입에 promoBadge/promoEndsAt/category 등 추가

## 백엔드 변경
- `apps/api/src/blocks/entities/mall.entity.ts` — promoBadge/promoEndsAt/previousCashbackRate/category 컬럼 추가 (TypeORM synchronize: true 환경, 마이그레이션 불필요)

## QA 직전 중단된 위치
사용자 요청: "에뮬 띄워서 골든패스 QA 해줘"

진행 시도:
- `Pixel_7_Pro_API_30` AVD에 `multiinstance.lock` 스테일 락 발견 → 제거 완료
- `Start-Process -PassThru`로 emulator.exe 시작 시 PID 13972로 ALIVE 확인됨
- 부팅 대기(`getprop sys.boot_completed`) 도중 사용자가 재부팅 결정으로 중단
- expo dev server 첫 시도 시 "System resource exhausted" 경고 + 의존성 mismatch 11종 감지 (expo@55.0.7 → 55.0.23 등). expo install --check 권장

## 알려진 이슈
- expo 패키지 버전 mismatch 다수 (`expo install --check` 또는 `npm install`로 정렬 필요)
- 백엔드 mock API 미연결 — wishlist/cashback 데이터 등은 빈 배열 fallback 처리됨
- `Alert.prompt`는 iOS 전용이라 #9에서 안드 우회로 `/cashback/withdraw` 라우트 신설로 해결됨
- typecheck `npx tsc --noEmit` exit 0 모든 task에서 통과
