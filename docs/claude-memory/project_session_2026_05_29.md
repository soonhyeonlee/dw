---
name: 2026-05-29
description: 어제 이어서 sticky 폴더탭 인라인 + 학원/어린이집 Google Places 자동 수집 인프라 구축. 4 commits. 후속 세션에서 에뮬 시각 검증 ✅ 완료 (폴더탭 가로/번개장터 인라인+sticky/우리지역 토글+어린이집칩 모두 정상). 남은 건 P1 Google Places API 키 발급(사용자 액션)뿐.
metadata: 
  node_type: memory
  type: project
  originSessionId: ce1e35b7-226b-4c47-9ebe-bc85b3a041cd
---

**Why:** 사용자가 "다시 재부팅하고 이어서하게 히스토리 저장해줘 다음에 이어서하자고하면 진행해줘" 요청. 다음 세션이 이 문서 한 장으로 현재 상태 + 다음 액션 파악 가능하게.

**How to apply:** 다음 세션 "이어서" / "계속" / "어디까지 했어" 등 들어오면 이 문서를 첫 번째로 읽고, 아래 "이어서 시작 절차"대로 바로 진행. 4지선다 묻지 말 것 ([[feedback-no-questions-just-do]]).

## 현재 상태 (2026-05-29 끝 시점)

- **git**: main 브랜치 clean, 4 commits 추가됨 ([[project-session-2026-05-28]] 이후)
- **EC2**: doublewin-api/admin/crawler 모두 정상 가동. nearby 엔드포인트 + Google Places 컬럼 반영됨
- **RDS**: academies 테이블에 latitude/longitude/googlePlaceId(unique)/source 4 컬럼 추가됨, source 기본 'manual'
- **모바일 최신 APK**: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` (88MB). sticky wrapper fix 적용 완료. **에뮬 시각 검증 완료 (2026-05-29 후속 세션)** — 아래 "에뮬 시각 검증 결과" 참고

## 이번 세션 4 commits (852c596 이후)

```
79adb0a fix(mobile): wrap sticky segmentBar to preserve flexDirection
5c788e7 fix(api): explicit varchar type for academy googlePlaceId/source columns
d8b9382 feat: academy geo sync via Google Places API
34e19a2 feat(mobile): inline market/region under sticky home tabs + nearby academy toggle
```

### 34e19a2 — 모바일 폴더탭 인라인 + sticky + 가까운 지역 토글
- 번개장터/우리지역 탭이 새 화면 라우팅 대신 홈 ScrollView 안에서 콘텐츠 교체
- ShopBack 스타일: `stickyHeaderIndices` + 탭 누르면 tabBarY 로 `scrollTo` → 탭 윗단이 화면 상단에 붙음
- `MarketContent` / `RegionContent` 추출 — 표준 라우트(/(tabs)/market, /(tabs)/region) 와 인라인 양쪽에서 `forwardRef.reload()` 공유
- 우리지역에 **전체 보기 / 내 주변 5km** 토글 + 어린이집 카테고리 칩 추가
- expo-location 권한 + 좌표 취득 + 거리 뱃지

### d8b9382 — 학원 Google Places 자동 수집 인프라 (백엔드 + 크롤러)
- Academy 엔티티에 latitude/longitude/googlePlaceId/source 컬럼
- `/region/academies` lat/lng/radiusKm/source 파라미터 — bounding box 사전필터 + JS Haversine 정렬 (DB 종속성 없음)
- Python 크롤러 `google_places.py`: 35 지역(서울 25구 + 광역시·경기) × [학원, 어린이집] Nearby Search 페이지네이션 + UPSERT
- `CRAWLER_MODE=places_once` 트리거 + schedule 모드는 매주 월요일 03:00 자동 실행
- `migrations/2026-05-29-academy-geo.sql`, `docs/google-places-setup.md` 작성

### 5c788e7 — 엔티티 타입 fix + 헬퍼 스크립트
- TypeORM reflection 함정 해결 (아래 함정 1 참고)
- `docker-compose.prod.yml` 에 `GOOGLE_PLACES_API_KEY` 매핑
- `scripts/places-trigger.sh`: 사용자가 키 전달하면 .env 등록 → 크롤 → RDS 검증까지 자동

### 79adb0a — sticky wrapper 패턴 fix
- 아래 함정 2 참고. wrapper View 로 sticky 잡고 안쪽에 진짜 flex 컨테이너
## 에뮬 시각 검증 결과 (2026-05-29 후속 — ✅ P0 완료)

후속 세션에서 APK 설치 + 4개 화면 캡처로 시각 검증 완료. 캡처는 `_verify/01~13_*.png`. **모두 정상**:

1. ✅ **폴더탭 가로 한 줄** — 쇼핑/번개장터/우리지역/여행 4탭이 가로 정렬 (sticky wrapper fix 작동)
2. ✅ **번개장터 인라인 + sticky** — 탭 누르면 홈 ScrollView 안에서 ihomemarket 상품(가습기 등 그리드 + "지금 특가"/"이번 주 추천")으로 콘텐츠 교체, 하단탭 홈 유지. 스크롤 시 탭바가 화면 최상단 고정
3. ✅ **우리지역 토글 + 어린이집 칩** — 학원정보/쿠폰북 서브탭, "전체 보기 / 내 주변 5km" 토글, 카테고리 칩(전체/학원/어린이집/태권도/영어/수학), "총 5개" 목록
4. ✅ **내 주변 5km** — 토글 활성화 정상. 에뮬 GPS fix 없을 때 "Current location is unavailable..." 친절한 에러 + 전체 목록 폴백 (크래시 없음). 실기기 GPS 에서는 정상 예상

### 검증 중 배운 것 (다음 자동화 위해)
- **에뮬 input tap 좌표는 1440x3120 (wm size 기준)** — 메모리 구버전 "1080x2220" 은 부정확. screencap PNG 도 1440x3120, 1:1 매핑
- **좌표 추정 금지, uiautomator dump 로 정확한 bounds 취득**. RN carousel 자동회전이 idle 막아 dump "could not get idle state" 자주 → `settings put global *_animation_scale 0` 후 6회 재시도 루프로 성공. 텍스트 노드 bounds 그대로 사용 (예: 번개장터 `[461,1355][633,1420]` → 중심 547,1387)
- **screencap > 파일 리다이렉트 금지** (PowerShell UTF-16 으로 PNG 깨짐) → `shell screencap -p /sdcard/x.png` 후 `pull` 필수
- 에뮬 시작 절차 (참고용):
  ```powershell
  Start-Process "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" `
    -ArgumentList '-avd','Pixel_7_Pro_API_30','-no-snapshot-load','-no-audio','-gpu','swiftshader_indirect'
  ```
  부팅 ~15초. (락파일 Remove-Item 은 NonInteractive 모드에서 -Confirm:$false 필요할 수 있음)

