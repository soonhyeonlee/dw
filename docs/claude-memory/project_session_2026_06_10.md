---
name: 2026-06-10
description: "2026-06-10 세션 종합 + \"이어서\" 진입점. T3 Quiet Mono 디자인 전면적용 + 카테고리 개편(인라인 그룹/경유사·회사 네비/배너/맨위로) + brand 백엔드 배포. 재부팅 후 이어서 들어오면 이 문서 먼저."
metadata: 
  node_type: memory
  type: project
  originSessionId: a796cdb0-4b56-4349-8819-4c3dafbfa6db
---

**"이어서/계속" 들어오면 이 문서 맨 위 "🔵 다음 액션"부터.** 4지선다 묻지 말 것 ([[feedback-no-questions-just-do]]).

## ⏸️ 재부팅 후 재개 (2026-06-12) ★★최우선 진입점★★
**"이어서 작업하자" 하면 여기부터.** 현재 작업 = **경유 쇼핑몰(쿠팡 등) 실상품 수집 + 실제 캐시백(포인트) 추적 연동.**

### 🟢 백엔드 추적/적립 스캐폴딩 완료 (2026-06-12, 키 없이 선구현) — 미커밋·미배포
키가 아직 없어서(`.env` COUPANG_* len=0) 문서 계획대로 **백엔드 전환추적·적립 파이프라인을 먼저 구현**함. **`nest build` 통과**. 신규 `apps/api/src/affiliate/` 모듈:
- `coupang-partners.service.ts` — coupang.py의 **TS 포팅**(HMAC CEA서명+`generateDeeplink(url,subId)`+`fetchOrderReports`+`fetchCancelReports`). `isEnabled()`=COUPANG_ACCESS/SECRET 둘다 있을때만 true, **없으면 무동작 폴백**(프로덕션 안전).
- `affiliate.service.ts` `ingestCoupangConversions(start?,end?)` — 주문리포트 `subId`→`ClickLog.trackingId`→user 매핑→**`CashbackService.recordConversion`(멱등, externalOrderId=`coupang:{orderId}` unique로 중복적립 방지)**→confirm로 잔액적립. 취소리포트→`cancelByExternalOrder`로 차감. (적립액=주문금액×상품cashbackRate, 유저약속분.)
- `affiliate.controller.ts` — `POST /affiliate/coupang/ingest?start=&end=`(AdminGuard, 생략시 최근7일) + `GET /affiliate/coupang/status`. EC2 cron이 ingest 때리면 됨.
- **수정**: `products.service.logClick` = 클릭마다 `trackingId`(20hex) 생성, 쿠팡+키있으면 `generateDeeplink(productUrl, trackingId)`로 **유저별 추적딥링크** 반환(앱이 그걸 엶). `ClickLog`에 `trackingId`컬럼, `CashbackTransaction`에 `externalOrderId`(unique)컬럼 추가. `CashbackService.recordConversion`/`cancelByExternalOrder` 신규. app.module/products.module 배선.
- **⚠️미커밋·미배포**(키 없으면 배포해도 기능 0이라 보류). **배포 시 RDS 추가 마이그레이션 필수**(synchronize off):
  ```sql
  ALTER TABLE click_logs ADD COLUMN IF NOT EXISTS "trackingId" varchar;
  CREATE INDEX IF NOT EXISTS idx_click_logs_tracking ON click_logs ("trackingId");
  ALTER TABLE cashback_transactions ADD COLUMN IF NOT EXISTS "externalOrderId" varchar;
  CREATE UNIQUE INDEX IF NOT EXISTS uq_cashback_external_order ON cashback_transactions ("externalOrderId");
  ```
  (위 ALTER 먼저 안 하면 TypeORM이 없는 컬럼 SELECT해서 에러 → **배포 전 반드시 실행**.)

### 🔴 남은 단 하나의 블로커 = 쿠팡파트너스 API 키 (사용자 몫)
- 크롤러(`coupang.py`)+백엔드추적(위 affiliate 모듈) **둘 다 완성**. `.env` `COUPANG_ACCESS_KEY/SECRET_KEY/PARTNER_ID`만 비어있음. `계정.md`엔 로그인ID/PW만(쿠팡파트너스=mvcorp.top@gmail.com) — **API키 없음**. 쿠팡은 CLI/키발급API 없어 **웹콘솔(partners.coupang.com→API발급관리)에서만 ACCESS/SECRET 복사 가능** → 보안상 제가 사장님 계정 로그인 불가. **사용자가 받아와야 함.**
- **키 받으면 턴키 순서**: ①`.env`(루트+apps/crawler+apps/api) COUPANG_* 3개 채움 ②위 RDS ALTER 실행 ③affiliate코드 EC2 tarball 배포+API 재빌드([[reference-aws-deploy-workflow]]) ④크롤러컨테이너 키주입+`CRAWLER_MODE` coupang 상품수집→products platform='coupang' 채움(rate 설정) ⑤`POST /affiliate/coupang/ingest`를 EC2 cron(시간당)으로 → 전환→유저캐시백 자동적립 ⑥에뮬 E2E(구매→딥링크→리포트수집→잔액증가).
- 그다음 **링크프라이스**(11번가·G마켓·SSG·롯데ON): affiliate ID+활성머천트목록 필요. 쿠팡 끝나고. (affiliate 모듈에 LinkPrice 어댑터 추가하는 식으로 확장.)
- 참고: 기존 active 몰 5개는 affiliateBaseUrl 비어 클릭시 몰홈만 열림(추적X). 위 파이프라인이 이걸 실추적으로 바꾸는 작업.

