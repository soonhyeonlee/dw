---
name: project-ihome-sso
description: "더블윈 앱 ↔ 아이홈마켓 계정 공유 SSO 구현 완료 (HMAC 브리지). 백엔드+sso.php 배포·검증됨, 실제 로그인 후 딥링크 복귀 1-hop만 실기기/회원계정 필요. 미커밋."
metadata: 
  node_type: memory
  type: project
  originSessionId: 4b80c6fe-94e2-4dd5-8e7e-56525e540835
---

2026-05-30 구현. 더블윈 모바일 앱이 아이홈마켓(카페24 그누보드5/영카트5) 계정으로 로그인/가입하도록 통합 (사용자 "아이홈마켓 로그인/회원가입 같이 사용" 요청, 회원유형은 전원 일반회원 기본).

**Why:** 앱 자체 인증(이메일/비번 + 빈 OAuth키 소셜)을 버리고 아이홈마켓이 이미 가진 네이버·카카오·구글·아이디 인증을 재사용.

## 아키텍처: WebView + HMAC 신원 토큰
앱 SSO버튼 → `WebBrowser.openAuthSessionAsync(sso.php, doublewin://auth)` → 그누보드 로그인(모든 소셜 처리) → sso.php가 `{email,mb_id,ts}` HMAC서명 후 `doublewin://auth?...&sig=` 딥링크 → 앱이 `POST /auth/ihome` → API가 검증+JWT발급.
- 기존 상품 sync의 HMAC 채널/시크릿(`IHOME_SYNC_SECRET`) + `socialLogin` 페더레이션 로직 재사용.

## 서명 규칙 (3곳 반드시 일치)
- 대상: **`{email, mb_id, ts}` ASCII 3필드만** (닉네임은 한글 멀티바이트 인코딩차 위험으로 서명 제외, 표시용 전달). email은 계정매칭키라 반드시 서명.
- 키 오름차순 정렬 → URLSearchParams(=PHP `http_build_query` 기본 RFC1738, space=+) → `HMAC-SHA256` hex.
- 구현: `apps/api/src/auth/auth.service.ts` `_ihomeSign`/`ihomeLogin`(ts ±300s 안티리플레이 + `timingSafeEqual`), PHP `ihomemarket/doublewin/sso.php`. openssl로 Node↔PHP 정규형 일치 실증함.

## 변경 파일 (미커밋)
- 백엔드: `auth.service.ts`(ihomeLogin+HMAC헬퍼, ConfigService주입), `auth.controller.ts`(`@Post('ihome')`). User 엔티티 변경 없음(provider/providerId 기존).
- 모바일: `src/lib/ihome-sso.ts`(신규 웹뷰), `src/api/auth.ts`(ihomeLogin), `AuthContext.tsx`, `app/auth/login.tsx`(단일 SSO버튼으로 전면교체), `app/auth/register.tsx`(→login 리다이렉트 스텁), `src/constants/api.ts`(IHOME_SSO_URL), `src/lib/social-auth.ts` **삭제**.
- PHP(레포 버전관리용 + 카페24 배포본): `ihomemarket/doublewin/sso.php`, `sso_config.sample.php`, `.gitignore`(sso_config.php 제외), `README.md`.

## 배포 상태 (✅ 완료)
- **EC2 API**: tarball+docker compose 재배포 완료. `/auth/ihome` 유효서명→200+user(provider='ihomemarket')+JWT, 변조sig→401 검증됨.
- **카페24**: `/www/doublewin/sso.php` + `sso_config.php`(DW_SSO_SECRET=IHOME_SYNC_SECRET 48자) FTP 업로드 완료. HTTP확인: 비로그인→`/bbs/login.php` 302 정상.
- **에뮬 E2E**: 앱 SSO버튼→커스텀탭→아이홈마켓 LOGIN 페이지(ID/PW+네이버·카카오·구글) 렌더 확인(`_verify/19~23`).