## (구) 이어서 시작 절차 (P0 — 완료됨, 참고용)

다음 세션 시작 시 바로 이거부터:

1. **에뮬레이터 재기동 (swiftshader gpu 옵션 필수)**:
   ```powershell
   $p = Start-Process -FilePath "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" `
     -ArgumentList '-avd','Pixel_7_Pro_API_30','-no-snapshot-load','-no-audio','-gpu','swiftshader_indirect' `
     -PassThru -WindowStyle Normal
   ```
   기본 GPU 모드로 띄우면 OneDrive 경로 ACL + GPU 컨텍스트 충돌로 자주 죽음. `-gpu swiftshader_indirect` 가 안정적.

2. **APK 설치 + 폴더탭 가로 정렬 + sticky 동작 검증**:
   ```bash
   ADB="$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe"
   "$ADB" -s emulator-5554 install -r "apps/mobile/android/app/build/outputs/apk/release/app-release.apk"
   "$ADB" -s emulator-5554 shell monkey -p com.doublewin.app -c android.intent.category.LAUNCHER 1
   # 캡처 1: 초기 홈 — 4개 폴더탭이 가로 한 줄
   # 캡처 2: 번개장터 탭 클릭 후 — 탭 윗단이 화면 상단에 붙고 ihomemarket 콘텐츠 인라인
   # 캡처 3: 우리지역 탭 — 전체/내 주변 토글 + 어린이집 칩 보임
   ```

