---
name: 2026-06-01
description: 2026-06-01 세션 종합 진입점. 아이홈마켓 SSO 커밋·배포 + 네이티브 ID/PW 로그인 + 네이티브 카카오 백엔드(앱키 대기) + 프로덕션 키스토어 + 카테고리 동적화 + 번개장터 전용 포인트 지갑. 8 commits 전부 커밋·EC2/카페24 배포·검증 완료. "이어서" 들어오면 이 문서부터.
metadata:
  node_type: memory
  type: project
  originSessionId: 2026-06-01-session
---

**How to apply:** 다음 세션 "이어서/계속/어디까지" 들어오면 이 문서 먼저 읽고 아래 "다음 액션"대로 진행. 4지선다 묻지 말 것 ([[feedback-no-questions-just-do]]).

## 이번 세션 8 commits (79adb0a 이후, main clean, 전부 배포·검증됨)
```
f40fb0f feat(auth): ihomemarket account SSO via HMAC identity bridge (웹뷰 SSO + sso.php)
2360962 feat(mobile): 가입/추천 보너스 제거 + sticky 짧은콘텐츠 fix
0f3cd42 feat(auth): 네이티브 ID/PW 로그인 (웹뷰 안 거침, verify.php)
9e1475f feat(auth): 네이티브 카카오 소셜 백엔드 (모델 A, social_verify.php) — 앱SDK는 앱키 대기
ee404ad feat: 동적 상품 카테고리 (번개장터 칩 + 카테고리 탭)  ← 15e39dc 가 선행(몰만 동적화)
15e39dc fix(mobile): 카테고리 탭 상품 있는 것만 노출
85df1fe feat: 번개장터 전용 포인트 지갑 (적립·번개장터 한정·현금화 불가)
a2c7262 fix(mobile): 포인트 카드 MarketContent 로 이동(홈 폴더탭 노출)
```

## 완료된 기능 (상세는 각 메모리)
1. **아이홈마켓 로그인 3종** — 모두 배포·에뮬 E2E 검증. 상세 [[project-ihome-sso]]
   - 웹뷰 SSO(sso.php, 딥링크 복귀 1-hop 실증), **네이티브 ID/PW 폼**(verify.php), 카카오 백엔드(social_verify.php)
   - 함정 발견: 그누보드 비번해시=`sha256:` 커스텀(bcrypt 아님), 회원승인 게이트 `st_tp==1`(login_check.php:58)
2. **프로덕션 키스토어** — release 가 debug 서명이던 것 교체. 상세·지문 [[reference-android-release-keystore]], 비번 계정.md
3. **동적 카테고리** — 고정목록 제거, 실제 상품/몰 카테고리로 자동 생성·소멸. `GET /products/categories?platform=` 신규. 번개장터 칩 + 카테고리 탭(몰∪상품 합집합) 동적화. 에뮬 확인됨
4. **번개장터 전용 포인트** — `marketPointBalance`(인출불가·번개장터한정). MarketOrder 적립(2%)/사용(usePoint), ihomemarket 캐시백 라우팅. prod API E2E 검증(적립598/사용500→686/인출'잔액부족'). 마이그레이션 적용