## 남은 것
- ~~실제 로그인→딥링크 복귀 1-hop 미검증~~ **✅ 2026-06-01 에뮬 E2E 완전 검증**: 임시 그누보드 회원(`dwssotest`) 생성→웹뷰 로그인→`doublewin://auth` 딥링크 복귀→`POST /auth/ihome`→홈에 "안녕하세요, 더블윈테스트님" 로그인 표시까지 실증. (함정·교훈은 아래 "1-hop 검증 교훈")
- **APK 배포**: SSO 반영 APK는 에뮬 설치만 (2026-06-01 재빌드). 스토어/실기기 배포 별도.
- **정리(수동 필요)**: 더블윈 prod RDS `users` 테스트 유저 2건 — `providerId='ssotest'`(05-30) + `providerId='dwssotest'`(06-01 검증). 분류기가 prod DB DELETE 차단 → 사용자 수동: `delete from users where "providerId" in ('ssotest','dwssotest');`. (아이홈마켓 g5_member 쪽 dwssotest 는 검증 후 즉시 삭제 완료)

## 1-hop 검증 교훈 (2026-06-01)
- **아이홈마켓은 회원가입 승인제**: `bbs/login_check.php:58` 커스텀 `if ($mb['st_tp'] != 1) alert("아직 관리자의 승인...")`. 테스트 회원은 g5_member 에 `st_tp=1` 필수.
- **비번 해시 bcrypt 아님**: 이 그누보드 `get_encrypt_string` = `sha256:` 프리픽스 커스텀. 회원 생성 시 PHP `password_hash` 쓰면 로그인 실패 → common.php include 후 `get_encrypt_string()` 사용 + `check_password()` 자가검증. 도구 `.work-ihomemarket/sso_testmember.py`(create/delete/probe).
- **승인 알럿이 url 없는 login.php 로 튕김** → 그 폼으로 로그인하면 복귀주소 유실되어 쇼핑몰 홈으로. 해결: 로그인만 끝내고 **앱에서 SSO 재탭**(세션 쿠키 유지→sso.php 즉시 서명→딥링크). "이미 로그인됨" 빠른경로가 확실.
- **Chrome 커스텀탭은 uiautomator 로 웹폼 안 보임**(통째 Web View). 좌표 탭, 버튼 빗나가면 PW 포커스 후 `keyevent 66`(Enter)로 제출. 복귀 판정은 `mResumedActivity` 가 CustomTabActivity→`com.doublewin.app/.MainActivity`.
- ~~미커밋~~ **커밋 완료 (2026-06-01)**: `f40fb0f` feat(auth): ihomemarket account SSO via HMAC identity bridge (백엔드+모바일+PHP), `2360962` feat(mobile): 가입/추천 보너스 제거 + sticky 짧은콘텐츠 fix. main 브랜치 clean. push/배포는 별도.

## 네이티브 ID/PW 로그인 추가 (2026-06-01, commit `0f3cd42`, 배포·E2E 완료)
사용자 "로그인화면을 아이홈마켓으로 이동 안 하고 자연스럽게" 요청 → 웹뷰 대신 앱 네이티브 ID/PW 폼. 소셜만 기존 웹뷰 유지.
- **흐름**: 앱 폼 → `POST /auth/ihome-login {mbId,password}` → API가 `{mb_id,ts}` HMAC 서명한 요청으로 **카페24 `verify.php`** 호출(서버-투-서버, 호출자 인증→공개 비번 오라클 아님) → verify.php 가 그누보드 `check_password`/`login_password_check` + `st_tp==1`·차단·탈퇴·메일인증 체크 후 sso.php 와 동일 서명신원 반환 → API `ihomeLogin()` 재검증+페더레이션 → JWT.
- **신규 파일**: `ihomemarket/doublewin/verify.php`(sso_config.php 시크릿 재사용), API `ihomePasswordLogin`+`@Post('ihome-login')`(throttle 10/min, IHOME_VERIFY_URL 기본값 하드코딩—env 불요), 모바일 `login.tsx`(네이티브 폼+소셜 웹뷰 분리)/`api/auth.ts`/`AuthContext.tsx`.
- **검증**: verify.php 단독(정답200/오답·변조서명401), API `/auth/ihome-login`(정답200+JWT/오답401), 에뮬 E2E(네이티브 폼 입력→**웹뷰 안 열림**→홈 "더블윈테스트님"). EC2 재배포 + verify.php FTP 업로드 완료. 새 APK 11:09 빌드 후 17:xx 재빌드.
- 함정: release 빌드 API_URL=`api.doublewin.co.kr`(→ EC2). 신규 엔드포인트는 같은 컨테이너라 도메인으로도 접근됨.

