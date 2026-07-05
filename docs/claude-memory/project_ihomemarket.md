---
name: project-ihomemarket
description: 아이홈마켓(i-homemarket.co.kr) 카페24 호스팅 사이트 — 영카트5(그누보드5) 기반 쇼핑몰. CEN 디렉터리에서 같이 만지는 별도 프로젝트.
metadata: 
  node_type: memory
  type: project
  originSessionId: 3579b306-8659-45d1-976a-93d94f278552
---

i-homemarket.co.kr는 카페24 호스팅 위에 돌아가는 **영카트5(그누보드5) PHP 쇼핑몰**. CEN 작업 폴더(DoubleWin과는 무관)에서 같이 만지는 별도 프로젝트.

**Why:** 사용자가 동일 워크스테이션의 CEN 폴더에서 i-homemarket 유지보수도 한다. DoubleWin 코드와 섞이지 않도록 의식해야 함.

**How to apply:**
- 작업 파일은 `CEN/.work-ihomemarket/`에 격리 (로컬 다운로드, 진단 스크립트, 스키마 JSON 등)
- 자격증명은 `CEN/계정.md`에 평문 저장됨 (OneDrive 동기화 중) — 사용자에게 시크릿 매니저 이관 권한 (한 번 이상 알림)
- DoubleWin 코드(`apps/admin`, `apps/api`, `apps/mobile`)와 i-homemarket 코드를 절대 같은 PR/커밋으로 묶지 말 것

## 사이트 구조 (관찰 2026-05-26)

- 호스팅: 카페24, 도메인 i-homemarket.co.kr
- 스택: 영카트5 + 그누보드5 (PHP + MariaDB 10.1.13)
- 외부 IP: `106.246.230.74` (호스팅 서버, 웹·DB 동일 IP)
- 웹루트: `/www` (FTP 로그인 시 자동 진입)
- 주요 디렉터리: `adm/` 관리자, `shop/` 쇼핑 프론트, `bbs/` 게시판, `skin/` `theme/` 스킨/테마, `data/` 설정·업로드, `mobile/` 모바일 스킨
- 커스텀 흔적: `g1_banner` / `g1_store` / `g1_today_view` 테이블 + `adm/a_banner.*`, `adm/a_store.*` — 기본 영카트 외에 자체 배너/매장 관리 추가됨

## DB

- 위치: `localhost` (외부에서 직접 mysql 접속은 IP 화이트리스트로 차단됨)
- DB명/사용자: `mvcorp1`
- 테이블 69개: g5_ 코어 30, g5_shop_ 24, g5_write_ 게시판 4, g1_/sms5_ 등 기타 11
- 주요 데이터 규모(스냅샷): `g5_shop_item` 652 / `g5_shop_order` 106 / `g5_member` 22 / `g5_shop_cart` 113
- 스키마 풀 덤프: `.work-ihomemarket/db_schema.json`, 요약: `db_schema_summary.md`

## 관련

- [[reference-cafe24-workflow]] — FTP/DB 접속 절차 + 외부 IP 화이트리스트 등록법
- [[feedback-no-questions-just-do]] — 사용자는 묻기보다 일단 진행하길 선호
