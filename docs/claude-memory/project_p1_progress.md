---
name: P1~P3 ShopBack 시각 리디자인 완료 (2026-05-06)
description: P1+P2+P3 모든 작업 완료, 에뮬 검증 통과. 4개 commit (cfcfd38/0960c8b/26fea02/df48354)
type: project
originSessionId: 101eed50-9ca5-4474-8530-3a50970ab56d
---
ShopBack 패턴을 DoubleWin 브랜드(#FF6B35) + DW 콘텐츠 위에 입히는 전체 리디자인 마무리.

**Why:** 사용자가 "지금 디자인이 하나도 샵백과 동일하게 변경되지 않았는데?" 지적 → 갭 분석 → P1/P2/P3 우선순위 합의. 재부팅으로 .git이 두 번 손실된 이력이 있어 진행 사항을 메모리에 영구 보관.

**How to apply:** 다음 세션에서 새 작업 들어올 때, 이 메모리를 먼저 읽고 마지막 commit `df48354` 기준으로 어디에 추가/수정해야 하는지 파악.

## 커밋 이력 (main branch)
- `cfcfd38` initial — 277 files (작업 트리 복구)
- `0960c8b` P1 — orange hero / PromoCarousel / MallCard 표준 컴포넌트
- `26fea02` P2 — 세그먼트탭 / 빠른액션 칩 / 몰상세 hero collage / 카테고리별 캐시백률 테이블 / 일자별 캐시백 그리드
- `df48354` P3 — 몰상세 참고사항 카드 + "더 많은 세일·쿠폰" pill
- `ca87673` P4 — 게스트 hero CTA / chip pill 스타일 / 일자별 큰 mall 카드 row / 캐시백·마이 게스트 화면 보강 / Tab 헤더 중복 버그(headerShown:false) 수정

## 핵심 신규 컴포넌트
- `apps/mobile/src/components/PromoCarousel.tsx` — slides[] prop, auto-advance 4.5s
- `apps/mobile/src/components/MallCard.tsx` — variant: 'home' | 'category' | 'search'

## 데이터 의존 항목 (EC2 재배포 후 자동 활성화)
- mall.previousCashbackRate → MallCard에 취소선
- mall.promoBadge ('time_deal' | 'rate_up' | 'welcome') → 좌상단 배지
- mall.promoEndsAt → countdown ("N시간 후 종료")
- mall.category → 홈 세그먼트 탭 카테고리 필터링

## 인프라
- RDS malls 테이블 4 컬럼 + IDX_malls_category 추가됨 (직접 ALTER)
- EC2 API 컨테이너 재배포는 사용자 SSH 행동 필요 (synchronize=false)
- GitHub remote 미설정 (push는 사용자가 repo 만든 뒤 직접 수행)

## DoubleWin 고유 요소 (보존)
- 가이드 배너 (홈 hero 아래)
- 캐시백 타임라인 3단계 (몰 상세)
- 인기 검색어 1~7 (검색)
- 협회/파트너/일반 3단계 회원 (PromoCarousel slide)
- 모든 CTA 오렌지 (검정 대신)