## 네이티브 소셜 로그인 — 카카오 (진행중, 2026-06-01)
모델 A(아이홈마켓 회원 통합) 채택. **백엔드 완료·배포·커밋 `9e1475f`, 앱 SDK 통합은 카카오 네이티브 앱키 대기.**
- **아이홈마켓 소셜 = 그누보드5 빌트인**(`plugin/social`, HybridAuth). 매핑 테이블 `g5_member_social_profiles(provider, identifier→mb_id)`. 카카오 identifier=카카오 회원번호(앱 스코프). 키: g5_config `cf_kakao_rest_key`/`cf_kakao_js_apikey` (값은 계정.md).
- **통합 원리**: 앱 네이티브 카카오가 **웹과 같은 카카오 앱**의 네이티브 앱키를 쓰면 identifier 동일 → 같은 회원. 그래서 새 앱 만들지 말고 기존 앱에 Android 플랫폼만 추가.
- **신규 백엔드**: `social_verify.php`(앱 access token → kapi.kakao.com /v1 access_token_info(app_id 검사, DW_KAKAO_APP_ID 정의시) + /v2 user/me → social_profiles 조회/없으면 회원+매핑 자동생성 st_tp=1 → 서명신원), API `ihomeSocialLogin`+`POST /auth/ihome-social`. 둘 다 verify.php 패턴(요청 HMAC+ihomeLogin 재사용).
- **검증됨**: 가짜토큰→카카오 거부 401, 미지원 provider 차단. happy-path는 앱 통합 후.
- **사용자 액션 대기**: 카카오 콘솔(계정.md 카카오 mvcorp.top@gmail.com 가능성)에서 Android 등록(`com.doublewin.app`+키해시 `Cgpan8EwMeLYKxVSdEEDZ6LXAZI=`) + **네이티브 앱키·앱ID** 제공.
- 키스토어/지문: [[reference-android-release-keystore]]. **키해시 재검증 완료(2026-06-05)**: 릴리스 키스토어 SHA-1=`0A:0A:5A:9F:C1:30:31:E2:D8:2B:15:52:74:41:03:67:A2:D7:01:92` → base64 = `Cgpan8EwMeLYKxVSdEEDZ6LXAZI=` 일치.

### 앱-측 SDK 통합 — 완료·tsc 통과·미커밋 (2026-06-05)
네이티브 앱키만 있으면 빌드·E2E 가능한 상태까지 진행. **미커밋(키+E2E 후 커밋 예정)**.
- `npx expo install @react-native-seoul/kakao-login`(5.4.2) — package.json + app.json plugins 에 config plugin 자동추가.
- 신규 `src/lib/kakao-native.ts`: `loginWithKakaoNative()` → SDK `login()` → `accessToken` 반환(취소는 `KAKAO_CANCELLED` 표준메시지).
- `src/api/auth.ts` `ihomeSocialLogin(provider, accessToken)` → `POST /auth/ihome-social`(token→setToken). `AuthContext` 에 배선(interface/default/handler/value).
- `app/auth/login.tsx`: 노란 **카카오 네이티브 버튼**(handleKakaoLogin) 추가 + 기존 웹뷰 버튼은 "네이버·구글로 로그인"으로 분리.
- `app.json` plugin: `["@react-native-seoul/kakao-login", { kakaoAppKey: "REPLACE_WITH_KAKAO_NATIVE_APP_KEY" }]` — **키 도착 시 이 값만 교체**.
- 백엔드 앱ID(`DW_KAKAO_APP_ID`)는 social_verify.php 에서 **선택**(정의 시만 app_id 강제일치). 없어도 happy-path 동작, 보안상 cafe24 sso_config.php 에 추가 권장.

### ⚠️ 카카오 콘솔 에뮬 자동화 실패 (2026-06-05) — 재시도 금지
사용자 "직접 발급해서 넣어" 요청으로 에뮬 Chrome 으로 developers.kakao.com→accounts.kakao.com 로그인 시도. 이메일 입력·버튼 탭은 됐으나 **비밀번호 input 이 adb `input tap` 으로 포커스 안 됨**(탭해도 소프트키보드 안 뜨고, 이어친 텍스트가 이메일칸으로 흘러 병합). keyboard-up 상태 탭/TAB(keyevent61)/no-keyboard 탭 전부 실패(13회). accounts.kakao.com 의 비번 필드 안티자동화로 판단. **에뮬 자동화로 카카오 콘솔 로그인 통과는 포기** — 사용자가 본인 기기에서 콘솔 작업(Android플랫폼 등록+네이티브앱키 복사)하는 게 유일 현실 경로. (방법2: 에뮬에서 사용자가 비번+2FA만 직접 입력 후 이어가기 — 단 콘솔 SPA 네비도 탭 까다로움)

