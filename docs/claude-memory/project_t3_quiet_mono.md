---
name: project-t3-quiet-mono
description: "앱 전면 디자인 시안 \"T3 Quiet Mono\"(Toss 화이트+코랄) 채택·코드반영. 어제(2026-06-08) 사용자가 고른 03번 시안의 정체와 적용 범위."
metadata: 
  node_type: memory
  type: project
  originSessionId: a796cdb0-4b56-4349-8819-4c3dafbfa6db
---

**확정 디자인 = "T3 Quiet Mono · Toss 화이트 + 코랄 + 큰 여백 모던"** (accent 코랄 `#F0410E`, 페이지 배경 `#F6F7F9`, 화이트 라운드 카드 + 소프트 그림자).

## 시안 히스토리 (혼동 주의)
- 2026-06-08 세션(job `640fd2bb`)에서 사용자가 "레이아웃 변경 말고 이쁘고 심플 고급" 시안 요청 → **1차 A/B/C**(`login_A` 미니멀화이트 / `login_B` 프리미엄다크 / `login_C` 소프트그라데이션카드) → 여러 차례 고도화 → **2차 T2~T5 + P1~P3** 갤러리.
- 최종 선택: **"03 Quiet Mono"** = 파일상 **`login_T3.html`**(태그 "T3 · QUIET MONO v2"). 지시: **"03번 시안으로 마이페이지까지 만들고 코드에 반영"**.
- ⚠️ **`login_C`(소프트 그라데이션 카드)는 1차에서 버려진 안.** "3번"을 login_C로 착각하기 쉬움(A/B/C의 3번 vs T3의 03). 실제 채택은 T3 Quiet Mono. 시안 HTML 원본: `C:\Users\sangw\.claude\jobs\640fd2bb\tmp\{login,mypage,home,product}_T3.html`.

## 코드 반영 상태 (2026-06-09)
- `app/auth/login.tsx` — T3 그대로 (어제 반영, 주석 "Scheme 03 (Quiet Mono)"). **이게 정답**, 되돌리지 말 것.
- `src/constants/theme.ts` — BRAND.primary 주황 `#FF6B35`→코랄 `#F0410E` 전환(전 화면 액센트 일괄) + `export const QM` 토큰(coral/coralGrad/pageBg/card/ink/sub/hairline/cardShadow) 추가.
- `app/(tabs)/mypage.tsx` — 라이트그레이 배경 + 화이트 카드화(프로필/등급/캐시백 히어로 화이트(구 검정카드)/퀵메뉴 타일/설정 카드). 로직 보존.
- `app/(tabs)/index.tsx`(home) — 주황 그라데이션 히어로 제거 → 화이트 그리팅 + 화이트 캐시백 히어로 카드. 폴더탭/딜/추천 등 기존 섹션 보존.
- `app/market/[id].tsx`(product) — 보라 `#6633CC`→코랄, 화이트 인포카드 + "구매 시 N P 적립(2%)" 코랄 필 + 코랄 구매바.
- tsc clean. 빌드/에뮬검증/커밋은 [[project-session-2026-06-01]] 흐름대로.

## 전 화면 확장 완료 (2026-06-09, commit `306dfe4`, 29 files)
잔여 모든 화면을 T3로 통일(병렬 에이전트 7그룹). 탭(categories·coupons·search·cashback·region) + 마켓플로우(index·checkout·orders·order/[id]·search, 보라#6633CC→코랄) + 제휴(product/[id]·mall·region/[id]·홈Market/RegionContent) + 캐시백(cashback·withdraw·activate, 검정잔액카드→화이트+코랄) + 마이하위(profile·change-password·bank-account·recent·wishlist) + 기타(notifications·guide·help·settings). semantic·브랜드색 보존. tsc통과, 에뮬 categories/coupons/notifications 검증. **앱 전체가 Quiet Mono 일관 적용됨.**
- 직전 커밋 `adb53af`(login·home·mypage·product·theme) 다음.

## 카테고리 개편 + brand 백엔드 (2026-06-09~10, commit `93fceb9`)
- **모바일 categories**: ScrollView→FlatList 가상화+무한스크롤(렉 해결), 상품 대형 배너(한 줄 하나), **인라인**(선택 시 새 페이지 아님—타일 아래 같은 페이지에 표시. ⚠️사용자가 "새 페이지로 넘기지 말라" 강조), 전체보기 제거, **경유사·회사 네비 칩바**(클릭 시 해당 회사 필터), 그룹 헤더 `[경유사] 회사 N개`, **맨위로 FAB**. 회사(brand)=API brand 우선 없으면 **제목 첫 단어 폴백**.
- **백엔드 brand**: product.entity `brand varchar(120)` + ihome-sync `it_maker`→brand. **단 it_maker가 이 쇼핑몰엔 461개중 빈값352/"상품 상세설명에 표시"108/실브랜드1("더바른")** → 플레이스홀더·빈값 null 처리(`!makerRaw.includes('상세설명')`). **결론: it_maker 거의 무용, 제목 추출 휴리스틱이 실질 브랜드 소스**(테팔/대동고려삼/홍나인/닥터지/다이슨 등 잘 동작).
- **배포 완료**: 카페24 sync.php FTP(slug `udza6nvy0s1w`, SELECT에 it_maker) + EC2 API 재빌드 + RDS `ALTER products ADD brand`(synchronize off) + 커서 리셋 후 풀 재동기화(fetched=461). 
- **부수 수정**: 풀 재동기화가 **기존 버그** 노출 — `market_products.rating` NOT NULL인데 평점없는 상품 null 입력 실패 → 미러 upsert `rating: next.rating ?? 0` 보정.
- **⚠️ EC2 디스크 100%**(빌드캐시 7.9G+댕글링4G+백업11개) → `docker system prune -af` + 오래된 `.apps.bak.*` 삭제로 12.6G 확보. 배포 전 `df -h` 확인 습관.

관련: [[project-session-2026-06-01]] · [[reference-aws-deploy-workflow]] · [[reference-cafe24-workflow]] · [[feedback-no-questions-just-do]] · [[feedback-rn-sticky-flex-break]]