## 📦 현재 빌드 산출물(최신, 06-12)
- **AAB**(스토어): `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab` (70.6MB, 06-12 13:50, release서명)
- **APK**(테스트): `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` (99MB)
- 둘다 8차(우리지역+지도+캐시백10%+아이콘+스플래시+몰정리) 전부 반영. 커밋 `3f4e093`(android/ 네이티브리소스는 gitignore라 로컬 android/에만 존재 ⚠️재부팅후에도 보존됨).

## 🟢 8차-D: 커밋 + 스토어 AAB 완료 (2026-06-12)
- **커밋 `3f4e093`**: 세션 전체 변경(우리지역+지도+캐시백+아이콘/스플래시+몰정리, 14 files). ⚠️android/ 네이티브리소스(아이콘webp·스플래시·매니페스트Maps키·colors.xml)는 gitignore라 미포함 — 빌드는 로컬 android/에 의존.
- **스토어 AAB 재빌드 완료**: `app-release.aab` 70.6MB(06-12 13:50, release서명), 모든 최신변경 반영. 경로 `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`. 최신 APK도 `.../apk/release/app-release.apk`(99MB).
- **스플래시 최종**=네이티브 전용(JS오버레이는 zoom글리치로 제거). 블루#025DF3 + splashscreen_logo(splash W+ 크롭, "W+ 더블원플러스" 포함). 아이콘=W+마크만 추출(전경50%) 깔끔. 둘다 에뮬 검증✅.
- **잔여(미요청)**: ihome-sync.service.ts 캐시백 기본10% 변경은 **API 재배포 필요**(신규상품용. 현재456개는 DB로 이미 10%라 급하지않음). 스토어제출=사용자몫(AAB업로드+개인정보URL+데이터안전성폼+스크린샷).

## 🟢 8차-C: 에뮬검증 완료 + 스플래시 (2026-06-11)
- **에뮬 검증 통과**: 우리지역 학원목록(총100개, 흑과백조소학원★5.0 등)✅ / 학원상세 구글지도(강남 실거리 렌더)✅ / 캐시백 10%(깔라만시12200→1220원)✅ / 새 앱아이콘(파랑 W+, 원형마스크)✅ / 쿠폰북 준비중✅. 스샷 `_verify_checkout/region_list·acad_detail·cashback10·launcher·coupon_ready*.png`.
- **추가수정**: ①내주변 위치오류=영어raw→한국어("현재 위치를 확인할 수 없어요...")+`getLastKnownPositionAsync` 폴백(RegionContent ensureLocation). ②상품상세 경유사라벨 `ihomemarket`→`아이홈마켓`(product/[id].tsx PLATFORM_LABEL). ⚠️에뮬 GPS는 `adb emu geo fix`해도 Googleplex 고정이라 내주변 happy-path 에뮬검증 못함(실기기선 정상, 로직·백엔드 검증됨).
- **스플래시 추가**(사용자 `SplashScreen.png` 853×1844 풀스크린 디자인): 안드12+ 네이티브는 중앙로고+배경만 가능 → **JS 풀스크린 오버레이**로 구현. `_layout.tsx`에 `SplashOverlay`(앱시작 1.6s 표시→0.45s 페이드아웃, `assets/splash.png` cover). 네이티브 `colors.xml` splashscreen_background `#FF6B35`→`#025DF3`(주황플래시 제거), app.json splash image/cover/bg갱신.
- **진행**: 최종 APK 빌드중(스플래시+위치문구+라벨). 검증남음: 스플래시 표시.

