---
name: 2026-05-28
description: "미커밋 4건 정리 → 아이홈마켓 sync 구축 → APK 빌드/에뮬 검증까지 8 commits 완료. 다음 세션 \"이어서\" 진입점."
metadata: 
  node_type: memory
  type: project
  originSessionId: 50b3afbe-31cc-499b-94c1-e7233c56af38
---

**Why:** 사용자가 "지금까지 작업 히스토리 저장해줘 다음에 이어서 개발하자고하면 이어서 진행해줘" 요청. 다음 세션이 이 문서 한 장으로 현재 상태 파악 + 다음 액션 결정 가능하도록.

**How to apply:** 다음 세션 시작 시 사용자가 "이어서", "계속", "어디까지 했어" 등을 말하면 이 문서를 먼저 읽고, 아래 "다음 액션 후보"에서 선택해 바로 진행. 4지선다 묻지 말 것 ([[feedback-no-questions-just-do]]).

## 현재 상태 (2026-05-28 끝 시점)

- **git**: main 브랜치 clean, 모든 작업 commit됨. GitHub remote 없음 (직접 EC2 배포 워크플로우 사용 [[reference-aws-deploy-workflow]])
- **EC2**: doublewin-api/admin/crawler 모두 정상 가동. sync cron 10분 주기로 영카트 → RDS 자동 sync 중
- **RDS**: ihomemarket 455 + 기타 platform 15 = 총 470 products
- **모바일 최신 APK**: `doublewin-05.28.apk` (루트, 89MB) — Phase 1/4/5 UI + AI배너/몰로고 + 학원·쿠폰 어드민 + 번개장터 ihomemarket sync 모두 반영. 에뮬에서 시각 검증 완료

## 이번 세션 8 commits (4a46019 이후)

```
852c596 chore(gitignore): exclude _verify/ screenshots and gradle build logs
4f256dc feat(mobile): market tab shows only ihomemarket items with youngcart categories
985fe2d feat: products findAll accepts CSV platform list; market tab shows ihomemarket
e81c903 feat(api): ihomemarket → DoubleWin product sync via signed PHP endpoint
7e4ec8d feat: admin CRUD for academies/coupons + mobile region API integration
d1d4be7 feat(mobile): Notion-spec redesign — bottom nav, home folder tabs, categories, cashback labels
49ccb06 feat(mobile): bundle AI promo banners + real mall logos as static assets
da4ccb1 chore(gitignore): exclude local agent state, sibling projects, and secrets
```

### Block A: 미커밋 정리 (da4ccb1 ~ 7e4ec8d)
이전 세션들에서 EC2까지 배포·검증했지만 로컬 git이 미커밋이던 작업을 4개 의미 단위로 정리. 자세한 내용은 [[project-ui-ref-pass]] 참고.

### Block B: 아이홈마켓 sync (e81c903 ~ 4f256dc)
사용자가 "DB를 아이홈마켓과 동일하게 사용 + 너가 직접 다 할 수 있는 방향으로"를 요청. 카페24 MySQL 외부 화이트리스트 등록(=사용자 액션)을 피하기 위해 카페24 PHP 우회 + EC2 cron으로 read-only sync 구축. 자세한 내용은 [[project-ihome-doublewin-sync]] 참고.
- 번개장터 탭은 **ihomemarket 단일 노출**로 확정 (사용자 지시). 영카트 카테고리 그대로 표시
- 에뮬 검증: 식품 47개 / 과일 20개 등 필터링 + 카페24 이미지 정상 로드

### Block C: APK 빌드 + 정리 (gradle assembleRelease + 852c596)
- `apps/mobile/android/`에서 `gradlew :app:assembleRelease`, 2분 6초, 한 번에 성공
- 빌드 산출물 → `doublewin-05.28.apk`
- 에뮬 `Pixel_7_Pro_API_30` (1080x2220)에서 deep link `doublewin://market`로 진입, 시각 검증 완료
- `_verify/`, `gradle-build*.log` gitignore 추가

