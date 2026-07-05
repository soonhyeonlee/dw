---
name: project-region-home-fixes-2026-06-15
description: 우리지역/홈/맘카페 UX 버그 수정 + 백엔드 EC2 배포 (2026-06-15)
metadata: 
  node_type: memory
  type: project
  originSessionId: 57c23000-12b6-49c4-8a98-7b49da91a93b
---

사용자 피드백(홈 탭 먹통, 인기캐시백 전체/일자탭, 번개장터 상세, 우리지역 검색/페이지/카테고리/5km, 맘카페 박스)을 일괄 수정.

## 백엔드 (커밋 f6c0be0, EC2 배포 완료·검증됨)
- `region.service.getAcademies`: `sort`(popular/rating/review/distance) 파라미터 추가, geo 없을 때 정렬 적용.
- 세분 카테고리 = **업체명 키워드 분류**. `ACADEMY_CATEGORY_KEYWORDS`(region.service.ts 상단)에 카테고리→이름 LIKE 키워드 맵. category 가 맵에 있으면 `a.name LIKE` OR 매칭, 없으면 `a.category` 일치.
- region.controller 에 sort 쿼리 배선.
- ⚠️ **데이터 커버리지 한계**: 수집된 academies 4271건은 학원·어린이집·유치원 위주. 영어=128건처럼 학과는 잘 나오지만 복싱/주짓수/크로스핏 등 격투·헬스는 0건(크롤 안 됨). 격투/헬스 칩 채우려면 Google Places 크롤을 해당 업종으로 추가 실행 필요.

## 모바일 (커밋 f6c0be0 — ⚠️앱 재빌드/OTA 안 함, 사용자에게 알림)
- `RegionContent.tsx`: 검색을 서버사이드(디바운스 350ms)로, 더보기 페이지네이션(20개씩), 정렬 서버 위임, 세분 카테고리 칩, `getCurrentPosition(High)` 우선(내주변 5km stale 좌표 완화). 거리순 선택 시 자동 nearby 전환.
- `app/(tabs)/index.tsx`: sticky 탭바 wrapper 에 배경+zIndex/elevation 20 → 스크롤된 카드가 탭바 위로 그려져 터치 가로채던 Android 버그 수정(번개장터 상품 상세 진입 불가 원인이기도). 인기 상향 캐시백의 무의미한 일자탭(오늘/+1일) 제거, "전체"=인라인 펼치기.
- `momcafe.tsx`: 버튼처럼 보이던 인트로 박스 제거.

## 검증 (curl localhost:4000 / CloudFront 둘 다)
- /malls 200, Nest 정상 기동(affiliate DI OK), /region/academies?category=영어&sort=review → total 128, 페이지네이션 메타 정상.

## 세분 카테고리 자동 크롤링 (커밋 8cc2875, EC2 배포·실행됨)
- `apps/crawler/crawlers/google_places.py` SEARCH_TARGETS 에 격투/무술·헬스·교과·예체능 24개 세분 키워드 추가(복싱/주짓수/MMA/헬스장/PT/크로스핏/영어/수학/논술/피아노/미술/발레 등). category 값=모바일 칩·백엔드 키워드맵 키와 동일.
- `repository.py` ACADEMY_UPSERT_SQL: ON CONFLICT 시 category 재태깅(넓은 '학원'은 기존 구체 category 덮지 않는 CASE).
- **자동 구조**: doublewin-crawler 컨테이너 CRAWLER_MODE=schedule → 매주 월 03:00 run_google_places() 자동(신규 타깃 포함). 즉시 1회는 `docker compose run -d --name dw-places-once -e CRAWLER_MODE=places_once crawler` 로 수동 트리거.
- 2026-06-15 수동 1회 실행 → 종로구만 처리해도 복싱 32/헬스 57/주짓수 18 등 전 카테고리 채워짐. 전체 35지역×27타깃 약 1시간 소요(max_pages=2, ~$45). API E2E 확인: /region/academies?category=복싱 → 59건.
- ⚠️ dw-places-once 컨테이너는 --rm 없이 떠서 종료 후 exited 로 남음 → 나중에 `docker rm dw-places-once` 정리.