### ✅ 카카오 콘솔 작업 완료 (2026-06-05) — 네이티브 앱키 확보 + Android 등록
에뮬 Chrome 으로 콘솔 완료(API36 Pixel_3a 에선 비번 입력 됨 — Pixel_7 과 달리). **앱="아이홈마켓"**(REST키 a8c185f6… 일치 확인). 앱 설정→앱→플랫폼 키→네이티브 앱 키 카드 탭→"네이티브 앱 키 수정"에서:
- **네이티브 앱 키 = `7822ff27784b8d9481ac9540c79e6d73`** (Default LEGACY_NATIVE_APP_KEY) → **app.json `kakaoAppKey` 에 반영 완료**.
- Android 앱 정보: 패키지명 `com.doublewin.app` + 키해시 `Cgpan8EwMeLYKxVSdEEDZ6LXAZI=` 입력 후 저장 → 카드에 "Android 패키지"·"Android 키 해시" 칩 생성(등록확정). 스킴 `kakao7822ff27784b8d9481ac9540c79e6d73`.
- ⚠️ **앱 ID(숫자) 미취득** — DW_KAKAO_APP_ID 는 선택(없어도 동작)이라 스킵. 필요시 콘솔 일반/URL 에서.
- 콘솔 네비 함정: 신규 콘솔은 "플랫폼" 메뉴 없음 → 플랫폼 등록은 **플랫폼 키 > 네이티브 앱 키 카드 탭 > 수정 페이지**의 Android 앱 정보 섹션. 입력란 포커스는 정확한 full-res y좌표 필요(헤더 위 빈공간 탭 주의).

### 키 도착 후 남은 단계 (순서)
1. app.json 의 `kakaoAppKey` 를 네이티브 앱키로 교체.
2. ⚠️ **prebuild 주의**: `android/` 는 prebuild 생성물인데 **수동 keystore 배선**(doublewin-release.keystore+keystore.properties+build.gradle signingConfig)이 들어있음 → `expo prebuild` 재실행 시 그 배선 유실 위험. config plugin 동작(withAndroidKakaoLogin.js: AuthCodeHandlerActivity scheme `kakao{key}` + strings.xml `kakao_app_key` + 카카오 maven repo)을 **기존 android/ 에 수동 적용**하거나, prebuild 후 keystore 배선 재적용([[reference-android-release-keystore]] build.gradle 섹션) 중 택1.
3. (선택) cafe24 sso_config.php 에 `define('DW_KAKAO_APP_ID', '<앱ID>')` 추가.
4. release APK 재빌드 → 에뮬 설치 → 카카오 버튼 E2E(카카오 로그인→accessToken→/auth/ihome-social→홈 로그인) → 커밋.

