---
name: reference-android-release-keystore
description: "더블윈 안드로이드 프로덕션 서명 키스토어 위치·지문·빌드 배선 (비번은 계정.md). 소셜/지도 OAuth 등록, 스토어 배포 시 참조."
metadata: 
  node_type: memory
  type: reference
  originSessionId: f6fd67f2-ea7d-4ce2-8747-6797745daf1e
---

2026-06-01 생성. 그전엔 release 가 debug 키스토어로 서명되고 있었음(`app/build.gradle:115` `signingConfig signingConfigs.debug`) → 프로덕션 키스토어로 교체.

**Why:** 스토어 배포 + 네이티브 소셜(카카오/네이버/구글) 키해시 등록은 안정적인 서명키가 필수. debug 키로는 안 됨.

## 위치 (전부 git 미추적 — `apps/mobile/.gitignore` 의 `/android` 로 android 폴더 통째 제외)
- 키스토어: `apps/mobile/android/app/doublewin-release.keystore`
- 빌드 설정: `apps/mobile/android/keystore.properties` (DW_UPLOAD_STORE_FILE/KEY_ALIAS/STORE_PASSWORD/KEY_PASSWORD)
- **비번·alias·DN·지문 전체는 `CEN/계정.md`** "더블윈 안드로이드 프로덕션 키스토어" 섹션. (alias=`doublewin`)

## build.gradle 배선 (app/build.gradle)
- `keystore.properties` 있으면 release 서명, 없으면 debug 폴백 (다른 환경 빌드 안 깨지게). `signingConfig hasReleaseKeystore ? signingConfigs.release : signingConfigs.debug`

## 지문 (OAuth/지도 등록용)
- 패키지명 `com.doublewin.app`
- SHA-1 `0A:0A:5A:9F:C1:30:31:E2:D8:2B:15:52:74:41:03:67:A2:D7:01:92`
- SHA-256 `9D:48:39:7E:7B:23:EA:78:2C:00:E8:34:69:DE:69:BC:49:98:3F:03:E6:E5:B5:47:23:9A:B9:7F:0E:4D:D4:B0`
- Kakao 키해시(base64 SHA-1) `Cgpan8EwMeLYKxVSdEEDZ6LXAZI=`

## 주의
- ⚠️ **키스토어 분실 = 스토어 앱 업데이트 영구 불가**. OneDrive 외 별도 백업 필요(사용자에게 고지함).
- 서명키 바뀌면 기존 설치 APK 위에 `adb install -r` 실패(서명 불일치) → 재설치 시 먼저 `adb uninstall com.doublewin.app`.
- Google Play "앱 서명" 사용 시 구글 배포키 SHA-1 이 또 생김 → 콘솔 인증서 SHA-1 도 각 소셜에 추가 등록.

## 관련
- [[project-ihome-sso]] (네이티브 소셜 로그인 — 이 지문으로 카카오/네이버/구글 등록 필요) · [[reference-emulator-workflow]]