## 에뮬레이터 시각 검증 완료 (2026-06-15, Pixel_7_Pro_API_30)
- `npx expo run:android` 로 dev client 재빌드(BUILD SUCCESSFUL 6m) → 설치 → Metro 로딩 → 검증.
- ⚠️ **Kakao maven repo 누락 함정**: stale android/ prebuild 에 `https://devrepo.kakao.com/nexus/content/groups/public/` 가 없어 `com.kakao.sdk:v2-user` 등 resolve 실패로 gradle 죽음. android/build.gradle allprojects.repositories 에 직접 추가해 해결(android/ 는 gitignore라 미커밋). EAS 클라우드 빌드 시 @react-native-seoul/kakao-login config plugin 이 이 repo 를 넣어주는지 확인 필요(안 넣으면 동일 실패).
- ⚠️ 설치 시 INSTALL_FAILED_UPDATE_INCOMPATIBLE(기존 5/6 빌드와 서명 불일치) → `adb uninstall com.doublewin.app` 후 재설치.
- 검증 결과 전부 OK(deep link 로 화면 진입이 탭좌표보다 안정적): 홈 인기캐시백(일자탭 제거·캐시백률순), **sticky 탭 스크롤 후 탭 전환 정상(먹통 해소 직접 확인)**, 번개장터 상품상세, 우리지역 총 18,304건+세분칩(복싱 등)+검색+정렬, 우리지역 상세(파워복싱체육관 실사진·영업시간·지도·전화, category=복싱 배지), 맘카페 인트로박스 제거.

## 모바일 배포(스토어) 블로커 — 여전히 남음
- expo-updates 미설치 → OTA 없음. eas whoami = **Not logged in**. 스토어 반영하려면 사용자 `eas login` 후 `eas build -p android --profile production`. 앱 미출시라 다음 빌드에 자동 포함. 코드 커밋됨(f6c0be0).
- **2026-06-17: 최신 코드(f6c0be0/8cc2875/83a23fd 전부 반영) 스토어 AAB 로컬 재빌드 완료** = `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab` (70.6MB, 06-17 21:21, release서명, versionCode 1 / 1.0.0). 직전 AAB(06-12)엔 우리지역검색·사진·홈탭수정 빠져 있었음 → 이걸로 대체. 빌드법=`cd apps/mobile/android && ./gradlew.bat bundleRelease` (keystore.properties·kakao maven repo·doublewin-release.keystore 다 로컬에 있음, android/ gitignore라 보존됨).
- **2026-06-17: 첫 출시 스토어 자료 일괄 생성 완료** → `apps/mobile/_store/`: `00_README_업로드체크리스트.md`(콘솔 단계별), `01_store_listing_ko.md`(앱명/간단·자세한설명/카테고리=쇼핑), `02_data_safety_ko.md`, `03_content_rating_ko.md`(전체이용가), `icon_512.png`, `feature_graphic.png`(1024×500, 코랄+W+아이콘 PIL생성), `screenshots/01~06`(1440×2762, _qa/ 실캡처에서 상단 상태바·하단 디버그배너 PIL crop 제거: 홈/우리지역/학원상세/번개장터/맘카페/페이백). 스크린샷 디버그배너 top=2866 일관·top status 96px crop.
- **업로드는 사용자 몫**(플레이콘솔 로그인+2FA 필요, 내가 대행 불가). 자동 API업로드도 불가=Play 서비스계정 JSON 키 없음(레포 JSON은 AWS용뿐)+첫출시는 API로 앱생성·첫프로덕션 불가(콘솔수동필수). eas.json submit.android.serviceAccountKeyPath 비어있음.
- **2026-06-17: 자동 배포 파이프라인 구축 완료** `apps/mobile/scripts/play-deploy/`: `play_deploy.py`(Play Developer API로 AAB→트랙 업로드, google-api-python-client+google-auth 설치됨, UTF-8출력강제, graceful에러), `deploy.ps1`(versionCode자동+1→gradlew bundleRelease→업로드 원클릭, -Track/-Status/-Notes/-NoBump/-SkipBuild), `requirements.txt`, `README.md`(1회설정 가이드). 검증: 스크립트 import/실행/PS파싱/versionCode regex(1→2) 다 통과. 키경로=`apps/mobile/_secrets/play-service-account.json`(gitignore에 _secrets/·*play-service-account*.json·/_store·/_qa 추가함). **사용자 1회설정 필요**: ①첫출시는 콘솔수동(_store/ 자료) ②GCP에서 Play Developer API 사용설정+서비스계정 JSON키 발급 ③Play콘솔 설정→API액세스에서 GCP연결+서비스계정에 릴리스권한 ④키를 _secrets/에 저장. 이후 `deploy.ps1 -Track production -Notes "..."` 한 줄. ⚠️Play API는 앱 첫버전 업로드 불가(2번째 릴리스부터 동작). 순서: play.google.com/console → 앱만들기(없으면, 패키지 com.doublewin.app) → 출시>프로덕션>새버전 → 위 AAB 드래그 → 필수폼(개인정보URL=i-homemarket.co.kr/doublewin/privacy.html, 데이터보안 위치+소셜식별자, 콘텐츠등급, 스토어등록정보·스크린샷·피처그래픽). 확인=콘솔 "게시 개요"/프로덕션 트랙 상태, 출시후 공개 https://play.google.com/store/apps/details?id=com.doublewin.app . ⚠️versionCode 1을 이미 올린적 있으면 거부 → versionCode 올려 재빌드 필요.