## 🟢 8차-B: Places 4271건 완료 + 캐시백/아이콘/가이드 (2026-06-11)
- **Places 크롤 완주**: **4,271개 고유 학원**(학원1500·어린이집1415·유치원1356, 전국35지역). 수집6265→UPSERT dedup. 평점없음 1448건은 rating=0 backfill. AcademyCard는 rating>0일때만 별점, 아니면 "신규" 뱃지.
- **🐛 rating NOT NULL 버그**: academies.rating NOT NULL이라 평점없는 어린이집/유치원 저장실패 → `ALTER COLUMN rating DROP NOT NULL`로 해결(2차 풀크롤 재실행). + googlePlaceId unique제약도 추가했어야 함(위 8차).
- **캐시백 0원 원인+수정**: 아이홈마켓 456상품 전부 cashbackRate=0이었음(`ihome-sync.service.ts:225` `?? 0`). 예전 캐시백은 삭제된 더미(쿠팡/네이버)것. **사용자 결정=일괄 10%**. RDS `UPDATE products SET cashbackRate=10, cashbackAmount=ROUND(price*0.10) WHERE platform='ihomemarket'`(456건). + sync코드 `?? 10`+amount계산으로 수정(신규상품용, **API 재배포 필요-아직 안함**).
- **이용가이드** `guide.tsx:71` "최대 30%"→"최대 10%".
- **앱 아이콘 교체**: `더블윈플러스아이콘.png`(W+ 더블원플러스, 파랑#1967FD) → android res webp 5밀도(legacy+adaptive fg/bg) PIL생성 + assets/app-icon.png복사 + app.json icon/adaptiveIcon갱신(bg #1967FD). 
- **진행중**: APK재빌드(아이콘+가이드+우리지역활성+평점). **검증남음**: 에뮬에서 학원목록/내주변(geo fix)/지도/캐시백10%/쿠폰북준비중/새아이콘.

## 🟢 우리지역 실데이터 수집(Google Places) + 활성화 (2026-06-11 8차)
- **목표**: 사용자 "학원·어린이집·유치원 등 지도 데이터 다 받아와 보여줘". → Google Places 크롤러 가동해 academies 채움.
- **Places 서버키 발급**: `AIza‹REDACTED›` (실값은 EC2 `.env`/GCP 콘솔 참조 — 레포엔 비커밋. maps-use 프로젝트, **IP제한=54.238.64.159**, Places API(레거시 `places-backend`) 활성). ⚠️Android Maps키(...tUmM)와 별개 — 서버호출용.
- **크롤러**: `google_places.py` SEARCH_TARGETS에 **유치원 추가**(학원/어린이집/유치원). 35지역×3. EC2 `doublewin-crawler` 컨테이너에 파일 docker cp 후 `docker exec -e CRAWLER_MODE=places_once -e GOOGLE_PLACES_API_KEY=... python main.py`로 실행. (코드 베이크형이라 재실행시 docker cp 필요. scp→docker cp 사용. base64파이프는 CRLF로 깨짐.)
- **🐛 핵심버그 수정**: `academies.googlePlaceId`에 unique 제약 없어서(synchronize off) `ON CONFLICT` UPSERT 전부 실패→0저장이었음. `ALTER TABLE academies ADD CONSTRAINT uq_academies_google_place_id UNIQUE ("googlePlaceId")` 추가 후 정상 저장 시작(33건→증가중).
- **프론트 활성화**: `RegionContent.tsx` REGION_READY 제거. **학원정보 탭=활성**(데이터 있음), **쿠폰북 탭=`COUPON_READY=false`로 준비중 유지**(쿠폰 데이터 없음, 사용자 요청). CATEGORIES=전체/학원/어린이집/유치원(크롤 카테고리에 맞춤). 내주변 위치오류는 데이터 생기며 해소(에뮬 검증시 `adb emu geo fix`로 위치 줘야).
- **진행중**: 크롤 백그라운드 완주중(~10분, 수백건 예상), APK 재빌드중. **검증 남음**: 에뮬에서 학원정보 목록/내주변/지도, 쿠폰북 준비중.

## 🟢 지도 검증완료 + 몰 정리 (2026-06-11 7차)
- **지도 렌더 검증완료**: react-native-maps APK 빌드(3m40s)→에뮬에서 임시학원 상세 열어 **구글지도 타일+핀 정상 렌더 확인(키 작동)**. 임시학원(706c8869) **삭제완료**(academies 다시 0). 스샷 `_verify_checkout/map_render.png`.
- **몰(경유사) 정리**: `계정.md` 제휴=쿠팡파트너스+링크프라이스뿐. **티몬·위메프(2024 큐텐사태 폐업)·네이버쇼핑(제휴없음) → isActive=false 비활성**. 활성 몰 5개만: 쿠팡3%·11번가2.5%·G마켓2%·SSG1.5%·롯데ON2%. 에뮬 홈에서 확인(네이버/티몬/위메프 사라짐). API는 `blocks.service.getActiveMalls()`가 isActive필터. ⚠️되돌리려면 해당 platform isActive=true.
- **⚠️미흡(미해결)**: 모든 몰 `affiliateBaseUrl` 비어있음 → 클릭시 제휴추적 안되고 몰 홈페이지만 열림(실제 캐시백 적립 추적 X). 진짜 캐시백 작동하려면 LinkPrice/쿠팡파트너스 제휴 딥링크(추적파라미터) 각 몰에 설정 필요. 추가 몰(옥션/GS샵/인터파크/CJ온스타일 등 LinkPrice 커버)도 활성화여부+링크포맷 필요. **사용자 제휴ID/콘솔 필요 → 대기.**
- **AAB는 사용자 지시로 보류**("진행해달라고 하면" 빌드).

## 🟡 구글 지도 임베드 — 진행완료(검증됨), 코드 미커밋 (2026-06-11 6차)
- **Maps API 키 발급완료**: `AIza‹REDACTED›` (실값은 GCP 콘솔/AndroidManifest 참조 — 레포엔 비커밋. 프로젝트 **`project-a258d217-e3e4-4e3a-bc8`**=maps-use, 번호 918369339229, **결제활성**됨. ⚠️구글로그인 프로젝트 `spry-tree-410104`/726584045345는 결제 미활성이라 Maps 못씀 → maps-use에 키 생성). Android제한(패키지 com.doublewin.app+릴리스SHA-1), Maps SDK for Android 활성. gcloud로 생성(keyId `c6313ec9-4744-41ea-b233-15749d7e1072`).
- **앱 배선**: `react-native-maps@1.27.2` 설치(expo install), `region/[id].tsx` "위치"섹션에 MapView(PROVIDER_GOOGLE)+Marker 임베드(lat/lng 있을때, 없으면 주소 폴백)+"지도에서 보기" 버튼. 키= AndroidManifest `com.google.android.geo.API_KEY` + app.json `android.config.googleMaps.apiKey` 둘다. (android폴더 gitignore라 매니페스트분은 미커밋, app.json/region tsx는 커밋대상)
- **검증용 임시학원 삽입**: id `706c8869-918d-4deb-b737-c54fa1ee0487`([테스트]강남 코딩학원, 37.5009/127.0396). **검증 후 반드시 삭제**: `DELETE FROM academies WHERE id='706c8869-918d-4deb-b737-c54fa1ee0487'`.
- **남은 단계**: APK빌드→에뮬에서 그 학원 상세 열어 지도 타일 렌더 확인→임시학원 삭제→AAB 재빌드(지도+로그인문구+이전 커밋들 포함)→커밋. 구글로그인 OAuth Android클라 등록·네이버는 별건(미진행).

## ⏸️ 일시정지 — 재개어구 "지도 이어서" (2026-06-11 6차) ★★최우선★★
**사용자가 "지도 이어서"(또는 "구글지도 이어서") 라고 하면 여기부터.** 구글 지도를 학원상세 "위치"섹션에 임베드 + AAB 올리는 작업 중 **gcloud 인증 대기로 일시정지**.
- **상태**: gcloud 설치완료(winget). PowerShell툴에선 `$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd`, bash에선 풀경로 `"/c/Users/sangw/AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"`. **✅ gcloud 인증 완료**(`mvcorp.top@gmail.com` 활성, project는 unset). ⚠️PowerShell에서 gcloud 호출 시 stderr가 NativeCommandError로 감싸여 에러처럼 보이나 정상(무시).
- **재개 시 순서**(전부 PowerShell 툴, gcloud.cmd 풀경로): ①(인증됨) ②`gcloud config set project 726584045345`(기존 GCP 프로젝트번호=웹클라ID `726584045345-7qgh...`에서 추출) ③`gcloud services enable maps-android-backend.googleapis.com` ④API 키 생성(`gcloud services api-keys create` — Android 제한: 패키지 `com.doublewin.app`+SHA-1 `0A:0A:5A:9F:C1:30:31:E2:D8:2B:15:52:74:41:03:67:A2:D7:01:92`) ⑤`react-native-maps` 설치+app.json config plugin ⑥`region/[id].tsx` "위치"섹션 mapPlaceholder(line~421-425)에 MapView 임베드(핀=academy.latitude/longitude) ⑦android 매니페스트에 `com.google.android.geo.API_KEY` 메타 추가 ⑧`bundleRelease`로 AAB 재빌드. ⚠️학원 데이터 0개라 지도 화면은 좌표 데이터 없으면 에뮬 검증 불가(임시 학원 1개 insert해서 검증 후 삭제 고려).
- **소셜 로그인 점검 결과(에뮬 테스트)**: 카카오✅ / 구글⚠️(플로우 정상이나 에뮬에 구글계정 없어 완료확인불가, GCP에 Android OAuth클라 등록 필요-패키지+SHA-1) / **네이버❌깨짐**(`nid.naver.com` "Unable to log in to 아이홈마켓" — 네이버 개발자센터 아이홈마켓앱에 Android 등록/설정 필요). 구글로그인 OAuth등록은 위 ②프로젝트에서 같이 가능. 네이버는 별도 네이버콘솔 로그인 필요.
- **✅ 더미 경유사 상품 제거(2026-06-11)**: `products`에 더미 시드 15개(coupang5/11st5/naver5, extId `cp-001`등, 나이키·다이슨·에어팟 등 4/21생성)가 있었음 → RDS에서 삭제(찜74·클릭로그202 FK정리 후 products 15삭제, 트랜잭션). 남은 products=**아이홈마켓 456개 실제만**. market_products 456개도 전부 실제(영카트 it_id, 더미없음). 에뮬 검증: 카테고리 경유사 nav가 "아이홈마켓 대동고려삼 3개"처럼 아이홈마켓만, 쿠팡/네이버 더미그룹 사라짐. ⚠️`wishlists.productId`·`click_logs.productId`는 uuid(캐스트X), 단 `wishlists.userId`는 varchar(uuid비교시 ::text).
- **그외 미반영(미커밋)**: ①구글지도 코드변경分 ②**로그인 부제 문구 수정**(`login.tsx:110` "아이홈마켓 계정 하나로 시작해요"→"더블원플러스 하나로 간편하게 시작해요" — 더블원↔아이홈마켓 *계정 관계성* 노출만 제거. ⚠️경유사 라벨 `categories.tsx` "아이홈마켓"은 정확정보라 **그대로 유지**, 바꾸지 말 것. market 상세 판매자="더블원플러스 위탁판매" 이미 자사). 다음 AAB 빌드에 같이 포함. AAB(`app-release.aab` 16:04)는 이 변경들 전 버전.

## 🟢 우리지역 더미 정리 + 스토어 AAB (2026-06-11 5차)
**스토어 출시 임박.** **AAB 빌드 완료** `app-release.aab`(67.7MB, release서명) — Play는 신규앱에 APK아닌 **AAB** 필요(그동안 APK만 만들어서 빠져있던 조각). 빌드: `cd apps/mobile/android && ./gradlew.bat bundleRelease`.
**우리지역(내 근처)**: 화면·백엔드·크롤러 코드는 **완성**인데 실데이터 0이었음 — RDS 학원이 가짜더미 5개(좌표 없음)뿐, Google Places 크롤러는 `GOOGLE_PLACES_API_KEY`(유료GCP) 없어 비활성. **사용자 결정=가짜 더미 제거 후 출시**(데이터는 출시 후 채움). 조치: RDS에서 우리지역 더미 전부 삭제(academy_reviews27/user_coupons37/coupons4/academies5, FK순서 트랜잭션) → 앱에서 "총 0개" 정직한 빈상태 확인. `RegionContent.tsx` 빈상태 문구를 내부용("관리자 페이지에서...")→소비자용("학원 정보를 준비 중이에요")으로 교체. **데이터 채우는 법(추후)**: ①Google Places 키 발급→`apps/crawler/crawlers/google_places.py` 가동 ②data.go.kr 공공데이터(무료) ③admin 수동등록. (전부 `seed-dummy.ts`로 재생성 가능했던 더미였음)
**스토어 readiness**: AAB✅·키스토어서명✅·targetSDK36✅·versionCode1✅·개인정보URL LIVE✅·아이콘✅·데이터안전성가이드✅. **남은 콘솔작업(사용자)**: 스토어설명/스크린샷/피처그래픽/콘텐츠등급/데이터안전성제출/개발자계정. ⚠️앱 API도메인=`api-dev.sumbodyweb.com`(.env EXPO_PUBLIC_API_URL, 작동하나 dev서브도메인; `api.doublewin.co.kr` 미설정).

## 🟢 찜(관심목록) 버그 수정 (2026-06-11 4차, 커밋 `36e71f5`)
**증상**: 상품·쇼핑몰 찜하고 나갔다 들어오면 하트 풀림 + 관심목록 탭에 즉시 안 보임. **진단**: 백엔드는 정상(RDS `wishlists`76/`mall_wishlists`43/`market_wishlists`4행, 토글 시 row 저장/삭제 확인) — 순수 프론트 버그. (1)`product/[id].tsx`·`mall/[platform].tsx`가 찜 초기상태를 hydrate 안 함(`useState(false)`만, market은 원래 `getMarketWishlist().ids`로 hydrate함). (2)`mypage/wishlist.tsx`가 `useEffect([])`로 최초1회만 로드→탭 재진입 시 갱신X. **수정**: product=`getWishlist(1,500)` items에 id포함 검사, mall=`getMallWishlist()` items에 id검사로 각각 hydrate effect 추가, wishlist탭=`useFocusEffect`로 전환. **에뮬 검증완료**(카카오세션): 상품 찜→force-stop→재진입 하트 유지✅, 관심목록 탭에 즉시 노출✅, 쿠팡몰 동일✅. 스샷 `_verify_checkout/wl_*.png`. ⚠️`wishlists.userId`는 varchar, `users.id`는 uuid → SQL 조인 시 `::text` 캐스트 필요. **APK 재빌드+설치됨**(14:42).

## 🔵 다음 액션 (2026-06-11 3차 배치 — 스토어 출시 준비) ★최신★
**맥락: 곧 앱을 구글 플레이/앱스토어에 올려 심사받음.** 3차 배치 **전부 완료 — 미완 없음(A빌드·B커밋 다 끝남). main clean.** 다음은 사용자가 스토어 콘솔에 APK 업로드 + 개인정보 URL 입력만 남음.
- **(A) 최종 APK 재빌드 ✅완료(2026-06-11 12:27)** — `gradlew.bat assembleRelease` BUILD SUCCESSFUL(2m2s), `app-release.apk`(95.2MB, 12:27:33). Pixel_3a 에뮬 `adb install -r` 성공 → 딥링크 `doublewin://settings/legal/privacy`로 검증: 인앱 개인정보화면에 **소셜 로그인 식별자(카카오·네이버·구글)·1-1.위치정보 섹션** 반영, 하단 **"전체 개인정보처리방침 보기 ↗"** 코랄버튼 탭 시 Chrome으로 `i-homemarket.co.kr/doublewin/privacy.html`(메타비전㈜ 전체방침) 정상 오픈. 스샷 `_verify_checkout/privacy_v1~v3*.png`. (⚠️에뮬 스샷은 `MSYS_NO_PATHCONV=1`로 경로변환 끄고 `screencap→pull`)
- **(B) 커밋 ✅완료** — `85599b3 feat: 스토어 출시 정비`(8 files, +260/-128). 328087b 이후 변경 전부 커밋: 스토어 수정(mypage/help/notifications/about/categories), 맘카페 직접링크, legal 개인정보 링크, 신규 `ihomemarket/doublewin/privacy.html`. (android/ 매니페스트 SYSTEM_ALERT_WINDOW 제거는 gitignore라 미포함). **리모트 없음**(GitHub 미사용, tarball 배포) — push 불가, 임의 remote 생성 금지. ⚠️Bash 툴에서 `@'...'@`(PS here-string) 쓰면 `@`가 리터럴로 섞임 → bash에선 `-m "..."` 다중 사용.

**3차에서 한 일 (전부 완료·검증):**
1. **맘카페 = 실제 카페 직접 링크**(검색 X). `(tabs)/momcafe.tsx`에 검증된 실카페 11곳(전국:맘스홀릭`imsanbu`·레몬테라스`remonterrace` / 수도권:용인`easyup`·수원`byungs94`·동탄`dongtanmom`·인천`baby8` / 영남:부경`pusanmom`·대구`dgmom365`·울산`mammie` / 충청제주:대전노은`djnoen`·제주`jejumam`). 에뮬: `m.cafe.naver.com/imsanbu` 직접열림 확인. 호남/강원은 URL 미검증이라 제외(요청 시 추가).
2. **스토어 코드 수정 + 재빌드 + 에뮬검증**: `SYSTEM_ALERT_WINDOW` 권한 제거(APK확인), 알림 MOCK더미→빈상태("아직 받은 알림이 없어요"), 마이 봇·공지·파트너(NEW배지)메뉴 제거, 고객센터 1:1→이메일 문의(mailto, `SUPPORT_EMAIL='our.employee.ces@gmail.com'`—교체가능), about 가짜 `doublewin.example` 제거, 카테고리 "카드사 혜택" 비클릭화.
3. **개인정보처리방침 페이지 신설+호스팅(LIVE)**: **`https://i-homemarket.co.kr/doublewin/privacy.html`**(HTTP200, FTP로 `/www/doublewin/`에 업로드, 레포 사본 `ihomemarket/doublewin/privacy.html`). 사업자=**메타비전 주식회사**(대표 권영대, 528-81-02752, 통신판매 2023-경기하남-3106, mvcorp.top@gmail.com — 아이홈마켓 푸터 실제정보). 위치/소셜/위탁(AWS·FCM·카카오네이버구글·아이홈마켓)/법정보존 포함. **스토어 제출 시 "개인정보처리방침 URL" 필드에 이 URL 입력**(앱빌드 무관).

**스토어 점검 결과 — 양호**: release 키스토어 서명(CN=DoubleWin, debug아님)✅, targetSDK36✅, versionCode1/1.0.0✅. **사용자 결정 대기**: ①지원이메일 mvcorp.top@gmail.com로 통일할지(현재 our.employee.ces) ②운영 API도메인(현재 `api-dev.sumbodyweb.com`, `api.doublewin.co.kr` 미설정) ③위치권한 데이터안전성 폼은 제출 시 기재.

**FTP 배포법(재사용)**: `계정.md` FTP=mvcorp1/`Meta7792@!`, `i-homemarket.co.kr:21`, 작업디렉터리 `/www`. python ftplib로 env 전달(평문 노출 금지). [[reference-cafe24-workflow]].

---
## 🔵 다음 액션 (2026-06-10 2차 배치)
**펜딩 없음 — 아래 2차 배치까지 전부 코드+배포+에뮬검증 완료.** ⚠️**미커밋**: 2차 배치 변경은 로컬 git에 커밋 안 함(사용자 요청 시 커밋). EC2는 tarball 배포라 git 무관하게 이미 라이브.

### 2차 배치(앱 리브랜드 + 환급비활성 + 배너어드민 + 쿠폰→맘카페) — 전부 완료·검증
1. **앱 이름 → 더블원플러스**: app.json name + 네이티브 strings.xml app_name + 앱내 "더블윈"→"더블원플러스" 전부(조사 보정: 을→를/이→가/으로→로). 기술ID(slug/scheme/package=로마자 `doublewin`)는 유지. aapt 확인 `application-label:'더블원플러스'`.
2. **환급 버튼 전부 비활성화**(1차오픈): 홈 캐시백카드 제거(마이엔 유지), 캐시백탭·마이 환급버튼=회색"환급 준비 중"🔒+알럿. 알럿문구="현금 환급은 준비 중입니다.\n적립하신 캐시백은 **번개장터에서 사용 가능합니다.**" (`/cashback/withdraw` 직접진입 경로 전부 차단, 라우트만 보존)
3. **배너 어드민 관리 신설**(홈+카테고리 둘다): 신규 `banners` 테이블/모듈(apps/api/src/banners), 어드민 `dashboard/banners` 페이지(이미지=클라리사이즈→**base64 data URI**, 태그/제목/서브/정렬/활성토글, 홈·카테고리 탭), 모바일 `src/api/banners.ts`+index/categories에서 PROMO_SLIDES 폴백연동(`bannerSlides.length? : 하드코딩폴백`). 이미지 저장=**DB text(base64)**—볼륨/정적서빙 없음. main.ts bodyParser 12mb 상향(base64용). **배포완료**: tarball→EC2, api+admin 재빌드, RDS `CREATE TABLE banners`(수동, synchronize off), 에뮬E2E(테스트배너 삽입→홈 풀블리드 렌더 확인→삭제). 어드민 쓰기경로 body-limit는 600KB POST=400(≠413)로 검증.
4. **쿠폰 탭 제거→맘카페 신설**(1차오픈 쿠폰X): `(tabs)/_layout.tsx` 쿠폰탭→맘카페탭(people아이콘), 쿠폰은 `href:null`로 차단+마이 '내쿠폰' 퀵메뉴 제거. 신규 `(tabs)/momcafe.tsx`=전국인기(맘스홀릭/맘이베베/레몬테라스)+권역별 지역칩(서울·경기인천·영남·호남·충청·강원제주), 탭 시 **네이버 카페검색**(`m.search.naver.com/search.naver?query=...맘카페`)으로 실제 카페 연결(카페ID 하드코딩 회피, 추후 직접URL 교체가능). 에뮬: Chrome 열려 맘스홀릭=cafe.naver.com/imsanbu 확인.

**운영 메모(2차)**: EC2 RDS 마이그레이션은 컨테이너 내 node+pg로(`docker cp 스크립트→/app→docker exec -w /app node`, NODE_PATH 이슈로 /app에 둬야 pg resolve). 인라인 SSH+Korean/템플릿리터럴 깨짐→`.sh 파일 scp+sed -i 's/\r$//'` 방식이 안전. 직접 cafe URL 확인됨: 맘스홀릭베이비=cafe.naver.com/imsanbu. **잔여 후속(미요청)**: 어드민 브랜딩 아직 "더블윈 관리자"(앱만 리브랜드함).

---
## 🔵 (1차) 이전 완료분
**펜딩 없음 — 에뮬 시각검증까지 전부 완료(2026-06-10 재개 세션).** 코드/배포/검증 다 끝남, main clean.
- ✅ **에뮬 시각검증 완료**: 재부팅으로 adb `RegisterClassExW` 장애 해소 → Pixel_3a AVD 기동 → 기존 APK(Jun10 11:44, `2e1b6dc` 포함) 재설치. 확인된 것: 홈/카테고리 T3 코랄 디자인, **기획전 인라인 그룹 뷰**(타일 코랄활성+그리드 아래 인라인), **경유사·회사 네비 칩**(전체/한우9/제주9/삼립9/단미정… — 제목파싱 정확), **그룹 헤더 `[아이홈마켓] 회사 N개`**, 대형 배너 카드, **회사 필터**(삼립 탭→삼립 상품만), **맨위로 FAB**(스크롤 시 등장), 상품 상세(캐시백 0원/구매하러가기). 캐시백 0% 펄 숨김도 정상. 스샷 `_verify_checkout/resume_*.png`.
  - **타일 탭 좌표 교훈**: 타일 라벨은 `uiautomator dump` 후 `text="기획전"` bounds로 정확 좌표 얻기(기획전 라벨 ~[123,1143][213,1192], 탭 168,1167). 추측 좌표는 배너/빈영역에 빗나감.
- 잔여 미세조정(요청 시): 특정 상품에 설명어가 끼면 그 제목 받아서 `BRAND_SKIP`/`BRAND_PROMO`에 추가. ([[project-t3-quiet-mono]] 파싱 규칙)
- **adb/에뮬 윈도우 워크플로우 교훈**: adb·emulator는 PATH에 없음 → `$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe` 직접 호출. 스샷은 `adb exec-out screencap -p > file` 금지(PS가 UTF-16 BOM으로 바이너리 손상) → **`adb shell screencap -p /sdcard/x.png` 후 `adb pull`**.

## 이번 세션 한 일 (commits, 6ec11af 이후, main clean)
```
0e4426e fix(sync): it_maker 플레이스홀더 null + market rating NOT NULL 보정
2e1b6dc feat(categories): 제목→회사(brand) 파싱 휴리스틱 정교화
93fceb9 feat(categories): 인라인 그룹 뷰 + 경유사·회사 네비 + 맨위로 + brand 백엔드
ae0a473 feat(categories): [경유사]·회사 그룹
7b2dcb5 fix(categories): 캐시백 0% 펄 숨김
5a4df25 perf(categories): ScrollView→FlatList 가상화+무한스크롤+배너형
1ab548e fix(design): 활성 선택 칩 다크→코랄 통일
306dfe4 feat(design): T3 Quiet Mono 잔여 전 화면(29 files)
adb53af feat(design): T3 Quiet Mono 전면(login·home·mypage·product·theme)
```
1. **T3 Quiet Mono 디자인 전면 적용** — 화이트+코랄 `#F0410E`, 라이트그레이 `#F6F7F9` 배경+화이트 카드. login/home/mypage/product부터 전 화면. 풀디테일·시안 출처·되돌리지말것 [[project-t3-quiet-mono]]. (⚠️login_C 소프트카드는 버려진 안)
2. **카테고리 대개편** — ScrollView→FlatList(렉해결)+무한스크롤, 상품 대형 배너(한 줄 하나), **인라인**(새 페이지 아님—사용자 강조), 전체보기 제거, **경유사·회사 네비 칩**(클릭 시 회사 필터), 그룹 헤더 `[경유사] 회사 N개`, **맨위로 FAB**, 캐시백 0%면 펄 숨김, 회사명=제목 파싱 휴리스틱(정교화).
3. **brand 백엔드 배포 완료** — products.brand 컬럼 + ihome-sync it_maker→brand. **단 it_maker가 461건중 빈값352/플레이스홀더108/실브랜드1뿐** → 사실상 무용, 제목 파싱이 실질 소스. 배포: 카페24 sync.php FTP(slug `udza6nvy0s1w`) + EC2 API 재빌드 + RDS `ALTER products ADD brand`(synchronize off) + 커서리셋·풀재동기화(fetched=461, lastError=null). **부수: market_products.rating NOT NULL 기존버그 수정. EC2 디스크 100%→prune로 12.6G 확보.**

## 운영 상태 스냅샷
- **EC2**(54.238.64.159): API 재빌드·배포됨(brand+rating fix 포함), 컨테이너 3개 정상, 디스크 30%.
- **RDS**: products.brand 추가됨, 461건 동기화(brand는 "더바른" 1건만 채워짐).
- **카페24** `/www/api_sync/udza6nvy0s1w/sync.php`: it_maker SELECT 추가본 배포됨.
- **에뮬레이터**: 다운(adb RegisterClassExW). 재부팅 후 살아남.
- **에뮬 검증 스크린샷**: `_verify_checkout/t3_*.png` (login/home/mypage/product/categories/cashback/네비필터/FAB 등).

## 관련 메모리
- [[project-t3-quiet-mono]] — 디자인+카테고리+brand 풀디테일
- [[reference-aws-deploy-workflow]] — EC2 SSH+tarball+docker(이번 세션 사용, 디스크 prune 교훈)
- [[reference-cafe24-workflow]] — sync.php FTP 배포(deploy_sync.py, .secret.local.json)
- [[reference-emulator-workflow]] — Pixel_3a AVD
- [[project-session-2026-06-01]] — 직전 세션
- [[feedback-no-questions-just-do]] · [[feedback-rn-sticky-flex-break]]