3. **이슈 발견 시 수정 → 재빌드 (`gradlew :app:assembleRelease`, 약 1분 30초)**

## 그 다음 (P1) — 사용자 액션 대기

**Google Places API 키 발급** (Claude 가 GCP 인터랙티브 로그인 불가):
- 사용자가 https://console.cloud.google.com 에 `mvcorp.top@gmail.com / mma7792@` 로 로그인
- 새 프로젝트 → Places API (Legacy) 활성화 → 결제 계정 카드 등록 → API 키 발급
- 키 받으면 즉시 `GOOGLE_PLACES_API_KEY=AIza... ./scripts/places-trigger.sh` 한 줄로 등록 + 크롤 + 검증 자동

가이드: `docs/google-places-setup.md` 9단계

## 검증 완료된 것

- API 회귀: `GET /region/academies` 기존 manual 데이터 정상 반환, 응답에 새 컬럼 4개 포함, source='manual' 기본값
- nearby 쿼리: `lat=37.4979&lng=127.0276&radiusKm=5` — geo 없는 manual 데이터는 자동 제외되어 빈 결과 (정상)
- source 필터: `source=google_maps` — 빈 결과 (크롤 아직 안 함, 정상)
- 컨테이너 모두 정상 기동, 라우트 매핑 에러 없음
- 마이그레이션: `latitude/longitude/googlePlaceId/source` 컬럼 + 유니크 인덱스 RDS 적용 완료

## 후속 세션 미커밋 변경 (2026-05-29, APK 반영+에뮬 검증 완료, 커밋 대기)

1. **sticky 폴더탭 짧은 콘텐츠 고정 fix** — `apps/mobile/app/(tabs)/index.tsx`. 함정 5 참고
2. **가입 5,000원 적립 / 친구 추천 보너스 전부 제거** (사용자 요청 "다 빼줘"):
   - `index.tsx`: 친구초대 보너스 퀵메뉴 칩 + "가입 즉시 5,000원 적립" 프로모 슬라이드 삭제 (carousel 3→2)
   - `cashback.tsx`·`mypage.tsx` 게스트 CTA: "지금 가입하고 5,000원 받기" → "지금 가입하고 캐시백 시작하기" (가입 유도 자체는 유지, 금액 약속만 제거)
   - `mypage.tsx`: "친구 초대하고 5,000원 받기" 메뉴(HOT) 삭제
   - `notifications.tsx`: "친구 초대 이벤트" 알림(n6) 삭제
   - `settings/notifications.tsx`: "친구 초대 보상" 토글 삭제
   - 유지: 최소 출금액 5,000원(정상 정책), 회원유형 설명, "웰컴 혜택" 칩(→/guide, 현금 보너스 아님). 백엔드엔 가입/추천 보너스 로직 없음
   - 검증: `_verify/17_home_nopromo.png`(홈), `_verify/18_mypage.png`(마이)

## 함정 (이번 세션에서 배운 것)

### 1. TypeORM reflection 의 union/nullable TS 타입 → "Data type Object" 에러
- `@Column({ nullable: true }) field: string | null;` → reflect-metadata 가 `Object` 로 표시 → "DataTypeNotSupportedError: Data type Object" 로 컨테이너 부팅 실패
- 같은 문제: `'literal' | 'union'` 같은 union literal 도 Object
- **해결**: `@Column({ type: 'varchar', length: 255, nullable: true })` 처럼 type 명시
- 발견 경로: 첫 EC2 배포 직후 API 컨테이너 죽어서 docker logs 확인

### 2. React Native ScrollView `stickyHeaderIndices` 가 직접 자식의 flexbox layout 무시 ⭐
- sticky 자식 View 의 `flexDirection: 'row'`, `gap`, `height` 등이 적용 안 됨
- 신기하게 `backgroundColor`, `width: 25%` 같은 일부 props 는 적용됨
- 4개 폴더탭이 가로 한 줄 대신 세로로 쌓여 보임
- **해결**: wrapper View 로 한 번 감싸기. sticky 인덱스는 wrapper, 진짜 flex 컨테이너(segmentBar)는 그 안.
  ```jsx
  <View onLayout={...}>   {/* sticky */}
    <View style={styles.segmentBar}>   {/* flex 정상 */}
      {tabs}
    </View>
  </View>
  ```