## 다음 액션 후보 (우선순위 순)

1. **회원/주문 sync 추가** — 현재는 g5_shop_item만. g5_member / g5_shop_order는 별도 결정 필요(UUID vs mb_id 충돌). 진행 전 사용자 의도(회원 통합? 주문 노출만? 양방향?) 확인
2. **카페24 매니저에서 EC2 IP 화이트리스트 등록** → sync 폐기하고 DB 직접 연결로 업그레이드 가능. 사용자 액션 필요. 이걸 하면 [[reference-cafe24-workflow]]대로 mysql 직접 접속
3. **위메프 어드민 logoUrl 지원** — [[project-ui-ref-pass]] 미해결 사항. Mall 엔티티 + 어드민 페이지 추가만
4. **쿠폰 화면 스펙** — 사용자가 "대기"로 둔 상태. 스펙이 있는지 먼저 확인
5. **카카오 로그인 / iOS 빌드** — 사용자가 미결정/예정으로 둔 항목

## 운영 정보 빠른 참조

- **EC2**: ec2-user@54.238.64.159, key `~/.ssh/doublewin-key.pem` (사용 전 ACL 보정 — [[reference-aws-deploy-workflow]])
- **RDS**: PostgreSQL, host는 EC2 .env에. 직접 SQL은 `sudo docker exec -i doublewin-api node -` stdin 패턴
- **카페24 FTP/DB**: `계정.md` 평문, 환경변수로만 전달 ([[reference-cafe24-workflow]])
- **sync 엔드포인트**: `https://i-homemarket.co.kr/api_sync/udza6nvy0s1w/sync.php`, 시크릿+URL은 `.work-ihomemarket/sync/.secret.local.json` (gitignored)
- **AVD**: `Pixel_7_Pro_API_30`, 1080x2220, deep link `doublewin://market` 등 ([[reference-emulator-workflow]])

## 함정 / 회피 패턴 (이번 세션에서 배운 것)

- **PowerShell `tee -a` BOM 함정** — `$str | ssh "sudo tee -a .env"` 패턴은 UTF-16 BOM 첨가로 docker compose 파싱 실패. ASCII 인코딩 임시 파일 + scp + `cat | sudo tee` 패턴 사용 ([[project-ihome-doublewin-sync]] 운영 메모 1)
- **docker-compose environment 명시** — `.env` 추가만으로는 컨테이너에 전달 안 됨. compose 파일의 `environment:` 블록에도 `KEY: ${KEY}` 매핑 추가 필요
- **PHP `http_build_query` vs Node `encodeURIComponent`** — RFC 1738(space=+) vs RFC 3986(%20). HMAC signing 시 한쪽으로 통일. Node는 `URLSearchParams` 사용해야 PHP/Python과 정합
- **첫 페이지 캡처 + 이미지 로드** — emulator에서 deep link 직후 캡처는 placeholder만 나옴. 5~10초 더 기다린 후 캡처
- **SQL 결과 truncate** — `slice(0,80)` 같은 디버그 출력이 imageUrl `.jpg` 확장자를 잘라 "확장자 없음" 오진을 유발. 데이터 검증 시 전체 길이 출력하거나 정확한 컬럼명으로 확인

## 관련 메모리

- [[project-ihome-doublewin-sync]] — sync 아키텍처 풀 상세
- [[project-ui-ref-pass]] — Phase 1/2/4/5 + 어드민화 작업 상세
- [[project-ihomemarket]] — 카페24 사이트 자체 정보
- [[reference-cafe24-workflow]] — FTP/DB SOP
- [[reference-aws-deploy-workflow]] — EC2 배포 절차
- [[reference-emulator-workflow]] — 에뮬 + ADB
- [[feedback-no-questions-just-do]] — 4지선다 confirmation 금지