## 네이티브 소셜 — 네이버·구글 (2026-06-08, 코드 완료·커밋, 빌드/E2E는 콘솔 등록 대기)
카카오와 동일 모델 A. **백엔드+모바일 코드 전부 커밋. 빌드/E2E 는 OAuth 콘솔 등록 후.**
- **g5_config 키 확보**(실값은 `.work-ihomemarket/social_inspect3.json` 또는 EC2 `.env` 참조 — 레포엔 비커밋): 네이버 clientid `bgm8…`/secret `‹REDACTED›`, 구글 clientid `726584045345-…apps.googleusercontent.com`(프로젝트 726584045345)/secret `GOCSPX-‹REDACTED›`.
- **identifier 저장방식**(계정통합 매칭키): 네이버=`response.id`(앱스코프→동일 네이버앱 필수), 구글=`sub`(계정 전역고정→어떤 클라이언트든 동일, idToken aud만 우리 클라이언트와 일치하면 됨). 기존 매핑: google 1(sub 21자리 114…035), kakao 1.
- **백엔드 `social_verify.php` 멀티프로바이더화 (commit `50b6328`, 카페24 배포·스모크검증)**: 카카오/네이버/구글 분기. 네이버=nid/me, 구글=tokeninfo(iss+aud=cf_google_clientid 검사). 회원자동생성 프리픽스 kko/nv/ggl. 가짜토큰→각 프로바이더 401 + 카카오 회귀 확인. API ihomeSocialLogin 은 provider 무관이라 무변경(EC2 재배포 불요).
- **모바일 (commit `6ec11af`)**: deps `@react-native-seoul/naver-login`4.2.4 + `@react-native-google-signin/google-signin`16.1.2. `src/lib/naver-native.ts`(initialize{consumerKey/secret/appName}→login→accessToken), `src/lib/google-native.ts`(configure{webClientId}→signIn→idToken). login.tsx 공용 runSocial 핸들러 + 네이버(초록)/구글(흰) 버튼, 기존 웹뷰 소셜버튼 제거. app.json plugin(naver urlScheme / google iosUrlScheme—iOS용 placeholder). tsc + expo config introspect 통과.
- **빌드 함정 회피 호재**: 두 모듈 다 android build.gradle 에서 mavenCentral()로 의존성 자체선언(naver `com.navercorp.nid:oauth`, google `play-services-auth`) + plugin은 iOS만 건드림 → **kakao 와 달리 커스텀 maven repo/수동 manifest 불요, autolinking 만으로 prebuild 없이 빌드 가능**. ✅ **release 빌드 성공(Jun8 11:20 APK, 95MB)**, prebuild/수동 android 작업 0.
- **✅ SDK 레벨 E2E 검증 완료 (2026-06-08, Pixel_3a, release APK)**: 로그아웃→로그인화면에 카카오/네이버/구글 버튼 3개 렌더. **구글 버튼**→구글 네이티브 Play Services 로그인 플로우 진입(`MinuteMaidFragment`, "Checking info…"/계정추가)=SDK 배선 정상(에뮬에 구글계정 없어 멈춤). **네이버 버튼**→`NidOAuthBridgeActivity`→커스텀탭 `nid.naver.com` 우리앱("아이홈마켓")으로 열림→**"Unable to log in to 아이홈마켓 (admin이면 해결방법 보기)" = Android 패키지 미등록 에러**(통합 정확·콘솔등록만 남음을 입증). 스크린샷 `_verify_checkout/social_05~10`. 앱 크래시 없음.
- **🔴 남은 외부 의존 (콘솔 등록)**:
  1. **구글**: 프로젝트 726584045345 에 Android OAuth 클라이언트 생성(패키지 `com.doublewin.app` + 릴리스 SHA-1 `0A:0A:5A:9F:C1:30:31:E2:D8:2B:15:52:74:41:03:67:A2:D7:01:92`). 구글계정 `mvcorp.top@gmail.com`/`mma7792@` 보유 → 가능(2FA 변수). webClientId 는 기존 웹클라(코드 반영됨). consent screen 기존 동작중.
  2. **네이버**: 앱 `bgm8…` 에 Android 사용환경 추가(패키지 `com.doublewin.app`+다운로드URL). **⚠️ 계정.md 에 네이버 개발자계정 없음 → 하드블로커**(누가 이 네이버앱을 소유하는지 불명, 새 네이버앱 만들면 identifier 달라져 통합 깨짐). 사용자 네이버 로그인정보 필요.
- **콘솔 등록 후 남은 단계**: 구글 app.json `iosUrlScheme` 는 iOS만 필요(안드 무관). release APK 재빌드(이미 코드 커밋) → 에뮬 설치 → 네이버/구글 버튼 E2E → 검증 스크린샷 → (선택) 잔여물 정리.

## 관련
- [[project-ihomemarket]] · [[project-ihome-doublewin-sync]](HMAC채널 원조) · [[reference-cafe24-workflow]](FTP/계정.md) · [[reference-aws-deploy-workflow]] · [[feedback-typeorm-nullable-union]]
- 함정: 카페24 FTP PW/EC2 시크릿은 **커맨드라인 평문 노출 금지**(분류기 차단) → 파일에서 읽어 env/var로. 한글파일명(계정.md)은 stdin파이프서 깨짐 → PowerShell이 읽어 전달.