- 디버그 방법: 사이질러진 props 가시화 위해 `backgroundColor: 'magenta'` (외곽) + `backgroundColor: 'cyan'` (셀) + 명시 `height` 일시 추가 → 어느 props 가 무시되는지 가시화

### 5. scrollTo 로 sticky 헤더 상단 고정하려면 콘텐츠 minHeight 필요 ⭐ (후속 세션)
- 증상: 폴더탭 탭하면 `scrollRef.scrollTo({ y: tabBarY })` 로 탭바를 화면 상단에 붙이는데, **쇼핑 탭만 잘 되고 번개장터/우리지역/여행은 안 됨**
- 원인: ScrollView 최대 스크롤량 = `contentHeight - viewportHeight`. 탭 콘텐츠가 짧으면(여행=준비중, 로딩중, 항목 적음) 최대 스크롤량 < tabBarY → 목표 y 에 도달 못해 탭바가 상단까지 안 올라감. 쇼핑은 콘텐츠가 길어서 항상 도달 가능했던 것
- **해결**: ① 탭 콘텐츠 영역을 `<View style={{ minHeight: windowH }}>` (useWindowDimensions) 로 감싸 화면 높이만큼 스크롤 여유 확보 ② `setHomeTab` 직후가 아니라 `requestAnimationFrame` 안에서 scrollTo (콘텐츠 교체 레이아웃 반영 후)
- 위치: `apps/mobile/app/(tabs)/index.tsx`. 짧은 탭은 콘텐츠 아래 흰 여백 생기지만 ShopBack 등도 동일 — 상단 고정 위한 정상 트레이드오프
- 에뮬 검증: 여행(가장 짧음)/번개장터 모두 탭바 최상단 고정 확인 (`_verify/15,16_*.png`)

### 3. ADB daemon 재기동 실패 (TIME_WAIT 누적)
- 에뮬 죽고 ADB 반복 호출하면 5037 포트에 TIME_WAIT 수십 개 쌓여 "could not read ok from ADB Server" 반복
- `netstat -ano | findstr 5037` 으로 확인
- **해결**: 10~15초 대기 후 재시도. 또는 모든 adb 프로세스 죽이고 `adb start-server` 한 번만

### 4. 에뮬레이터 OneDrive 경로 + 기본 GPU = 죽음 빈번
- 위 시작 절차의 `-gpu swiftshader_indirect` 옵션 사용
- AVD 락 파일 (`*.lock`) 잔존하면 시작 실패: `Get-ChildItem ... -Filter "*.lock" | Remove-Item -Force`

## 운영 정보 빠른 참조

- EC2: `ec2-user@54.238.64.159`, key `~/.ssh/doublewin-key.pem`
- RDS: `doublewin-db.czw6ymkwut58.ap-northeast-1.rds.amazonaws.com`
- AVD: `Pixel_7_Pro_API_30` (1080x2220, density 560)
- 모바일 패키지: `com.doublewin.app`, scheme `doublewin`
- APK 위치: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- Google Places 가이드: `docs/google-places-setup.md`
- Google Places 트리거: `scripts/places-trigger.sh` (키 1개만 받으면 자동 실행)

## 관련 메모리

- [[project-session-2026-05-28]] — 어제 세션 (어드민 + 아이홈마켓 sync + APK 1차)
- [[project-doublewin-redesign]] — 전체 리디자인 큰 그림
- [[project-ihomemarket]] — 카페24 사이드 프로젝트
- [[reference-aws-deploy-workflow]] — EC2 SSH 배포 SOP (이번 세션에서 그대로 사용)
- [[reference-emulator-workflow]] — Pixel_7_Pro_API_30 + ADB SOP (이번 세션에서 swiftshader 옵션 추가)
- [[feedback-no-questions-just-do]] — 합리적 디폴트로 실행 후 보고