## 사진/내용/내주변 후속 수정 (커밋 83a23fd, 2026-06-16, api+크롤러 배포·재크롤 완료)
- **근본원인**: 크롤러가 Nearby 응답의 photo_reference 를 버려서, 18,304건 중 사진 있는 건 **1건뿐**(상세 1회 본 것만 lazy enrich). 목록 썸네일·상세 히어로 거의 다 빈 상태였음.
- **수정**: 크롤러 normalize 가 photo_reference(무료) 최대 3개 → photoRefs 저장. repository UPSERT 는 enrichedAt 있는 건 보존, 미보강 건만 갱신. API(region.service.fillPhotos)가 photos 비면 photoRefs 로 사진 프록시 URL 생성(getAcademies/getAcademy 3군데).
- 재크롤(28,507 수집) 후 photoRefs **8,576/19,304건(44%)** 채워짐. 나머지 56%는 구글에 사진 자체가 없음(소형 학원/어린이집) → placeholder 정상. API E2E 검증: 목록 photos[] URL 반환 + 프록시 302→googleusercontent→200 image/jpeg(127KB).
- **내 주변**: coords 캐시 재사용 제거 → 매번 getCurrentPosition(High) 새로 취득. reverseGeocodeAsync 로 "현재 위치 ○○구 기준 반경 5km" 라벨 표시(엉뚱한 위치 오해 감소). 백엔드 geo 쿼리 정상 검증(강남역 5km=헬스 84건, 0.09km부터 거리순).
- ⚠️ 이번 세션 에뮬레이터가 GPU access violation(0xC0000005)로 반복 크래시(두 AVD 다) → 이 수정들의 UI 재캡처는 못함. 단 직전 라운드에서 화면 렌더는 전수 검증했고, 이번 변경 substance(사진·내주변)는 API/curl 로 검증 완료. 코드 tsc 통과·커밋. (에뮬은 PC 재부팅/드라이버 리셋 후 정상화 예상)

