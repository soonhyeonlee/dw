---
name: reference-cafe24-workflow
description: "카페24 호스팅(i-homemarket) 작업 SOP — FTP는 그대로 됨, MySQL 외부접속은 화이트리스트 필요, 우회는 일회용 PHP 진단 스크립트"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 3579b306-8659-45d1-976a-93d94f278552
---

카페24 호스팅(현재 [[project-ihomemarket]]) 작업할 때 따라가는 절차.

## 자격증명

`CEN/계정.md`에서 읽되 **세션 환경변수로만** 전달, 커맨드라인에 평문 노출 금지:

```powershell
$env:FTP_USER = "mvcorp1"
$env:FTP_PASS = "Meta7792@!"     # 카페24 FTP PW
$env:DB_USER  = "mvcorp1"
$env:DB_NAME  = "mvcorp1"
$env:DB_PASS  = "zxyDzNcPB!@Tg2G" # 카페24 DB PW
```

⚠️ 각 PowerShell 호출은 새 셸 — env가 휘발한다. 같은 호출 안에서 `$env:... = ...; python ...` 형식으로 묶을 것.

## FTP

- Host: `i-homemarket.co.kr:21` (standard FTP, FTPS는 미사용)
- 로그인 후 작업 디렉터리 = `/www`
- Python 내장 `ftplib.FTP` 사용 (자격증명을 커맨드라인에 노출 안 함). `psftp.exe`도 있음.
- 다운로드 헬퍼: `.work-ihomemarket/snapshot_tree.py` (트리 스냅샷 + config 다운로드)

## MySQL — 외부 직접접속

기본적으로 **차단**됨. 시도하면:
- `mvcorp1.cafe24.com:3306` 등: timeout(10060)
- `i-homemarket.co.kr:3306`: `ERROR 1130: Host '<IP>' is not allowed to connect` — DB는 응답하지만 화이트리스트 차단

**Why:** 카페24는 보안상 외부 MySQL 접속을 기본 차단. 사용자 IP를 매니저에서 허용해야 풀림.

**How to apply (영구 해결):**
1. 카페24 호스팅 매니저 → "MySQL 관리" → "외부접속 허용"
2. 현재 사용자 외부 IP `106.246.230.74` 추가 (변동 시 다시 갱신)
3. 이후 `mysql -h i-homemarket.co.kr -u mvcorp1 mvcorp1`로 직접 접속

## MySQL — 우회 (화이트리스트 없이 즉시 작업)

서버에서 PHP가 실행되므로 일회용 진단 스크립트로 우회 가능. **반드시** 다음 안전장치 모두 적용:

1. `secrets.token_hex(32)`로 1회용 토큰 발급, `hash_equals`로 검증 (타이밍 공격 방지)
2. 랜덤 파일명 (`_diag_<8hex>.php`)
3. 사용 직후 FTP `delete` 호출 — 실패하면 **반드시** 사용자에게 즉시 알림
4. JSON으로만 출력, 결과는 `.work-ihomemarket/`에 저장
5. 작업 완료 후 `nlst`로 `_diag_*` 잔존 파일 검증

참조 구현: `.work-ihomemarket/db_inspect.py`. 같은 패턴으로 schema/data dump, 쿼리 실행, mysqldump 등 확장 가능.

## 사용자 외부 IP

작업 시점(2026-05-26): `106.246.230.74`. ISP 변경/이동 시 달라질 수 있음 — `Invoke-RestMethod ifconfig.me/ip`로 재확인.

## 관련

- [[project-ihomemarket]] — 이 절차가 적용되는 사이트
- [[feedback-figma-workflow]] — 또 다른 외부 시스템 워크플로우 예