## 찜 + 쿠폰함 (2026-06-02, commit b5a1cb2)
- **찜**: 번개장터(market_products)는 제휴 `wishlists`(products FK)로 찜 불가였음 → 신규 `MarketWishlist`(market_wishlists, prod 테이블 생성·uuid 컬럼+유니크idx) + `POST /market/products/:id/wishlist`·`GET /market/wishlist`. 모바일: `market/[id]` 하트, MarketContent 카드 하트(찜 id 집합 낙관적 토글), 관심목록 상품탭이 market 찜+제휴 찜 병합(WishCard, 소스별 배지/라우팅). E2E: 깔라만시 하트→관심목록 노출 확인.
- **쿠폰함**: `(tabs)/coupons.tsx` '준비 중' 스텁 → 내쿠폰 목록(getMyCoupons)+사용하기(useCoupon 확인 다이얼로그)+사용완료/만료 배지+빈상태. region.ts `useCoupon` 추가. mypage '내 쿠폰'→`/(tabs)/coupons`(없던 라우트 수정). `region/[id]` 쿠폰 다운로드 가짜Alert→실제 downloadCoupon. 백엔드(region 쿠폰)는 기존 완비. E2E: dwssotest 쿠폰 다운로드→쿠폰함 표시→사용→사용완료 확인.
- ⚠️ dwssotest 테스트 데이터(찜 1·사용쿠폰 1) 남겨둠 — 사용자 실기기 테스트 중. 정리 시 [[#수동 정리 필요]] 참고.

## 운영 상태 스냅샷 (세션 끝)
- **EC2 API**(54.238.64.159): 마지막 배포에 위 기능 전부 포함. /auth/ihome·ihome-login·ihome-social, /products/categories, market point 동작
- **RDS**: market point 컬럼 3개 적용됨(`apps/api/migrations/2026-06-01-market-point.sql`)
- **카페24 /www/doublewin/**: sso.php·verify.php·social_verify.php·sso_config.php 업로드됨
- **APK**: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` — **프로덕션 키 서명**(재설치 시 기존 debug 서명 APK 위 install -r 실패 → `adb uninstall com.doublewin.app` 후 install)
- **에뮬레이터**: 이번 세션 내내 ANR 빈발(빌드+Chrome+이미지 과부하). 재부팅 후엔 깨끗할 것

## 체크아웃 후속 — 주문 상태/취소/상세 (2026-06-04)
체크아웃 본체는 완료였고, 잔여 갭 4건 정리:
- **결제완료 상태 버그**: `createOrder`가 status 미설정 → 주문이 'pending'(결제대기)로 남는데 체크아웃은 "결제 완료" 안내 → 불일치. PG 없는 포인트/즉시정산이므로 생성 시 `status: PAID`로 확정. (market.service.ts createOrder)
- **취소 시 재고 미복원**: `updateOrderStatus`가 포인트만 원복하고 재고/판매수 복원 안 했음. `reverseOrder()` 헬퍼(포인트 환급+적립회수+`stockQuantity`+`soldCount` GREATEST 복원) 추출해 admin updateOrderStatus + 신규 user cancel 공용.
- **사용자 주문 취소**: `cancelOrder(id,userId)` 서비스 + `PATCH /market/orders/:id/cancel`(JwtAuthGuard). pending/paid만 취소 가능(배송 시작 후 거부). EC2 배포·라이브 검증(401=라우트 존재).
- **주문 상세 화면 신규** `app/market/order/[id].tsx`(/market/order/:id, [id].tsx와 세그먼트 충돌 없음): 상태 배지+배송지+결제내역+취소 CTA. orders.tsx 카드 onPress가 상품→**주문상세**로 변경. getMarketOrder/cancelMarketOrder API 추가, MarketOrderItem에 배송필드 추가.
- **썸네일 실이미지화**: checkout.tsx·orders.tsx 하드코딩 📦 → product.imageUrl(없으면 📦 폴백).
- **배포**: API EC2 배포 완료(스키마 변경 없음, 순수 코드). tsc(mobile clean / api는 기존 app.controller.spec.ts 에러만, 무관).
- **커밋 완료 (2026-06-05)**: 3db493e `feat(market): 주문 상세/취소 + 결제완료 상태 확정 + 썸네일 실이미지` / 별건 배너 3cffba2 `fix(home): 프로모 배너 원래 카드형(2:1) 복원 + 이미지 교체` / 51af56a gitignore(_verify_checkout·루트 배너원본 산출물 제외). main clean.
- **에뮬 E2E 검증 완료 (2026-06-05, Pixel_7_Pro_API_30, Jun4 13:51 release APK = 검증대상 코드 포함, prod API)**: dwssotest 네이티브 로그인→깔라만시 12,200원→포인트 100P 사용 주문. ✅ **status:PAID 수정 확인**(신규 주문 "결제 완료" vs 구주문 "결제 대기" 대조). ✅ 주문상세 화면 전체 렌더(상태배지/배송지 전필드/결제내역/취소CTA/실이미지). ✅ 취소: 확인다이얼로그→"취소 완료"→배지 "취소됨"→"242P 적립 회수됨". ✅ **포인트 역전 244→386→244**(사용분 환급+적립 회수). ✅ **재고/판매수 복원**: RDS 직접조회로 soldCount 2→1 복원 확인(reverseOrder 단일 UPDATE라 stockQuantity도 동반 복원 입증). 스크린샷 `_verify_checkout/cancel/`.
- **이중 헤더 버그 발견·수정·검증완료 (aa42345)**: 주문상세가 자체 헤더+expo-router 기본헤더("market/order/[id]") 둘 다 노출 → `_layout.tsx`에 Stack.Screen 등록+headerShown:false. tsc clean. **APK 재빌드(Jun5 13:49 release, packageRelease 1m34s)+에뮬 재검증: 헤더 "주문 상세" 단일로만 표시 확인**(스크린샷 22_detail_fixed.png). install -r로 세션 보존돼 dwssotest 06-02 pending주문 상세로 진입해 확인(주문 미생성). ihomemarket 회원은 검증용 재생성→재삭제.
- **prod 잔여물 없음**: 검증용으로 만든 ① 내 cancelled 주문(이미 역전됨, 행 삭제) ② 아이홈마켓 g5_member dwssotest(재생성→삭제) 모두 정리. **DoubleWin dwssotest 유저+06-02 pending주문(minwook)+찜1+쿠폰1+244P는 사용자 실기기 테스트용 의도적 데이터라 보존**(memory 32행 참조). 깔라만시 9998/1 = 세션 이전 상태.

## ✅ 홈 배너(PromoCarousel) 수정 — 완료·E2E검증·커밋 (2026-06-08, commit `99b1566`)
**해결됨.** 가설 적중: `aspectRatio`가 이 RN(0.83)/레이아웃에서 높이를 안 만들어 배너가 flat했음. **`bannerImage:{width:'100%',aspectRatio:1705/414}` → `BANNER_H=Math.round(SLIDE_W*414/1705)` 명시적 숫자로 교체**(`slide:{height:BANNER_H}` + `bannerImage:{width:SLIDE_W,height:BANNER_H}`). tsc통과→packageRelease(1m53s, Jun8 10:06 APK)→Pixel_3a 설치+force-stop+재실행. **E2E: 두 슬라이드 모두 그래픽 전체 표시**(슬라이드1 쇼핑카트 돼지+선물상자, 슬라이드2 곰+ +1%핑크카드), 잘림 없음, 텍스트 둘 다 왼쪽. 스크린샷 `_verify_checkout/banner_fixed_01.png`·`02.png`. index.tsx는 이미 두 슬라이드 align:'left'였음. main clean.

<details><summary>아래는 미해결 당시 기록(참고용)</summary>

**상태: 코드 수정·tsc통과·미커밋. 재빌드(Metro캐시 비우고 번들 19:36 재생성)+설치+force-stop+재실행 했는데도 배너 여전히 2:1 flat(그래픽 안 보임). → Metro캐시 문제 아님, 레이아웃 문제. 다음 세션에 디버깅 필요.**
- **❗다음 세션 최우선 가설**: `bannerImage:{width:'100%',aspectRatio:1705/414}`가 이 RN(0.83)/레이아웃에서 4:1 박스를 안 만드는 듯(슬라이드가 여전히 ~2:1로 큼). **해결책: aspectRatio 대신 명시적 숫자 height 사용** → `const BANNER_H = Math.round(SLIDE_W*414/1705)` 후 `slide:{height:BANNER_H}` + `bannerImage:{width:SLIDE_W, height:BANNER_H}` (또는 width:'100%',height:BANNER_H). 그래도 안 되면 Image를 normal-flow 단독 자식으로 두고 contentOverlay absolute 유지가 맞는지, slide의 justifyContent:'center'/overflow가 간섭하는지 점검. 빌드 후 반드시 `am force-stop`+재실행으로 확인.
- (직전 오진: Metro 캐시 의심해서 `rm -rf $TEMP/metro-cache node_modules/.cache`+번들삭제+재빌드 했으나 동일 → 캐시 아님 확정.)
- **요청**: ① 배너 1·2번 슬라이드의 태그/텍스트 위치 동일하게 ② 단색으로 칠해진 영역을 이미지로 교체.
- **원인 진단**: 배너 카드가 2:1인데 배너 이미지는 와이드(payback 1687×416=4.06:1, association 1705×414=4.12:1) → `resizeMode=cover`가 좌우를 잘라 **그래픽(돼지/곰·+1%)이 안 보이고 단색 영역만** 표시됨. (직전 내 커밋 `3cffba2`가 2:1 cover로 만든 게 원인)
- **수정(미커밋, 2파일)**:
  - `src/components/PromoCarousel.tsx`: Image를 `StyleSheet.absoluteFill`(cover crop)→`styles.bannerImage`(전체표시)로, slide `height:SLIDE_W/2`→`minHeight:SLIDE_W/4`, `bannerImage:{width:'100%',aspectRatio:1705/414}` 추가. = 잘림없이 고유비율 전체표시(그래픽 보임). [[feedback-rn-sticky-flex-break]] 아님, 25c1212 방식 복원.
  - `app/(tabs)/index.tsx` PROMO_SLIDES: payback 슬라이드 `align:'right'`→`'left'`. 두 이미지 모두 그래픽이 오른쪽이라 텍스트는 둘 다 왼쪽으로 통일(association은 이미 left).
- **⚠️ 빌드 함정 발견·대응**: 첫 재빌드(19:26 APK) 설치했는데 배너가 그대로 2:1 flat → **Metro 변환 캐시가 PromoCarousel.tsx 구버전 서빙**(같은 빌드의 index.tsx home그리드는 반영됨). → `rm -rf $TEMP/metro-cache node_modules/.cache` + 번들 산출물(`app/build/generated/assets/react/release/index.android.bundle`, `intermediates/assets/release/mergeReleaseAssets/index.android.bundle`) 삭제 후 재빌드(task bfu105gky, 재부팅으로 중단됨). **교훈: release APK가 JS변경 반영 안 하면 Metro캐시 의심→캐시+번들 삭제 후 재빌드.** 또 install -r 후엔 `am force-stop` 해야 새 JS 로드(monkey LAUNCHER만으론 기존 프로세스 유지).
- **"이어서" 하면**: ① `cd apps/mobile/android && ./gradlew :app:packageRelease`(Metro캐시 이미 비움) ② 에뮬(Pixel_3a 1080x2220, dwssotest/카카오 로그인 상태) `adb install -r` → `am force-stop` → 재실행 ③ 홈 배너 확인: **그래픽(돼지/곰) 보이고 1·2번 텍스트 둘 다 왼쪽** 이면 OK → `git add apps/mobile/app/(tabs)/index.tsx apps/mobile/src/components/PromoCarousel.tsx && commit`. 안 보이면 aspectRatio/레이아웃 추가 디버깅.

</details>

## ✅ 카카오 네이티브 소셜 — 완료·E2E검증·커밋 (2026-06-05, commit `3fdc712`)
**아이홈마켓 로그인 4종 전부 완성**(웹뷰SSO+네이티브ID/PW+카카오백엔드+**카카오 네이티브 앱**). 풀디테일 [[project-ihome-sso]].
- 네이티브 앱키 `7822ff27784b8d9481ac9540c79e6d73` 콘솔서 직접 발급(에뮬 Chrome, API36 Pixel_3a) + Android 플랫폼 등록(`com.doublewin.app`+키해시 `Cgpan8EwMeLYKxVSdEEDZ6LXAZI=`).
- 앱: kakao-login SDK + app.json plugin + kakao-native.ts + ihomeSocialLogin + login.tsx 카카오 버튼. android/ manifest·strings 수동적용(prebuild 시 plugin 재생성, gitignore). prebuild는 keystore 배선 유실위험이라 안 돌리고 수동적용함(kotlinVersion 다운그레이드도 회피).
- **E2E**(Pixel_3a, prod release APK, prod API): 카카오 버튼→아이홈마켓 동의화면→Confirm→홈 "안녕하세요, 카카오5471님" 로그인 확인. (카카오5471=신규 자동생성 ihomemarket 회원, 회원통합 동작)
- ⚠️ 테스트 잔여물: 카카오 로그인으로 **mvcorp.top@gmail.com 의 신규 ihomemarket 회원(카카오5471)+DoubleWin user 자동생성**됨. 오너 본인 계정이라 정리 선택사항. 정리 시 social_profiles 매핑+g5_member+DoubleWin users 삭제.
- 함정기록: 에뮬 콘솔 자동화는 Pixel_7(API30)에선 비번필드 포커스 실패했으나 **Pixel_3a(API36)에선 성공**. 신규 카카오 콘솔은 "플랫폼" 메뉴 없음→플랫폼키>네이티브앱키 카드 탭>수정페이지 Android 섹션.

## 다음 액션 (우선순위)
1. ~~카카오 네이티브 소셜~~ ✅ 완료(위). 남으면: 네이버·구글 네이티브화(현재 웹뷰), 카카오 앱ID로 DW_KAKAO_APP_ID 보안설정(선택).
2. ~~**번개장터 체크아웃 UI**~~ ✅ **구현+E2E검증 완료 (2026-06-02, commit 06313ea)** — `market/checkout.tsx`(수량+배송폼+포인트 사용/적립 요약→createOrder, 성공 시 refreshProfile) + `market/orders.tsx`(주문내역) + `[id]` 구매버튼 배선 + mypage 퀵메뉴 진입점. tsc 통과, 모바일 전용.
   - **APK E2E (2026-06-02 에뮬, 프로덕션키 release APK, prod API)**: dwssotest 로그인→`market/[id]`(올리브유 15,900)→체크아웃→결제 #1: **318P 적립**(floor 15900×2%), 포인트카드 0→318 **실시간 갱신(refreshProfile)** 확인. 결제 #2: **전액사용→payable 15,582**, 사용 318+적립 311→**잔액 311**, 잔액<입력 시 "최대 311P" **라이브 클램핑** 확인. 주문내역 화면 정상(결제대기/318P적립). DB로 적립·차감·재고차감 교차검증함. 스크린샷 `_verify_checkout/`.
   - ~~🔴 체크아웃이 번개장터 UI에 미배선~~ ✅ **해결 — 직접판매로 전환 완료 (2026-06-02, commit 26c22d9)**: 사용자가 "직접판매로 전환" 선택. 번개장터 탭/홈폴더탭의 `MarketContent`가 제휴 `products`→`/product/[id]`(외부몰 캐시백)로 가던 것을 **직접판매 market 시스템**으로 통일. 신규 백엔드 `GET /market/categories`·`GET /market/products`(EC2 배포·라이브). MarketContent: getProducts→getMarketProducts, getProductCategories→getMarketCategories, /product/[id]→/market/[id](3곳), 카드 '캐시백%'→'N P 적립'(2%), 이미지없을때 📦. **APK 재빌드 에뮬 E2E**: 번개장터 탭→카드→`/market/[id]`(더블윈 위탁판매·보라 구매하기)→체크아웃 도달, 카테고리칩 식품/생활용품/건강식품 동적, 적립 318P/798P/598P 확인. tsc(mobile+api) 통과. 테스트 데이터 자체 정리 완료.
     - ~~잔여 follow-up: 번개장터 헤더 검색~~ ✅ **완료 (2026-06-02, commit 1353851)**: 번개장터 헤더 검색을 직접판매 market 상품 검색으로 교체. 백엔드 `GET /market/products`에 `keyword`(title ILIKE)+페이지네이션 추가(EC2 배포·라이브, 올리브→올리브유/한우→한우등심). `app/market/search.tsx` 신규(검색바+카테고리칩+2열 결과그리드 📦/할인/N P 적립+무한스크롤→`/market/[id]`), `(tabs)/market.tsx` 헤더 검색→`/market/search`. APK 에뮬 E2E: 헤더검색→카테고리칩(식품8/생활용품1/건강식품1)→식품 결과그리드→상품상세 도달 확인. tsc 통과.
   - 🔴 **중대 수정 — 번개장터가 더미 상품 노출하던 것 → 실제 아이홈마켓 상품으로 (2026-06-02, commit 941e42e)**: 위 "직접판매 전환"이 `market_products`를 노출하는데, 그게 **seed.ts 더미 10개**(올리브유·한우…)였음! 실제 아이홈마켓 455상품은 ihome-sync가 **`products`(제휴) 테이블에만** 넣고 있었음(`market_products`는 더미뿐). 사용자 지적("아이홈마켓 상품이 실제 상품") → "직접판매화" 선택. 수정: **MarketProduct에 externalId 추가, ihome-sync가 market_products에도 미러링**(stockQuantity=it_stock_qty, 0이면 9999), seed 더미 가드(SEED_DUMMY_MARKET). 운영: externalId ALTER + products(ihomemarket) 455→market_products 백필 + 더미 market_products 10·더미 market_orders 27건(시드 테스트, 실제유저 없음) 삭제. 배포 후 total 455. **에뮬 검증: 번개장터가 실제 상품(깔라만시/흑삼/굴비)·실제 카테고리(기획전309/건강기능식품55/식품47/과일20/주방용품19/특산품5)·실제 이미지(리스트), 상세→구매하기→체크아웃 정상.** 모바일 코드 변경 없음(이미 market_products 읽음, APK 재빌드 불필요).
     - ~~상세 이미지 📦 하드코딩~~ ✅ **해결 (2026-06-02, commit 3be6916)**: `market/[id].tsx`가 product.imageUrl 실제 이미지 렌더(없으면 📦 폴백). 동시에 `market/[id]·checkout·search` 헤더에 `useSafeAreaInsets().top` 반영 → **뒤로가기 버튼이 상태바/노치에 가리던 문제 해결**(사용자 지적: "뒤로가기 버튼이 없어"=상태바에 가려져 있었음). APK 재빌드 에뮬 검증: 상세 실제 이미지(깔라만시 주스) + 뒤로가기 상태바 아래 표시·동작 확인.
     - ⚠️ 남은: 데이터 중복(아이홈마켓 상품이 products 제휴 + market_products 직접판매 양쪽) — 의도된 미러(다른 surface가 products 사용), 추후 제휴서 ihomemarket 제외할지 미정. / ~~`(tabs)/market` 뒤로가기 없음~~ ✅ **해결 (2026-06-02, commit d2892fb→6672a17)**: 처음엔 `(tabs)/market`에 canGoBack 뒤로가기 추가했으나 탭 네비라 홈으로 복귀 → **루트 스택 라우트 `app/market/index.tsx`(/market)로 이동**(탭 삭제, push). 에뮬 검증: 관심목록 "상품 둘러보기"→/market→뒤로가기 **정확히 관심목록 복귀**(하단탭도 관심목록 활성). 진입 참조 전부 `/(tabs)/market`→`/market`.
   - ⚠️ 테스트 데이터 정리 완료: 아이홈마켓 g5_member dwssotest 삭제, prod RDS dwssotest 유저+주문2+click_log 삭제·올리브유 재고/판매수 원복(EC2 SSH+pg). **이번 세션 prod 잔여물 없음**(직전 세션 49행의 ssotest/dwssotest 수동삭제 항목과 별개로, 이번 건은 자체 정리됨).
3. **GitHub push** — 미설정(원격 없음). 사용자가 원하면 gh 인증 후. 단 배포는 GitHub 안 거치고 EC2 직접([[reference-aws-deploy-workflow]]).

## 수동 정리 필요 (분류기가 prod DB DELETE 차단)
- DoubleWin RDS `users`: `delete from users where email='mptest@example.com' or "providerId" in ('ssotest','dwssotest');`
- 그에 딸린 `market_orders` 2건(테스트 상품 재고 2 차감됨) — 필요시 정리
- 아이홈마켓 g5_member 의 dwssotest 는 이미 삭제 완료

## 관련 메모리
- [[project-ihome-sso]] — 로그인 3종 + 카카오 진행상황 풀디테일
- [[reference-android-release-keystore]] — 키스토어 위치·지문
- [[reference-aws-deploy-workflow]] — EC2 tarball+docker 배포(이번 세션 다수 사용)
- [[reference-cafe24-workflow]] — FTP/일회용 PHP 진단(verify/social_verify/회원생성 도구는 `.work-ihomemarket/`)
- [[reference-emulator-workflow]] — Pixel_7_Pro_API_30, swiftshader, 1440x3120
- [[project-session-2026-05-29]] — 직전 세션
- [[feedback-no-questions-just-do]] · [[feedback-typeorm-nullable-union]]
