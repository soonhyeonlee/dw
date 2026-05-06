# DoubleWin 프로젝트 핸드오프

## 프로젝트 구조

```
doublewin/
├── apps/
│   ├── api/           # NestJS 백엔드 (:3000)
│   ├── admin/         # Next.js 관리자 대시보드 (:3001)
│   ├── mobile/        # React Native (Expo) 모바일 앱
│   └── crawler/       # Python 크롤러
├── packages/
│   └── shared/        # 공유 TypeScript 타입
├── .github/workflows/ # CI/CD (GitHub Actions)
├── docker-compose.yml # PostgreSQL + Redis + API + Admin + Crawler + Nginx
├── nginx.conf         # 리버스 프록시 설정
└── .env.example       # 환경변수 템플릿
```

## 빠른 시작

```bash
# 1. 환경변수
cp .env.example .env   # 필요한 값 채우기

# 2. DB 실행
docker-compose up -d postgres redis

# 3. 의존성 설치
npm install

# 4. 관리자 계정 생성
npm run seed

# 5. 서버 실행
npm run api      # 백엔드 → http://localhost:3000
npm run admin    # 관리자 → http://localhost:3001
npm run mobile   # 모바일 앱
npm run crawler  # 크롤러 (1회 실행)
```

## API 문서

개발 환경: http://localhost:3000/docs (Swagger)

## 구현 완료 기능

### 백엔드 (NestJS)
- JWT 인증 (회원가입/로그인/소셜 로그인)
- 상품 CRUD, 클릭 추적, 찜하기, 최근 본 상품
- 캐시백 트랜잭션 (생성/확정/취소)
- 출금 요청/승인/거절 (잔액 자동 관리)
- 구매 확정 웹훅 (x-webhook-secret 인증)
- 관리자 Guard + 관리자 전용 API
- 앱 설정 관리 (최소 출금액, 캐시백 비율 등)
- 푸시 알림 서버사이드 발송 (Expo Push API)
- Health check (/health), Swagger API 문서 (/docs)

### 모바일 (React Native Expo)
- 홈 (상품 추천, 캐시백 요약, 카테고리, Pull to Refresh)
- 검색 (키워드/플랫폼 필터, 무한 스크롤)
- 캐시백 (적립/출금 내역, 출금 요청, 계좌 미등록 시 유도)
- 마이페이지 (프로필/계좌 수정, 찜한 상품, 최근 본 상품)
- 상품 상세 (API 연동, 클릭 추적, 찜하기 토글)
- 로그인/회원가입 (이메일 + 카카오/네이버/구글 소셜)
- 푸시 알림 (권한 요청, 토큰 서버 등록)
- ErrorBoundary 적용

### 관리자 대시보드 (Next.js)
- 로그인 (관리자 role 체크)
- 대시보드 (대기 중 출금/캐시백 카운트)
- 출금 관리 (목록/필터/승인/거절)
- 캐시백 관리 (목록/필터/확정/취소)
- 앱 설정 (최소 출금액, 캐시백 비율, 유지보수 모드)

### 크롤러 (Python)
- 쿠팡 (HMAC 인증, 상품 검색 + 딥링크 생성)
- 네이버 (Client ID/Secret, 어필리에이트 URL)
- 11번가 (XML API, 어필리에이트 ID 기반 URL)
- DB 저장 (PostgreSQL UPSERT)
- 스케줄러 (6시간 간격 자동 실행)

### 인프라
- Docker Compose (PostgreSQL + Redis + API + Admin + Crawler + Nginx)
- GitHub Actions CI (API 테스트 + Admin 빌드 + TypeScript 체크)
- EAS Build 설정 (모바일 빌드)
- Nginx 리버스 프록시

## 테스트

```bash
cd apps/api && npx jest --config test/jest-e2e.json
# 17 tests passing
```

## 프로덕션 배포

```bash
# 전체 서비스
docker-compose up -d

# Nginx 포함 (도메인 설정 후)
docker-compose --profile production up -d
```

## 환경변수 (주요)

| 변수 | 설명 |
|------|------|
| JWT_SECRET | JWT 서명 비밀키 |
| WEBHOOK_SECRET | 구매 확정 웹훅 인증키 |
| COUPANG_ACCESS_KEY/SECRET | 쿠팡파트너스 API |
| NAVER_CLIENT_ID/SECRET | 네이버 쇼핑 API |
| ELEVENTH_API_KEY | 11번가 OPEN API |
| KAKAO_CLIENT_ID | 카카오 소셜 로그인 |
| GOOGLE_CLIENT_ID | 구글 소셜 로그인 |
