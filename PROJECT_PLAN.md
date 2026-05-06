# DoubleWin(더블윈) 프로젝트 인계서

## 1. 프로젝트 개요
- **더블윈(DoubleWin)**: 캐시백/경유 쇼핑 플랫폼
- 쿠팡/네이버/11번가 등을 경유하여 어필리에이트 수수료를 받고, 일부를 사용자에게 캐시백
- 포인트 적립 → 설정 가능한 최소 금액(기본 5,000원) 이상 시 현금 출금

## 2. 기술 스택
| 레이어 | 기술 | 상태 |
|--------|------|------|
| 모바일 | React Native (Expo 55) | UI 완성, API 연동 미완 |
| 백엔드 | NestJS 11 + TypeORM | 구현 완료 |
| DB | PostgreSQL 16 + Redis 7 | 스키마 준비됨 |
| 크롤러 | Python (httpx, BS4) | API 코드 완성, DB 저장 미완 |
| 공유타입 | TypeScript | 완성 |
| 인증 | JWT + Passport | 구현 완료 |
| 인프라 | Docker Compose | 준비됨 |

## 3. 모노레포 구조 (npm workspaces)
```
doublewin/
├── apps/
│   ├── api/          # NestJS 백엔드
│   ├── mobile/       # React Native (Expo) 앱
│   └── crawler/      # Python 크롤러
├── packages/
│   └── shared/       # 공유 TypeScript 타입/인터페이스
├── docker-compose.yml  # PostgreSQL 16 + Redis 7
├── .env.example        # 환경변수 템플릿 (30+개)
└── package.json        # 워크스페이스 설정
```

## 4. 백엔드 (NestJS) - apps/api/

### DB 엔티티
- **User**: UUID, email, nickname, phone, profileImage, cashbackBalance, totalEarned, totalWithdrawn, bankName/accountNumber/accountHolder
- **Product**: UUID, platform(coupang|naver|11st), externalId, title, price, originalPrice, discountRate, imageUrl, productUrl, affiliateUrl, cashbackRate/Amount, rating, reviewCount
- **ClickLog**: userId, productId, platform, affiliateUrl, purchaseConfirmed
- **CashbackTransaction**: userId, productId, platform, orderAmount, commissionAmount, cashbackAmount, status(pending|confirmed|paid|cancelled)
- **WithdrawalRequest**: userId, amount, bankName, accountNumber, accountHolder, status(requested|processing|completed|rejected), rejectionReason
- **AppSettings**: minWithdrawalAmount(5000), defaultCashbackRate(50%), platformRates(JSONB), maintenanceMode

### API 엔드포인트
- `POST /auth/register` - 회원가입 (bcrypt 해싱)
- `POST /auth/login` - 로그인 (JWT 발급, 7일 만료)
- `GET /users/me` - 프로필 조회 (JWT 필요)
- `GET /products` - 상품 목록 (platform/category/keyword 필터, 페이지네이션)
- `GET /products/:id` - 상품 상세
- `POST /products/:id/click` - 클릭 추적 → 어필리에이트 URL 반환 (JWT 필요)
- `GET /cashback/history` - 캐시백 내역 (JWT 필요)
- `POST /withdrawal/request` - 출금 요청 (최소금액 검증, 잔액 차감)
- `GET /withdrawal/history` - 출금 내역 (JWT 필요)
- `GET /settings` - 앱 설정 조회
- `PATCH /settings` - 앱 설정 수정 (관리자 전용 - Guard 미구현)

## 5. 모바일 (React Native Expo) - apps/mobile/

### 화면 구성
- **탭 네비게이션**: 홈, 검색, 캐시백, 마이페이지
- **홈**: 캐시백 요약 카드, 카테고리(8개), 플랫폼 필터, 상품 그리드(2열)
- **검색**: 검색바, 인기 키워드(8개), 플랫폼 필터, 검색 결과 그리드
- **캐시백**: 잔액 표시, 출금 버튼, 적립/출금 내역 탭 전환
- **마이페이지**: 프로필, 미니 요약, 메뉴 섹션(쇼핑/캐시백/고객지원/설정), 로그아웃
- **로그인/회원가입**: 이메일 로그인, 소셜 로그인 UI(카카오/네이버/구글 - 미구현)
- **상품 상세**: 상품 정보, 캐시백 안내, 구매 버튼

### 컴포넌트
- **ProductCard**: 플랫폼 배지, 가격/할인, 캐시백 표시
- **PlatformFilter**: 가로 스크롤 칩 셀렉터