## 사진 빈 카드 채우기 (2026-06-18, api 배포 완료) — 스톡→거리뷰로 전환
- **1차(폐기)**: 카테고리별 Unsplash 스톡 이미지로 채움. 사용자가 **"이상한 이미지 넣지말고 관련영상 등에서 가져온 이미지 써"** → 스톡 전면 제거.
- **현황(DB)**: 전체 19,304 / Google 실사진(photoRefs) **8,576(44%)** / 관련영상 보유 **5건** / **좌표 전건(100%)**. YouTube 검색 쿼터 100/일이라 1만여건 관련영상 전수확보 불가. Places 키는 **Street View/Static Maps 권한 막힘**(REQUEST_DENIED). Naver 검색키 비어있음.
- **확정 방향(사용자 선택)**: 좌표 전건 보유 → **각 업체 위치의 Google Street View 사진**으로 채움.
- **구현**(`region.service.ts`+`region.controller.ts`, 커밋 미완료=working tree): `fillPhotos`가 사진 없으면 `photos=[<api>/region/academies/:id/streetview]`. 새 프록시 `resolveStreetView()`+`@Get academies/:id/streetview`: ① streetview metadata(무료)로 좌표 거리뷰 존재확인 → 있으면 Static 이미지 바이트 스트리밍(키 IP제한이라 리다이렉트 불가, 직접 스트림, Cache-Control 7일) ② 없으면 관련 유튜브 영상 썸네일로 302 ③ 둘다 없으면 404(앱 기본 플레이스홀더).
- **키 활성화 완료(2026-06-18, 내가 gcloud로 직접 처리)**: 로컬 gcloud가 `mvcorp.top@gmail.com`/project **918369339229**로 인증돼 있음. Places 키=api-key uid **e16ae00b-8766-40a4-9b6c-fede3475574d**("DoubleWin Crawler Places", keyString AIzaSyDqzyhGQ2Vf…). 명령: `gcloud services enable street-view-image-backend.googleapis.com --project=918369339229` + `gcloud services api-keys update e16ae00b… --api-target=service=places-backend.googleapis.com --api-target=service=street-view-image-backend.googleapis.com --allowed-ips=54.238.64.159`(IP·Places 유지하며 streetview 추가). 즉시 전파됨.
  - GCP 키 4개: youtube(cd76c912), **Places(e16ae00b)**, Android Maps(c6313ec9), Maps Platform(254b81d8). Street View Static API 서비스명=`street-view-image-backend.googleapis.com`, Maps Static=`static-maps-backend.googleapis.com`.
- **검증 완료(전수 작동)**: EC2 metadata OK→static 200 image/jpeg. API 프록시 `/region/academies/:id/streetview` 200 image/jpeg(~0.4s, 첫 호출만 워밍업 지연). CloudFront 경유 200. 에뮬 화면: 어린이집 목록 카드=실제 건물 거리뷰(공릉2동어린이집 등), 상세 히어로도 거리뷰(cen_40~42).
- **read-time 처리라 설치된 앱도 재빌드 없이 반영**(목록 photos[0]/상세 히어로 photos[] 자동). 모바일 변경 0.
- 비용: streetview static $7/1000, 프록시 Cache-Control 7일(CloudFront 캐시)이라 전건 1회 ≈ $75 수준. metadata는 무료(사전체크로 '이미지없음' 회색판 과금 차단).
- ⚠️ 로컬 git 미커밋(working tree): region.service.ts, region.controller.ts.

## 내 주변 속도 개선 + 무한 스크롤 (2026-06-18, api 배포 + 모바일 재빌드·설치·검증)
- **요구**: "내 주변 조회 너무 오래걸려, 한번에 보여주는거 줄이고 무한스크롤로 빠르게+다 보이게". 진단=백엔드 geo쿼리 자체는 0.2초로 빠름. 느림 원인=① High정확도 GPS fix 대기(수초) ② 거리뷰 이미지 20장 콜드 동시로드 ③ "더보기" 버튼.
- **백엔드**(`region.service.ts` resolveStreetView): 거리뷰 프록시를 metadata+static **2콜→1콜**로. `return_error_code=true` 쓰면 거리뷰 없을 때 404(이미지 과금X)·있으면 바로 이미지 → 지연 절반(첫호출 ~0.4s, 캐시 0.16s). EC2 배포 완료.
- **모바일**(`RegionContent.tsx`+`app/(tabs)/index.tsx`):
  - PAGE_SIZE 20→**10**(첫 페인트 빠르게, 거리뷰 동시로드 분산).
  - 위치측위: `getCurrentPositionAsync(High)` → **lastKnown(maxAge 2분·정확도1km) 우선 → 없으면 Balanced**. High GPS fix 대기 제거. 2분 가드라 "엉뚱한 지역" 재발 방지(과거버그=maxAge 없는 lastKnown이 원인이었음).
  - **무한 스크롤**: 부모 루트 ScrollView에 onScroll(throttle64) → 바닥 700px 전이면 `regionRef.current.loadMore()`. RegionContent가 `RegionContentHandle.loadMore` 노출(useImperativeHandle). loadMore는 `loadMoreLock` ref로 동기 잠금(한 프레임 다중호출 중복페치 방지). "더보기" 버튼 제거 → 자동로드 스피너 푸터+끝에 "전체 N개 모두 불러왔어요".
