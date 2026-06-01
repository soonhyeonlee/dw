# 아이홈마켓(카페24 그누보드5/영카트5) 측 더블윈 연동 PHP

이 폴더는 카페24에 **직접 업로드**되는 PHP의 버전관리용 사본이다. (카페24 사이트 자체는 이 레포가 아님 — FTP로 배포.)

## doublewin/sso.php — 계정 공유 SSO 브리지
더블윈 앱 ↔ 아이홈마켓 계정 공유. 앱이 웹뷰로 열면 그누보드 로그인(카카오/네이버/구글/아이디)을 거친 뒤 HMAC 서명된 신원 정보를 `doublewin://auth` 딥링크로 돌려준다.

### 배포 (FTP)
1. 카페24 FTP 접속 (SOP: 메모리 `reference-cafe24-workflow`). 작업 루트 `/www`.
2. `/www/doublewin/` 디렉터리 생성.
3. 업로드:
   - `doublewin/sso.php`
   - `doublewin/sso_config.php` ← `sso_config.sample.php` 를 복사해 **`DW_SSO_SECRET` 을 EC2 `.env` 의 `IHOME_SYNC_SECRET` 과 동일 값으로** 채운 것. (이 파일은 git 미트래킹)
4. 확인: 브라우저로 `https://i-homemarket.co.kr/doublewin/sso.php?redirect=doublewin://auth`
   - 비로그인 → 그누보드 로그인 페이지로 이동
   - 로그인 상태 → `doublewin://auth?mb_id=..&email=..&nick=..&ts=..&sig=..` 로 리다이렉트(브라우저 주소창/네트워크 탭에서 확인)

### 경로 가정 확인 필요
- `sso.php` 는 `dirname(__DIR__).'/common.php'` (= `/www/common.php`) 를 include 한다.
  그누보드 루트가 `/www` 가 아니면 include 경로를 실제 루트에 맞게 조정.
- `G5_BBS_URL`, `$member['mb_id'/'mb_email'/'mb_nick']` 는 그누보드5 표준. 영카트 커스텀 시 필드명 확인.

### 서명 규칙 (더블윈 API와 일치해야 함)
- 서명 대상: `{email, mb_id, ts}` (ASCII만 — 닉네임 제외)
- 키 오름차순 정렬 → `http_build_query` → `hash_hmac('sha256', $qs, DW_SSO_SECRET)` hex
- API 측 동일 구현: `apps/api/src/auth/auth.service.ts` 의 `_ihomeSign` / `ihomeLogin`