### 디자인 시스템 (theme.ts)
- Primary: #FF6B35 (오렌지)
- 플랫폼 색상: 쿠팡(#E4002B), 네이버(#03C75A), 11번가(#FF0038)
- 폰트/스페이싱/보더 스케일 정의됨

### API 클라이언트
- SecureStore로 JWT 토큰 관리
- `api<T>()` 제네릭 fetch 래퍼 (Bearer 자동 추가)
- auth/products/cashback 서비스 파일 존재 (호출부 연동 미완)

## 6. 크롤러 (Python) - apps/crawler/

### 구조
- **BaseCrawler**: 추상 클래스 (fetch_products, generate_affiliate_link, run)
- **CoupangCrawler**: HMAC-SHA256 인증, 상품 검색/딥링크 생성
- **NaverCrawler**: Client-ID/Secret 헤더, 상품 검색, 쿼리파라미터 방식 어필리에이트
- **EleventhStCrawler**: API Key 쿼리, XML 파싱, 어필리에이트 링크 미구현

### 카테고리
기본 크롤링 대상: 패션, 전자제품, 생활용품, 식품, 뷰티

## 7. 공유 타입 (packages/shared)

### Enum
- Platform: COUPANG, NAVER, ELEVENTH_ST
- CashbackStatus: PENDING, CONFIRMED, PAID, CANCELLED
- WithdrawalStatus: REQUESTED, PROCESSING, COMPLETED, REJECTED

### Interface
- User, Product, ClickLog, CashbackTransaction, WithdrawalRequest, AppSettings
- ApiResponse<T>, PaginatedResponse<T>

## 8. 환경변수 (.env.example)
- DB: PostgreSQL 호스트/포트/인증정보
- Redis 설정
- JWT_SECRET, JWT_EXPIRATION
- 외부 API: COUPANG_ACCESS_KEY/SECRET, NAVER_CLIENT_ID/SECRET, ELEVENTH_ST_API_KEY
- CASHBACK_RATE_PERCENT=50, MIN_WITHDRAWAL_AMOUNT=5000

## 9. 완료된 항목
1. ~~**모바일 ↔ API 연동**~~: 전체 화면 API 연동 완료 (홈, 검색, 캐시백, 마이페이지, 상품상세, 로그인/회원가입)
2. ~~**크롤러 → DB 저장**~~: PostgreSQL UPSERT 구현 완료 (db/repository.py)
3. ~~**관리자 인증 Guard**~~: AdminGuard + JwtAuthGuard 적용 완료
4. ~~**11번가 어필리에이트 링크 생성**~~: CPA 방식 구현 완료 (ELEVENTH_AFFILIATE_ID 환경변수)
5. ~~**크롤러 스케줄러**~~: schedule 모드 구현 완료 (main.py, CRAWLER_INTERVAL_HOURS)
6. ~~**마이페이지 라우트 연결**~~: 캐시백 내역/출금 관리 라우트 연결 완료
7. ~~**출금 처리 관리자 API**~~: 관리자 출금 승인/거절 API 완료 (withdrawal/admin/*)
8. ~~**구매 확정 웹훅**~~: POST /cashback/webhook/confirm 엔드포인트 완료

## 10. 추가 완료 항목
9. ~~**관리자 대시보드 웹앱**~~: Next.js (apps/admin) - 대시보드, 출금관리, 캐시백관리, 설정 페이지 완료
10. ~~**찜한 상품 / 최근 본 상품**~~: 백엔드 API + 모바일 화면 완료 (Wishlist 엔티티, /products/user/wishlist, /products/user/recent)

## 11. 추가 완료 항목 (2차)
11. ~~**소셜 로그인**~~: 카카오/네이버/구글 OAuth - 백엔드 API + 모바일 연동 완료
12. ~~**푸시 알림**~~: expo-notifications 설정, 푸시 토큰 서버 등록 완료
13. ~~**e2e 테스트**~~: 17개 테스트 케이스 (Auth, Users, Products, Settings, Cashback, Withdrawal)

## 12. 추가 완료 항목 (3차)
14. ~~**서버사이드 푸시 발송**~~: PushNotificationService (Expo Push API), 캐시백 확정/출금 완료/거절 시 자동 발송
15. ~~**프로필 편집**~~: PATCH /users/me API + 프로필 수정/계좌 관리 모바일 화면
16. ~~**배포 설정**~~: Dockerfile (api, admin), docker-compose.yml 전체 서비스 구성

## 13. 추가 완료 항목 (4차)
17. ~~**모바일 패키지 보강**~~: expo-notifications, expo-device, expo-auth-session, expo-crypto 설치
18. ~~**소셜 로그인 SDK 수정**~~: startAsync → openAuthSessionAsync (Expo 55 호환)
19. ~~**GitHub Actions CI/CD**~~: API 테스트, Admin 빌드, TypeScript 체크 워크플로우
20. ~~**출금 개선**~~: 계좌 미등록 시 등록 화면 유도, 등록된 계좌 자동 사용
21. ~~**Nginx 리버스 프록시**~~: api.doublewin.co.kr / admin.doublewin.co.kr
22. ~~**크롤러 Docker**~~: Dockerfile + docker-compose 통합

## 14. 프로젝트 완료 상태
모든 기능 구현 및 배포 파이프라인 완료.

### 아키텍처
```
[모바일 앱] → [API :3000] → [PostgreSQL + Redis]
                  ↑
[크롤러] --------→|
                  ↑
[관리자 :3001] ---→|
                  ↑
[Nginx :80] -----→|  (프로덕션)
```

### 실행 방법
```bash
# 개발 환경
docker-compose up -d postgres redis  # DB만
npm run api                           # 백엔드 :3000
npm run admin                         # 관리자 :3001
npm run mobile                        # 모바일 앱
npm run crawler                       # 크롤러

# 프로덕션 (전체)
docker-compose up -d                  # DB + API + Admin + Crawler
docker-compose --profile production up -d  # + Nginx

# 테스트
cd apps/api && npx jest --config test/jest-e2e.json
```

## 10. 실행 명령어
```bash
# Docker (DB)
docker-compose up -d

# 백엔드
npm run api

# 모바일
npm run mobile

# 크롤러
npm run crawler

# DB 마이그레이션
npm run db:migrate
```