- **검증**(에뮬 release APK 재빌드·설치): 내 주변 즉시 로드(측위 대기 0), 거리순 무한스크롤 101m→416m→995m→1.0km 매끄럽게 자동 이어붙음, 거리뷰 썸네일 로드 OK(cen_50~54). ⚠️에뮬 lastKnown이 직전 세션 좌표(부산)로 고정돼 위치라벨이 부산으로 떴으나 이는 에뮬 OS 캐시 특성, 실기기선 정상.
- ⚠️ 모바일 변경이라 **스토어 반영엔 AAB 재빌드 필요**(emul은 assembleRelease APK로 검증). 로컬 git 미커밋: region.service.ts, region.controller.ts, RegionContent.tsx, app/(tabs)/index.tsx.

## 학원 상세 어드민 유튜브 영상 (2026-06-18, api+admin 배포 / 모바일 재빌드·설치·검증)
- **요구**: 우리지역 상세 '학원 정보' 탭의 **소개 위**에, 어드민이 올린 유튜브 링크/영상이 뜨게. "아이홈마켓 어드민"이라 했지만 학원 데이터·CRUD는 전부 **DoubleWin 어드민(`apps/admin`="더블원플러스 관리자")**의 학원 관리(`/region/admin/academies`)에 있고 ihomemarket 폴더엔 SSO PHP뿐 → 거기에 구현(맞는 위치). cafe24 PHP 어드민 아님.
- **새 필드**: `academies.adminVideos` simple-json `{url:string; title?:string}[]` (자동수집 `videos`와 별개, 운영자 큐레이션). RDS는 synchronize:false라 **수동 ALTER**: `ALTER TABLE academies ADD COLUMN IF NOT EXISTS "adminVideos" text`(simple-json=text) — 실행 완료.
- **백엔드**(`academy.entity.ts`+`region.service.ts`): 엔티티 컬럼 + `normalizeAdminVideos()`(문자열/객체 혼합 허용, http(s) 아닌 값 필터, 최대 10개). adminCreate/adminUpdate가 정규화 적용(나머지 필드는 기존대로 body 스프레드). getAcademy가 adminVideos 반환.
- **어드민 UI**(`apps/admin/.../academies/page.tsx`): 편집 모달 '소개' 위에 "유튜브 영상(한 줄에 하나, `링크` 또는 `링크 | 제목`)" textarea. openEdit 로드/handleSubmit 파싱→payload.adminVideos.
- **모바일**(`app/region/[id].tsx`+`src/api/region.ts`): Academy.adminVideos 타입 + `youtubeId(url)` 추출(youtu.be/watch/embed/shorts/live) + 정보탭 **소개 위** '영상' 가로 스크롤 섹션(썸네일=`img.youtube.com/vi/{id}/mqdefault.jpg`, 탭→유튜브). 유효 유튜브 링크만 노출, 없으면 섹션 숨김.
- **검증**: admin JWT 발급(컨테이너 내 jsonwebtoken+JWT_SECRET, role=admin user) → PATCH 정규화 확인(문자열→{url}, 잘못된값 제거, {url,title} 유지). 모바일 재빌드 APK 설치 후 딥링크 `doublewin://region/<id>` 진입 → 정보탭 '영상' 섹션이 소개 위에 썸네일+제목 렌더 확인(cen_63~65). 테스트 데이터는 정리함(adminVideos=null).
- ⚠️ EC2 디스크 98%→ docker builder/image prune로 31% 확보 후 admin 빌드 성공(ENOSPC 주의, 백업 .apps.bak도 정리).
- ⚠️ 모바일 변경=스토어 AAB 재빌드 필요. 로컬 git 미커밋: academy.entity.ts, region.service.ts, apps/admin academies/page.tsx, app/region/[id].tsx, src/api/region.ts.

관련: [[reference-aws-deploy-workflow]] [[feedback-rn-sticky-flex-break]]
